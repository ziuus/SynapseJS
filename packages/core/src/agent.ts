import { AgentConfig, AgentResponse, Tool } from './types';
import { ToolRegistry } from './tool-registry';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';

export class Agent {
  private config: AgentConfig;
  public tools: ToolRegistry;

  constructor(config: AgentConfig) {
    this.config = config;
    this.tools = new ToolRegistry();
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
  async run(prompt: string, context?: any): Promise<AgentResponse> {
    console.log(`[AxonJS] Agent running with prompt: "${prompt}"`);

    if (!this.config.apiKey && this.config.llmProvider !== 'mock') {
        throw new Error(`AxonJS Error: OpenAPI/Gemini key is missing in config.`);
    }

    if (this.config.llmProvider === 'openai') {
      return this.runOpenAI(prompt, context);
    }

    if (this.config.llmProvider === 'gemini') {
      return this.runGemini(prompt, context);
    }

    throw new Error(`Provider ${this.config.llmProvider} is not implemented yet.`);
  }

  /**
   * Translates the Axon Tool Registry into the format expected by the AI SDK.
   */
  private getAITools() {
    const aiTools: Record<string, any> = {};
    for (const tool of this.tools.getAllTools()) {
      aiTools[tool.name] = {
        description: tool.description,
        parameters: tool.schema,
      };
    }
    return aiTools;
  }

  /**
   * The semantic execution loop using Google Gemini via the AI SDK.
   */
  private async runGemini(prompt: string, context?: any): Promise<AgentResponse> {
    const google = createGoogleGenerativeAI({
      apiKey: this.config.apiKey,
    });

    const response = await generateText({
      model: google('gemini-1.5-flash'),
      system: 'You are an intelligent frontend application agent. You have access to tools that control the application state and UI. Use them to fulfill the user request.',
      prompt: prompt,
      tools: this.getAITools(),
    });

    return this.processSDKResponse(response);
  }

  /**
   * The real execution loop using OpenAI via the AI SDK.
   */
  private async runOpenAI(prompt: string, context?: any): Promise<AgentResponse> {
    const openai = createOpenAI({
      apiKey: this.config.apiKey,
    });

    const response = await generateText({
      model: openai('gpt-4o-mini'),
      system: 'You are an intelligent frontend application agent. You have access to tools that control the application state and UI. Use them to fulfill the user request.',
      prompt: prompt,
      tools: this.getAITools(),
    });

    return this.processSDKResponse(response);
  }

  /**
   * Reusable method to parse the AI SDK response and execute local tools
   */
  private async processSDKResponse(response: any): Promise<AgentResponse> {
    const toolCallsFromLLM: { name: string; args: any }[] = [];
    
    if (response.toolCalls && response.toolCalls.length > 0) {
      for (const call of response.toolCalls) {
        const args = (call as any).args || {};
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
      toolCalls: toolCallsFromLLM,
    };
  }
}

// Factory function
export function createAgent(config: AgentConfig): Agent {
  return new Agent(config);
}
