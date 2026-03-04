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

// src/agent.ts
var import_ai = require("ai");

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
    const parsedArgs = tool.schema ? tool.schema.parse(args) : args;
    return tool.execute(parsedArgs);
  }
};

// src/agent.ts
var import_openai = require("@ai-sdk/openai");
var import_google = require("@ai-sdk/google");
var import_groq = require("@ai-sdk/groq");
var import_zod = require("zod");
var Agent = class {
  config;
  tools;
  constructor(config) {
    this.config = config;
    this.tools = new ToolRegistry();
    this.tools.register({
      name: "interactWithScreen",
      description: 'Interact with the user interface. You MUST provide the exact "elementId" from the current DOM state, an "action" (click/type), and a "value" if typing.',
      schema: import_zod.z.object({
        elementId: import_zod.z.string(),
        action: import_zod.z.enum(["click", "type"]),
        value: import_zod.z.string().optional()
      }),
      execute: async ({ elementId, action, value }) => {
        return {
          _axonSignal: "UI_INTERACTION",
          payload: { elementId, action, value }
        };
      }
    });
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
  async run(messages, context) {
    console.log(`[AxonJS] Agent running with ${messages.length} messages`);
    if (!this.config.apiKey && this.config.llmProvider !== "mock") {
      throw new Error(`AxonJS Error: OpenAPI/Gemini key is missing in config.`);
    }
    if (this.config.llmProvider === "openai") {
      return this.runOpenAI(messages, context);
    }
    if (this.config.llmProvider === "gemini") {
      return this.runGemini(messages, context);
    }
    if (this.config.llmProvider === "groq") {
      return this.runGroq(messages, context);
    }
    throw new Error(`Provider ${this.config.llmProvider} is not implemented yet.`);
  }
  /**
   * Translates the Axon Tool Registry into the format expected by the AI SDK.
   */
  getAITools() {
    const aiTools = {};
    for (const t of this.tools.getAllTools()) {
      aiTools[t.name] = {
        description: t.description,
        parameters: {
          kind: "object",
          safeParse: (input) => ({ success: true, data: input })
        },
        execute: async (args) => {
          console.log(`[AxonJS] Tool Executing: ${t.name} | Args:`, JSON.stringify(args));
          return await this.tools.execute(t.name, args);
        }
      };
    }
    return aiTools;
  }
  /**
   * The semantic execution loop using Google Gemini via the AI SDK.
   */
  async runGemini(messages, context) {
    const google = (0, import_google.createGoogleGenerativeAI)({
      apiKey: this.config.apiKey
    });
    const defaultSystem = `You are Axon, an intelligent UI Agent. 
You have access to 'interactWithScreen' to control the application.
You will be provided with a 'Current Live DOM State' in the context as a JSON list.
To interact with the UI, you MUST find the exact 'id' of the element in that JSON and pass it to 'interactWithScreen'.
If you are asked about the state (like cart count), look for elements in the DOM state with descriptive text or IDs like 'cart-status'.
Always respond to the user after performing actions.`;
    const response = await (0, import_ai.generateText)({
      model: google(this.config.model || "gemini-2.5-flash"),
      system: this.config.systemPrompt || defaultSystem,
      messages,
      tools: this.getAITools(),
      maxSteps: this.config.maxSteps || 5
    });
    const allToolCalls = (response.steps || []).flatMap(
      (step) => (step.toolCalls || []).map((tc) => ({ name: tc.toolName, args: tc.args }))
    );
    return {
      text: response.text.trim(),
      toolCalls: allToolCalls
    };
  }
  /**
   * The semantic execution loop using Groq via the AI SDK.
   */
  /**
   * The semantic execution loop using Groq via the AI SDK.
   */
  async runGroq(messages, context) {
    const groq = (0, import_groq.createGroq)({
      apiKey: this.config.apiKey
    });
    const defaultSystem = `You are Axon, an intelligent UI Agent. 
You have access to 'interactWithScreen' to control the application.
You will be provided with a 'Current Live DOM State' in the context as a JSON list. 
To interact with the UI, you MUST find the exact 'id' of the element in that JSON and pass it to 'interactWithScreen'.
If you are asked about the state (like cart count), look for elements in the DOM state with descriptive text or IDs like 'cart-status'.
Always respond to the user after performing actions.`;
    const response = await (0, import_ai.generateText)({
      model: groq(this.config.model || "llama-3.3-70b-versatile"),
      system: this.config.systemPrompt || defaultSystem,
      messages,
      tools: this.getAITools(),
      maxSteps: this.config.maxSteps || 5
    });
    const allToolCalls = (response.steps || []).flatMap(
      (step) => (step.toolCalls || []).map((tc) => ({ name: tc.toolName, args: tc.args }))
    );
    return {
      text: response.text.trim(),
      toolCalls: allToolCalls
    };
  }
  /**
   * The semantic execution loop using OpenAI via the AI SDK.
   */
  async runOpenAI(messages, context) {
    const openai = (0, import_openai.createOpenAI)({
      apiKey: this.config.apiKey
    });
    const defaultSystem = `You are Axon, an intelligent UI Agent. 
You have access to 'interactWithScreen' to control the application.
You will be provided with a 'Current Live DOM State' in the context as a JSON list. 
To interact with the UI, you MUST find the exact 'id' of the element in that JSON and pass it to 'interactWithScreen'.
If you are asked about the state (like cart count), look for elements in the DOM state with descriptive text or IDs like 'cart-status'.
Always respond to the user after performing actions.`;
    const response = await (0, import_ai.generateText)({
      model: openai(this.config.model || "gpt-4o-mini"),
      system: this.config.systemPrompt || defaultSystem,
      messages,
      tools: this.getAITools(),
      maxSteps: this.config.maxSteps || 5
    });
    const allToolCalls = (response.steps || []).flatMap(
      (step) => (step.toolCalls || []).map((tc) => ({ name: tc.toolName, args: tc.args }))
    );
    return {
      text: response.text.trim(),
      toolCalls: allToolCalls
    };
  }
  /**
   * Reusable method to parse the AI SDK response and execute local tools
   */
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
