"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  Agent: () => Agent,
  ToolRegistry: () => ToolRegistry,
  createAgent: () => createAgent
});
module.exports = __toCommonJS(index_exports);

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
var import_ai = require("ai");
var import_openai = require("@ai-sdk/openai");
var import_google = require("@ai-sdk/google");
var Agent = class {
  config;
  tools;
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
   * Primary method to trigger the agent's reasoning loop.
   */
  async run(prompt, context) {
    console.log(`[AxonJS] Agent running with prompt: "${prompt}"`);
    if (!this.config.apiKey && this.config.llmProvider !== "mock") {
      throw new Error(`AxonJS Error: OpenAPI/Gemini key is missing in config.`);
    }
    if (this.config.llmProvider === "openai") {
      return this.runOpenAI(prompt, context);
    }
    if (this.config.llmProvider === "gemini") {
      return this.runGemini(prompt, context);
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
   * The semantic execution loop using Google Gemini via the AI SDK.
   */
  async runGemini(prompt, context) {
    const google = (0, import_google.createGoogleGenerativeAI)({
      apiKey: this.config.apiKey
    });
    const response = await (0, import_ai.generateText)({
      model: google("gemini-1.5-flash"),
      system: "You are an intelligent frontend application agent. You have access to tools that control the application state and UI. Use them to fulfill the user request.",
      prompt,
      tools: this.getAITools()
    });
    return this.processSDKResponse(response);
  }
  /**
   * The real execution loop using OpenAI via the AI SDK.
   */
  async runOpenAI(prompt, context) {
    const openai = (0, import_openai.createOpenAI)({
      apiKey: this.config.apiKey
    });
    const response = await (0, import_ai.generateText)({
      model: openai("gpt-4o-mini"),
      system: "You are an intelligent frontend application agent. You have access to tools that control the application state and UI. Use them to fulfill the user request.",
      prompt,
      tools: this.getAITools()
    });
    return this.processSDKResponse(response);
  }
  /**
   * Reusable method to parse the AI SDK response and execute local tools
   */
  async processSDKResponse(response) {
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Agent,
  ToolRegistry,
  createAgent
});
