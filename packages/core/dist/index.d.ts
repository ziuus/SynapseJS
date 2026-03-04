import { z } from 'zod';

/**
 * Standardized message format representing conversation history
 */
type CoreMessage = {
    role: 'user' | 'assistant' | 'system' | 'data';
    content: string;
};
interface Tool<TArgs = any, TResult = any> {
    name: string;
    description: string;
    schema?: z.ZodType<TArgs>;
    jsonSchema?: any;
    execute: (args: any) => Promise<TResult> | TResult;
}
interface AgentConfig {
    llmProvider: 'openai' | 'gemini' | 'groq' | 'mock';
    apiKey?: string;
    systemPrompt?: string;
    model?: string;
    maxSteps?: number;
    memory?: 'session' | 'none';
}
interface AgentResponse {
    text: string;
    toolCalls?: {
        name: string;
        args: any;
    }[];
}

declare class ToolRegistry {
    private tools;
    /**
     * Registers a new tool that the AI agent can call.
     */
    register<TArgs extends z.ZodTypeAny = any, TResult = any>(tool: Tool<TArgs, TResult>): void;
    /**
     * Gets a tool by name.
     */
    getTool(name: string): Tool | undefined;
    /**
     * Gets all registered tools.
     */
    getAllTools(): Tool[];
    /**
     * Executes a tool with strict Zod validation.
     */
    execute(name: string, args: any): Promise<any>;
}

declare class Agent {
    private config;
    tools: ToolRegistry;
    constructor(config: AgentConfig);
    /**
     * Helper to register a tool directly on the agent's registry.
     */
    registerTool<TArgs extends z.ZodTypeAny = any, TResult = any>(tool: Tool<TArgs, TResult>): void;
    /**
     * Primary method to trigger the agent's reasoning loop.
     */
    run(messages: CoreMessage[], context?: any): Promise<AgentResponse>;
    /**
     * Translates the Axon Tool Registry into the format expected by the AI SDK.
     */
    private getAITools;
    /**
     * The semantic execution loop using Google Gemini via the AI SDK.
     */
    private runGemini;
    /**
     * The semantic execution loop using Groq via the AI SDK.
     */
    /**
     * The semantic execution loop using Groq via the AI SDK.
     */
    private runGroq;
    /**
     * The semantic execution loop using OpenAI via the AI SDK.
     */
    private runOpenAI;
}
declare function createAgent(config: AgentConfig): Agent;

export { Agent, type AgentConfig, type AgentResponse, type CoreMessage, type Tool, ToolRegistry, createAgent };
