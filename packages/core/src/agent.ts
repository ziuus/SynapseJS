import { AgentConfig, AgentResponse, Tool } from './types';
import { ToolRegistry } from './tool-registry';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { z } from 'zod';
import { CreateMLCEngine, MLCEngine } from '@mlc-ai/web-llm';

export class Agent {
  private config: AgentConfig;
  public tools: ToolRegistry;
  private browserEngine: MLCEngine | null = null;
  private isInitializingBrowser = false;

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
   * Initialize the WebLLM browser engine if requested. This downloads weights to cache.
   */
  async initializeBrowserEngine() {
    if (this.browserEngine) return;
    if (this.isInitializingBrowser) {
       // Await existing initialization... (simple polling for v0.3)
       while(this.isInitializingBrowser) { await new Promise(r => setTimeout(r, 100)); }
       return;
    }

    this.isInitializingBrowser = true;
    const modelId = this.config.browserModelId || 'Phi-3-mini-4k-instruct-q4f16_1-MLC';
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
  async run(prompt: string, context?: any): Promise<AgentResponse> {
    console.log(`[AxonJS] Agent running with prompt: "${prompt}"`);

    if (this.config.llmProvider === 'openai') {
      if (!this.config.apiKey) {
        throw new Error('AxonJS Error: OpenAPI key is missing in config.');
      }
      return this.runOpenAI(prompt, context);
    }

    if (this.config.llmProvider === 'browser') {
      return this.runBrowser(prompt, context);
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
   * Translates the Axon Tool Registry into the OpenAI standard JSON schema expected by WebLLM.
   */
  private getWebLLMTools(): any[] {
     const tools: any[] = [];
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
  private async runBrowser(prompt: string, context?: any): Promise<AgentResponse> {
     await this.initializeBrowserEngine();
     if (!this.browserEngine) throw new Error("Engine failed to initialize");

     const response = await this.browserEngine.chat.completions.create({
        messages: [
           { role: "system", content: "You are an intelligent frontend application agent. You have access to tools that control the application state and UI. Use them to fulfill the user request." },
           { role: "user", content: prompt }
        ],
        tools: this.getWebLLMTools() as any, // Cast to bypass strict WebLLM type definitions for schemas
     });

     const choice = response.choices[0];
     const toolCallsFromLLM: { name: string; args: any }[] = [];

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
        toolCalls: toolCallsFromLLM,
     };
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

    // Execute the tools the AI requested locally
    const toolCallsFromLLM: { name: string; args: any }[] = [];
    
    if (response.toolCalls && response.toolCalls.length > 0) {
      for (const call of response.toolCalls) {
        // The AI SDK types toolCalls.args as unknown if the schema isn't inferred perfectly
        // We cast it so we can push it to our log and validator
        const args = (call as any).args || {};
        toolCallsFromLLM.push({ name: call.toolName, args });
        // Let our registry validate and execute the tool
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
