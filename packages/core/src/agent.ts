import { zodToJsonSchema } from 'zod-to-json-schema';
import { jsonSchema, generateText, tool as aiTool } from 'ai';
import { AgentConfig, AgentResponse, Tool, CoreMessage } from './types';
import { ToolRegistry } from './tool-registry';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';
import { z } from 'zod';

export class Agent {
  private config: AgentConfig;
  public tools: ToolRegistry;

  constructor(config: AgentConfig) {
    this.config = config;
    this.tools = new ToolRegistry();

    // Automatically inject the universal Unbounded UI tool
    this.tools.register({
      name: 'interactWithScreen',
      description: 'Interact with the user interface. You MUST provide the exact "elementId" from the current DOM state, an "action" (click/type), and a "value" if typing.',
      schema: z.object({
        elementId: z.string(),
        action: z.enum(['click', 'type']),
        value: z.string().optional()
      }) as any,
      execute: async ({ elementId, action, value }: any) => {
        return {
          _axonSignal: 'UI_INTERACTION',
          payload: { elementId, action, value }
        };
      }
    });
  }

  /**
   * Helper to register a tool directly on the agent's registry.
   */
  registerTool<TArgs extends z.ZodTypeAny = any, TResult = any>(tool: Tool<TArgs, TResult>) {
    this.tools.register(tool);
  }

  /**
   * Primary method to trigger the agent's reasoning loop.
   */
  async run(messages: CoreMessage[], context?: any): Promise<AgentResponse> {
    console.log(`[AxonJS] AGENT VERSION 2.0.0-FIX running with ${messages.length} messages`);

    if (!this.config.apiKey && this.config.llmProvider !== 'mock') {
        throw new Error(`AxonJS Error: OpenAPI/Gemini key is missing in config.`);
    }

    if (this.config.llmProvider === 'openai') {
      return this.runOpenAI(messages, context);
    }

    if (this.config.llmProvider === 'gemini') {
      return this.runGemini(messages, context);
    }

    if (this.config.llmProvider === 'groq') {
      return this.runGroq(messages, context);
    }

    throw new Error(`Provider ${this.config.llmProvider} is not implemented yet.`);
  }

  /**
   * Translates the Axon Tool Registry into the format expected by the AI SDK.
   */
  private getAITools() {
    const aiTools: Record<string, any> = {};
    for (const t of this.tools.getAllTools()) {
      aiTools[t.name] = (aiTool as any)({
        description: t.description,
        parameters: t.schema || z.object({}).passthrough(),
        execute: async (args: any) => {
          console.log(`[AxonJS] Tool Executing: ${t.name} | Args:`, JSON.stringify(args));
          return await this.tools.execute(t.name, args);
        }
      });
    }
    return aiTools;
  }

  /**
   * The semantic execution loop using Google Gemini via the AI SDK.
   */
  private async runGemini(messages: CoreMessage[], context?: any): Promise<AgentResponse> {
    const google = createGoogleGenerativeAI({
      apiKey: this.config.apiKey,
    });

    const defaultSystem = `You are Axon, an intelligent UI Agent. 
You have access to 'interactWithScreen' to control the application.
You will be provided with a 'Current Live DOM State' in the context as a JSON list.
To interact with the UI, you MUST find the exact 'id' of the element in that JSON and pass it to 'interactWithScreen'.
If you are asked about the state (like cart count), look for elements in the DOM state with descriptive text or IDs like 'cart-status'.
Always respond to the user after performing actions.`;

    const response = await (generateText as any)({
      model: google(this.config.model || 'gemini-2.5-flash'),
      system: this.config.systemPrompt || defaultSystem,
      messages: messages as any,
      tools: this.getAITools(),
      maxSteps: this.config.maxSteps || 5,
    });

    const allToolCalls = (response.steps || []).flatMap((step: any) => 
       (step.toolCalls || []).map((tc: any) => ({ name: tc.toolName, args: tc.args }))
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
  private async runGroq(messages: CoreMessage[], context?: any): Promise<AgentResponse> {
    const rawTools = this.tools.getAllTools();
    const groq = createOpenAI({
      apiKey: this.config.apiKey,
      baseURL: 'https://api.groq.com/openai/v1',
      fetch: async (url, options) => {
        if (!options?.body) return fetch(url, options);
        try {
          const body = JSON.parse(options.body as string);
          if (body.tools) {
            body.tools = body.tools.map((t: any) => {
              if (t.type === 'function' && t.function && t.function.name) {
                const toolDef = rawTools.find(rt => rt.name === t.function.name);
                if (toolDef && toolDef.schema) {
                  const correctSchema = zodToJsonSchema(toolDef.schema as any) as any;
                  delete correctSchema['$schema'];
                  console.log(`[AxonJS SDK Fix] Replacing ${t.function.name} schema. Original:`, JSON.stringify(t.function.parameters), 'New:', JSON.stringify(correctSchema));
                  t.function.parameters = correctSchema;
                }
              }
              return t;
            });
          }
          options.body = JSON.stringify(body);
        } catch (e) {
          console.error('[AxonJS] Fetch Interceptor JSON Parse Error:', e);
        }
        return fetch(url, options);
      }
    });

    const defaultSystem = `You are Axon, an intelligent UI Agent. 
You have access to 'interactWithScreen' to control the application.
You will be provided with a 'Current Live DOM State' in the context as a JSON list. 
To interact with the UI, you MUST find the exact 'id' of the element in that JSON and pass it to 'interactWithScreen'.
If you are asked about the state (like cart count), look for elements in the DOM state with descriptive text or IDs like 'cart-status'.
Always respond to the user after performing actions.`;

    const response = await (generateText as any)({
      model: groq(this.config.model || 'llama-3.3-70b-versatile'),
      system: this.config.systemPrompt || defaultSystem,
      messages: messages as any,
      tools: this.getAITools(),
      maxSteps: this.config.maxSteps || 5,
    });

    const allToolCalls = (response.steps || []).flatMap((step: any) => 
       (step.toolCalls || []).map((tc: any) => ({ name: tc.toolName, args: tc.args }))
    );

    return { 
      text: response.text.trim(), 
      toolCalls: allToolCalls 
    };
  }

  /**
   * The semantic execution loop using OpenAI via the AI SDK.
   */
  private async runOpenAI(messages: CoreMessage[], context?: any): Promise<AgentResponse> {
    const openai = createOpenAI({
      apiKey: this.config.apiKey,
    });

    const defaultSystem = `You are Axon, an intelligent UI Agent. 
You have access to 'interactWithScreen' to control the application.
You will be provided with a 'Current Live DOM State' in the context as a JSON list. 
To interact with the UI, you MUST find the exact 'id' of the element in that JSON and pass it to 'interactWithScreen'.
If you are asked about the state (like cart count), look for elements in the DOM state with descriptive text or IDs like 'cart-status'.
Always respond to the user after performing actions.`;

    const response = await (generateText as any)({
      model: openai(this.config.model || 'gpt-4o-mini'),
      system: this.config.systemPrompt || defaultSystem,
      messages: messages as any,
      tools: this.getAITools(),
      maxSteps: this.config.maxSteps || 5,
    });

    const allToolCalls = (response.steps || []).flatMap((step: any) => 
       (step.toolCalls || []).map((tc: any) => ({ name: tc.toolName, args: tc.args }))
    );

    return { 
      text: response.text.trim(), 
      toolCalls: allToolCalls 
    };
  }

  /**
   * Reusable method to parse the AI SDK response and execute local tools
   */

}

// Factory function
export function createAgent(config: AgentConfig): Agent {
  return new Agent(config);
}
