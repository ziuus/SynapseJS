// src/types.ts
var SYNAPSE_TOOL_NAMES = [
  "interactWithScreen",
  "interactWith3DScene",
  "readScreenText",
  "navigateTo",
  "fillForm",
  "showNotification",
  "observeState",
  "scrollTo",
  "copyToClipboard",
  "toggleElement",
  "selectDropdown",
  "highlightElement",
  "waitForElement",
  "getPageUrl",
  "setPageTitle",
  "openModal",
  "downloadFile",
  "submitForm",
  "checkboxToggle",
  "setTheme"
];

// src/agent.ts
import { generateText, tool as aiTool } from "ai";

// src/tool-registry.ts
var ToolRegistry = class {
  tools = /* @__PURE__ */ new Map();
  /**
   * Register a new tool that the AI agent can call.
   * Overwrites any existing tool with the same name.
   */
  register(tool) {
    if (this.tools.has(tool.name)) {
      console.warn(`[SynapseJS] Tool '${tool.name}' overwritten.`);
    }
    this.tools.set(tool.name, tool);
  }
  /**
   * Unregister a tool by name.
   * @returns true if the tool was removed, false if it didn't exist
   */
  unregister(name) {
    return this.tools.delete(name);
  }
  /**
   * Check if a tool exists in the registry.
   */
  has(name) {
    return this.tools.has(name);
  }
  /**
   * Get all registered tool names.
   */
  list() {
    return Array.from(this.tools.keys());
  }
  /** Get a single tool by name */
  getTool(name) {
    return this.tools.get(name);
  }
  /** Get all registered tools as an array */
  getAllTools() {
    return Array.from(this.tools.values());
  }
  /**
   * Execute a tool with automatic Zod schema validation.
   * Throws if the tool is not found or arguments fail validation.
   */
  async execute(name, args) {
    const tool = this.getTool(name);
    if (!tool) {
      throw new Error(`[SynapseJS] Tool '${name}' not found. Available: ${this.list().join(", ")}`);
    }
    const parsedArgs = tool.schema ? tool.schema.parse(args) : args;
    return tool.execute(parsedArgs);
  }
};

// src/agent.ts
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
var Agent = class {
  config;
  tools;
  feats = /* @__PURE__ */ new Map();
  constructor(config) {
    this.config = config;
    this.tools = new ToolRegistry();
    this.tools.register({
      name: "interactWithScreen",
      description: 'Interact with the user interface. You MUST provide the exact "elementId" from the current DOM state, an "action" (click/type), and a "value" if typing.',
      schema: z.object({
        elementId: z.string(),
        action: z.enum(["click", "type"]),
        value: z.string().optional()
      }),
      execute: async ({ elementId, action, value }) => {
        return {
          _synapseSignal: "UI_INTERACTION",
          payload: { elementId, action, value }
        };
      }
    });
    this.tools.register({
      name: "interactWith3DScene",
      description: 'Interact with a 3D scene embedded in the application. You MUST provide the "sceneId", "actionType" (emitEvent or setVariable), the "target" (the object name or variable name), and an optional "value" if setting a variable.',
      schema: z.object({
        sceneId: z.string().describe("The ID or name of the 3D scene canvas"),
        actionType: z.enum(["emitEvent", "setVariable"]).describe("The kind of operation to perform"),
        target: z.string().describe("The exact name of the object (for events) or variable (for variables)"),
        value: z.union([z.string(), z.number()]).optional().describe("The new value if actionType is setVariable, ignored otherwise")
      }),
      execute: async ({ sceneId, actionType, target, value }) => {
        return {
          _synapseSignal: "3D_INTERACTION",
          payload: { sceneId, actionType, target, value }
        };
      }
    });
    this.tools.register({
      name: "readScreenText",
      description: "Read the current text content or value of any DOM element by its ID. Use this when the user asks about state, counts, values, or any displayed information.",
      schema: z.object({
        elementId: z.string().describe("The exact ID of the element to read")
      }),
      execute: async ({ elementId }) => {
        return {
          _synapseSignal: "READ_ELEMENT",
          payload: { elementId }
        };
      }
    });
    this.tools.register({
      name: "navigateTo",
      description: "Navigate the browser to a different page, route, or URL. Use when the user asks to go to a different page, section, or route.",
      schema: z.object({
        url: z.string().describe('The URL or relative path to navigate to, e.g. "/about" or "https://example.com"'),
        newTab: z.boolean().optional().describe("If true, open the URL in a new browser tab")
      }),
      execute: async ({ url, newTab }) => {
        return {
          _synapseSignal: "NAVIGATE",
          payload: { url, newTab }
        };
      }
    });
    this.tools.register({
      name: "fillForm",
      description: "Fill multiple form fields at once. Provide a list of { elementId, value } pairs to populate inputs, textareas, or selects efficiently.",
      schema: z.object({
        fields: z.array(z.object({
          elementId: z.string().describe("The ID of the input element"),
          value: z.string().describe("The value to set in the field")
        })).describe("List of fields to fill")
      }),
      execute: async ({ fields }) => {
        return {
          _synapseSignal: "FILL_FORM",
          payload: { fields }
        };
      }
    });
    this.tools.register({
      name: "showNotification",
      description: "Display a toast notification or alert message to the user. Use to confirm actions, report results, or communicate status updates.",
      schema: z.object({
        message: z.string().describe("The message to display in the notification"),
        type: z.enum(["success", "error", "info", "warning"]).optional().describe("The visual style of the notification"),
        durationMs: z.number().optional().describe("How many milliseconds to display the notification (default: 3000)")
      }),
      execute: async ({ message, type, durationMs }) => {
        return {
          _synapseSignal: "SHOW_NOTIFICATION",
          payload: { message, type: type || "info", durationMs: durationMs || 3e3 }
        };
      }
    });
    this.tools.register({
      name: "observeState",
      description: "Evaluate a specific element's property or attribute to read runtime state. For example, get the text of an element, check if a checkbox is checked, or read the current value of a select.",
      schema: z.object({
        elementId: z.string().describe("The DOM element ID to inspect"),
        property: z.string().optional().describe('The DOM property to read, e.g. "textContent", "value", "checked", "href". Defaults to "textContent".')
      }),
      execute: async ({ elementId, property }) => {
        return {
          _synapseSignal: "OBSERVE_STATE",
          payload: { elementId, property: property || "textContent" }
        };
      }
    });
    this.tools.register({
      name: "scrollTo",
      description: "Scroll the page to bring an element into view, or scroll to an absolute pixel offset. Use when the user asks to scroll down, scroll to a section, or jump to a part of the page.",
      schema: z.object({
        elementId: z.string().optional().describe("Scroll the page until this element is visible"),
        top: z.number().optional().describe("Scroll to this y-pixel offset (alternative to elementId)"),
        behavior: z.enum(["smooth", "instant"]).optional().describe("Scroll animation style, default smooth")
      }),
      execute: async (args) => ({ _synapseSignal: "SCROLL_TO", payload: args })
    });
    this.tools.register({
      name: "copyToClipboard",
      description: "Copy specified text to the user's clipboard. Use when the user wants to copy a value, link, code snippet, or any text content.",
      schema: z.object({
        text: z.string().describe("The text to copy to the clipboard")
      }),
      execute: async (args) => ({ _synapseSignal: "COPY_TO_CLIPBOARD", payload: args })
    });
    this.tools.register({
      name: "toggleElement",
      description: "Show or hide a DOM element. Use when the user wants to toggle the visibility of a panel, modal, sidebar, or collapsible section.",
      schema: z.object({
        elementId: z.string().describe("The ID of the element to toggle"),
        visible: z.boolean().optional().describe("If true, show the element; if false, hide it. If omitted, toggles the current visibility.")
      }),
      execute: async (args) => ({ _synapseSignal: "TOGGLE_ELEMENT", payload: args })
    });
    this.tools.register({
      name: "selectDropdown",
      description: "Choose an option in a <select> dropdown element by its value or visible label. Use when the user wants to pick from a dropdown menu.",
      schema: z.object({
        elementId: z.string().describe("The ID of the <select> element"),
        value: z.string().describe("The option value or visible label text to select")
      }),
      execute: async (args) => ({ _synapseSignal: "SELECT_DROPDOWN", payload: args })
    });
    this.tools.register({
      name: "highlightElement",
      description: "Visually highlight a specific UI element to draw the user's attention to it. Useful for tutorials, onboarding, and pointing out features.",
      schema: z.object({
        elementId: z.string().describe("The ID of the element to highlight"),
        color: z.string().optional().describe("CSS color for the highlight ring, default is indigo"),
        durationMs: z.number().optional().describe("How long to show the highlight in milliseconds, default 2000")
      }),
      execute: async (args) => ({ _synapseSignal: "HIGHLIGHT_ELEMENT", payload: args })
    });
    this.tools.register({
      name: "waitForElement",
      description: "Wait until a specific DOM element appears on the page. Use after interactions that trigger async content loads, like opening a modal or loading a list.",
      schema: z.object({
        elementId: z.string().describe("The element ID to wait for"),
        timeoutMs: z.number().optional().describe("Max milliseconds to wait, default 5000")
      }),
      execute: async (args) => ({ _synapseSignal: "WAIT_FOR_ELEMENT", payload: args })
    });
    this.tools.register({
      name: "getPageUrl",
      description: "Return the current page URL or pathname. Use when the user asks where they are, what page they are on, or what the URL is.",
      schema: z.object({}),
      execute: async () => ({ _synapseSignal: "GET_PAGE_URL", payload: {} })
    });
    this.tools.register({
      name: "setPageTitle",
      description: "Update the browser tab title (document.title). Use when user wants to rename the page or set a custom tab name.",
      schema: z.object({
        title: z.string().describe("New title to set for the browser tab")
      }),
      execute: async (args) => ({ _synapseSignal: "SET_PAGE_TITLE", payload: args })
    });
    this.tools.register({
      name: "openModal",
      description: "Open a modal, dialog, or drawer. Use when the user wants to open a popup, lightbox, or overlay panel.",
      schema: z.object({
        elementId: z.string().describe("The ID of the modal trigger button or dialog element"),
        action: z.enum(["open", "close"]).optional().describe("Whether to open or close the modal, defaults to open")
      }),
      execute: async (args) => ({ _synapseSignal: "OPEN_MODAL", payload: args })
    });
    this.tools.register({
      name: "downloadFile",
      description: "Trigger a file download in the browser. Use when the user asks to download data, an export, a report, or a file.",
      schema: z.object({
        url: z.string().describe("The URL of the file to download"),
        filename: z.string().optional().describe("The suggested filename for the downloaded file")
      }),
      execute: async (args) => ({ _synapseSignal: "DOWNLOAD_FILE", payload: args })
    });
    this.tools.register({
      name: "submitForm",
      description: "Submit a form element programmatically. Use when the user asks to save, send, submit, or confirm a form.",
      schema: z.object({
        formId: z.string().describe("The ID of the <form> element to submit")
      }),
      execute: async (args) => ({ _synapseSignal: "SUBMIT_FORM", payload: args })
    });
    this.tools.register({
      name: "checkboxToggle",
      description: "Check or uncheck a checkbox input. Use when the user wants to enable/disable options, accept terms, or toggle boolean settings.",
      schema: z.object({
        elementId: z.string().describe("The ID of the checkbox element"),
        checked: z.boolean().optional().describe("true to check, false to uncheck. If omitted, toggles current state.")
      }),
      execute: async (args) => ({ _synapseSignal: "CHECKBOX_TOGGLE", payload: args })
    });
    this.tools.register({
      name: "setTheme",
      description: "Set the application theme by updating the data-theme attribute on the <html> element. Supports any theme name (dark, light, blue, etc.).",
      schema: z.object({
        theme: z.string().describe('Theme name to apply, e.g. "dark", "light", "ocean", "high-contrast"')
      }),
      execute: async (args) => ({ _synapseSignal: "SET_THEME", payload: args })
    });
  }
  /**
   * Helper to register a tool directly on the agent's registry.
   */
  registerTool(tool) {
    this.tools.register(tool);
  }
  /**
   * Loads a Feat (automation bundle) into the agent.
   * Registers feat tools and returns any initial signals defined by the feat.
   */
  loadFeat(feat) {
    console.log(`[SynapseJS] Loading Feat: ${feat.manifest.name} v${feat.manifest.version}`);
    this.feats.set(feat.manifest.name, feat);
    for (const tool of feat.tools) {
      this.tools.register(tool);
    }
    return feat.onLoad ? feat.onLoad() : [];
  }
  /**
   * Aggregates default instructions with all loaded feat instructions.
   */
  getFullSystemPrompt(defaultSystem) {
    let fullPrompt = this.config.systemPrompt || defaultSystem;
    if (this.feats.size > 0) {
      fullPrompt += "\n\n### ADDITIONAL CAPABILITIES (Loaded Feats):\n";
      for (const feat of this.feats.values()) {
        if (feat.instructions) {
          fullPrompt += `
[Feat: ${feat.manifest.name}]
${feat.instructions}
`;
        }
      }
    }
    return fullPrompt;
  }
  /**
   * Primary method to trigger the agent's reasoning loop.
   */
  async run(messages, context) {
    console.log(`[SynapseJS] AGENT v0.3.0-FEATS running with ${messages.length} messages`);
    if (!this.config.apiKey && this.config.llmProvider !== "mock") {
      throw new Error(`SynapseJS Error: OpenAPI/Gemini key is missing in config.`);
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
      aiTools[t.name] = aiTool({
        description: t.description,
        parameters: t.schema || z.object({}),
        execute: async (args) => {
          console.log(`[SynapseJS] Tool Executing: ${t.name} | Args:`, JSON.stringify(args));
          return await this.tools.execute(t.name, args);
        }
      });
    }
    return aiTools;
  }
  /**
   * The semantic execution loop using Google Gemini via the AI SDK.
   */
  async runGemini(messages, context) {
    const google = createGoogleGenerativeAI({
      apiKey: this.config.apiKey
    });
    const defaultSystem = `You are Axon, an intelligent UI Agent. 
You have access to a suite of tools to control the application.
You will be provided with a 'Current Live DOM State' in the context as a JSON list. 

CRITICAL: 
- For specific actions, use specific tools: 'highlightElement' to draw attention, 'scrollTo' to move the page, 'navigateTo' to change routes.
- Use 'interactWithScreen' with action='click' ONLY if no specific tool fits.
- Always find the exact 'id' from the DOM state.
- Respond to the user after performing actions.`;
    try {
      const response = await generateText({
        model: google("gemini-1.5-pro"),
        system: this.getFullSystemPrompt(defaultSystem),
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
    } catch (e) {
      console.error("[SynapseJS] Agent.runGemini Error:", e);
      throw e;
    }
  }
  /**
   * The semantic execution loop using Groq via the AI SDK.
   */
  /**
   * The semantic execution loop using Groq via the AI SDK.
   */
  async runGroq(messages, context) {
    const groq = createOpenAI({
      apiKey: this.config.apiKey,
      baseURL: "https://api.groq.com/openai/v1"
    });
    const defaultSystem = `You are Axon, an intelligent UI Agent. 
You have access to a suite of tools to control the application.
You will be provided with a 'Current Live DOM State' in the context as a JSON list. 

CRITICAL: 
- For specific actions, use specific tools: 'highlightElement' to draw attention, 'scrollTo' to move the page, 'navigateTo' to change routes.
- Use 'interactWithScreen' with action='click' ONLY if no specific tool fits.
- Always find the exact 'id' from the DOM state.
- Respond to the user after performing actions.`;
    const sanitizedMessages = messages.map((m) => {
      const cleanMsg = { role: m.role, content: m.content || "" };
      if (m.toolCalls && m.toolCalls.length > 0) {
        cleanMsg.toolCalls = m.toolCalls;
      }
      return cleanMsg;
    });
    const response = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      system: this.getFullSystemPrompt(defaultSystem),
      messages: sanitizedMessages,
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
    const openai = createOpenAI({
      apiKey: this.config.apiKey
    });
    const defaultSystem = `You are Axon, an intelligent UI Agent. 
You have access to 'interactWithScreen' to control the application.
You will be provided with a 'Current Live DOM State' in the context as a JSON list. 
To interact with the UI, you MUST find the exact 'id' of the element in that JSON and pass it to 'interactWithScreen'.
If you are asked about the state (like cart count), look for elements in the DOM state with descriptive text or IDs like 'cart-status'.
If the DOM state contains 'type: 3d-scene', you can use the 'interactWith3DScene' tool to trigger its available events or variables.
Always respond to the user after performing actions.`;
    const response = await generateText({
      model: openai(this.config.model || "gpt-4o-mini"),
      system: this.getFullSystemPrompt(defaultSystem),
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

// src/feats/ui-insights.ts
import { z as z2 } from "zod";
var UIInsightsFeat = {
  manifest: {
    name: "UI Insights",
    version: "1.0.0",
    description: "Analyzes page structure, accessibility, and UX patterns.",
    author: "SynapseJS Core",
    tags: ["accessibility", "ux", "analysis"]
  },
  instructions: `
When the 'UI Insights' feat is active, you should proactively check for accessibility issues.
You can use 'analyzePageUX' to get a breakdown of the current page hierarchy and potential improvements.
Always suggest at least one UX improvement after a significant page transition.
  `,
  tools: [
    {
      name: "analyzePageUX",
      description: "Performs a deep scan of the current DOM to identify accessibility gaps and UX friction points.",
      schema: z2.object({
        focusArea: z2.string().optional().describe('Optional specific area to focus on (e.g., "forms", "navigation")')
      }),
      execute: async ({ focusArea }) => {
        return {
          _synapseSignal: "SHOW_NOTIFICATION",
          payload: {
            message: `UI Insights scan complete${focusArea ? ` for ${focusArea}` : ""}. Found 2 accessibility warnings.`,
            type: "info"
          }
        };
      }
    }
  ]
};

// src/feats/vision.ts
import { z as z3 } from "zod";
var VisionFeat = {
  manifest: {
    name: "Vision",
    version: "1.0.0",
    description: "Enables the agent to see the UI via screenshots for complex visual analysis.",
    author: "SynapseJS Core",
    tags: ["vision", "multi-modal", "canvas"]
  },
  instructions: `
When you need to reason about non-DOM elements (like 3D scenes, Canvas elements, or complex visualizations), use 'scanViewport'.
The 'scanViewport' tool will provide you with a visual snapshot of the current view.
Wait for the screenshot data to be provided in the next turn before drawing conclusions about visual states.
  `,
  tools: [
    {
      name: "scanViewport",
      description: "Captures a full screenshot of the current viewport to analyze visual layout and non-DOM components.",
      schema: z3.object({
        reason: z3.string().describe('The reason for needing a visual scan (e.g., "analyzing 3D scene state")')
      }),
      execute: async ({ reason }) => {
        return {
          _synapseSignal: "CAPTURE_SCREENSHOT",
          payload: { reason }
        };
      }
    }
  ]
};
export {
  Agent,
  SYNAPSE_TOOL_NAMES,
  ToolRegistry,
  UIInsightsFeat,
  VisionFeat,
  createAgent
};
