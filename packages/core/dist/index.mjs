// src/tool-registry.ts
var ToolRegistry = class {
  tools = /* @__PURE__ */ new Map();
  /**
   * Registers a new tool that the AI agent can call.
   */
  register(tool) {
    if (this.tools.has(tool.name)) {
      console.warn(`Tool with name '${tool.name}' is already registered and will be overwritten.`);
    }
    this.tools.set(tool.name, tool);
  }
  /**
   * Gets a tool by name.
   */
  getTool(name) {
    return this.tools.get(name);
  }
  /**
   * Gets all registered tools.
   */
  getAllTools() {
    return Array.from(this.tools.values());
  }
  /**
   * Executes a tool with strict Zod validation.
   */
  async execute(name, args) {
    const tool = this.getTool(name);
    if (!tool) {
      throw new Error(`Tool '${name}' not found in registry.`);
    }
    console.log(`[AxonJS Validation] Validating arguments for ${name}...`);
    const parsedArgs = tool.schema.parse(args);
    return tool.execute(parsedArgs);
  }
};

// src/agent.ts
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { zodToJsonSchema } from "zod-to-json-schema";
import { CreateMLCEngine } from "@mlc-ai/web-llm";
var Agent = class {
  config;
  tools;
  browserEngine = null;
  isInitializingBrowser = false;
  constructor(config) {
    this.config = config;
    this.tools = new ToolRegistry();
  }
  /**
   * Helper to register a tool directly on the agent's registry.
   */
  registerTool(tool) {
    this.tools.register(tool);
  }
  /**
   * Initialize the WebLLM browser engine if requested. This downloads weights to cache.
   */
  async initializeBrowserEngine() {
    if (this.browserEngine) return;
    if (this.isInitializingBrowser) {
      while (this.isInitializingBrowser) {
        await new Promise((r) => setTimeout(r, 100));
      }
      return;
    }
    this.isInitializingBrowser = true;
    const modelId = this.config.browserModelId || "Phi-3-mini-4k-instruct-q4f16_1-MLC";
    console.log(`[AxonJS] Initializing browser engine with model: ${modelId}...`);
    this.browserEngine = await CreateMLCEngine(modelId, {
      initProgressCallback: (progress) => {
        if (this.config.onProgress) {
          this.config.onProgress({ text: progress.text, progress: progress.progress });
        }
      }
    });
    this.isInitializingBrowser = false;
    console.log(`[AxonJS] Browser engine initialized.`);
  }
  /**
   * Primary method to trigger the agent's reasoning loop.
   */
  async run(prompt, context) {
    console.log(`[AxonJS] Agent running with prompt: "${prompt}"`);
    if (this.config.llmProvider === "openai") {
      if (!this.config.apiKey) {
        throw new Error("AxonJS Error: OpenAPI key is missing in config.");
      }
      return this.runOpenAI(prompt, context);
    }
    if (this.config.llmProvider === "browser") {
      return this.runBrowser(prompt, context);
    }
    throw new Error(`Provider ${this.config.llmProvider} is not implemented yet.`);
  }
  /**
   * Translates the Axon Tool Registry into the format expected by the AI SDK.
   */
  getAITools() {
    const aiTools = {};
    for (const tool of this.tools.getAllTools()) {
      aiTools[tool.name] = {
        description: tool.description,
        parameters: tool.schema
      };
    }
    return aiTools;
  }
  /**
   * Translates the Axon Tool Registry into the OpenAI standard JSON schema expected by WebLLM.
   */
  getWebLLMTools() {
    const tools = [];
    for (const tool of this.tools.getAllTools()) {
      tools.push({
        type: "function",
        function: {
          name: tool.name,
          description: tool.description,
          // Strip the $schema wrapper added by zodToJsonSchema
          parameters: zodToJsonSchema(tool.schema)
        }
      });
    }
    return tools;
  }
  /**
   * The execution loop entirely in the browser using WebGPU.
   */
  async runBrowser(prompt, context) {
    await this.initializeBrowserEngine();
    if (!this.browserEngine) throw new Error("Engine failed to initialize");
    const response = await this.browserEngine.chat.completions.create({
      messages: [
        { role: "system", content: "You are an intelligent frontend application agent. You have access to tools that control the application state and UI. Use them to fulfill the user request." },
        { role: "user", content: prompt }
      ],
      tools: this.getWebLLMTools()
      // Cast to bypass strict WebLLM type definitions for schemas
    });
    const choice = response.choices[0];
    const toolCallsFromLLM = [];
    if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
      for (const call of choice.message.tool_calls) {
        const parsedArgs = JSON.parse(call.function.arguments);
        toolCallsFromLLM.push({ name: call.function.name, args: parsedArgs });
        try {
          await this.tools.execute(call.function.name, parsedArgs);
        } catch (error) {
          console.error(`[AxonJS Browser] Error executing tool ${call.function.name}:`, error);
        }
      }
    }
    return {
      text: choice.message.content || "",
      toolCalls: toolCallsFromLLM
    };
  }
  /**
   * The real execution loop using OpenAI via the AI SDK.
   */
  async runOpenAI(prompt, context) {
    const openai = createOpenAI({
      apiKey: this.config.apiKey
    });
    const response = await generateText({
      model: openai("gpt-4o-mini"),
      system: "You are an intelligent frontend application agent. You have access to tools that control the application state and UI. Use them to fulfill the user request.",
      prompt,
      tools: this.getAITools()
    });
    const toolCallsFromLLM = [];
    if (response.toolCalls && response.toolCalls.length > 0) {
      for (const call of response.toolCalls) {
        const args = call.args || {};
        toolCallsFromLLM.push({ name: call.toolName, args });
        try {
          await this.tools.execute(call.toolName, args);
        } catch (error) {
          console.error(`[AxonJS] Error executing tool ${call.toolName}:`, error);
        }
      }
    }
    return {
      text: response.text,
      toolCalls: toolCallsFromLLM
    };
  }
};
function createAgent(config) {
  return new Agent(config);
}
export {
  Agent,
  ToolRegistry,
  createAgent
};
