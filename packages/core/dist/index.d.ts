import { z } from 'zod';

interface Tool<TArgs extends z.ZodTypeAny = any, TResult = any> {
    name: string;
    description: string;
    schema: TArgs;
    execute: (args: z.infer<TArgs>) => Promise<TResult> | TResult;
}
interface AgentConfig {
    llmProvider: 'openai' | 'mock' | 'browser';
    apiKey?: string;
    browserModelId?: string;
    onProgress?: (progress: {
        text: string;
        progress: number;
    }) => void;
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
    private browserEngine;
    private isInitializingBrowser;
    constructor(config: AgentConfig);
    /**
     * Helper to register a tool directly on the agent's registry.
     */
    registerTool<TArgs extends z.ZodTypeAny = any, TResult = any>(tool: Tool<TArgs, TResult>): void;
    /**
     * Initialize the WebLLM browser engine if requested. This downloads weights to cache.
     */
    initializeBrowserEngine(): Promise<void>;
    /**
     * Primary method to trigger the agent's reasoning loop.
     */
    run(prompt: string, context?: any): Promise<AgentResponse>;
    /**
     * Translates the Axon Tool Registry into the format expected by the AI SDK.
     */
    private getAITools;
    /**
     * Translates the Axon Tool Registry into the OpenAI standard JSON schema expected by WebLLM.
     */
    private getWebLLMTools;
    /**
     * The execution loop entirely in the browser using WebGPU.
     */
    private runBrowser;
    /**
     * The real execution loop using OpenAI via the AI SDK.
     */
    private runOpenAI;
}
declare function createAgent(config: AgentConfig): Agent;

export { Agent, type AgentConfig, type AgentResponse, type Tool, ToolRegistry, createAgent };
