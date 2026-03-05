import { T as Tool, a as AgentConfig, C as CoreMessage, b as AgentResponse } from './types-z8amuw1D.js';
export { A as AgentSignalHandler, S as SYNAPSE_TOOL_NAMES, c as SynapseSignal, d as SynapseSignalType, e as SynapseToolName } from './types-z8amuw1D.js';
import { z } from 'zod';

/**
 * ToolRegistry — central store for all AI-callable tools.
 *
 * The Agent pre-registers 20 built-in tools. Developers can add custom tools
 * via `agent.tools.register(...)` after construction.
 */
declare class ToolRegistry {
    private tools;
    /**
     * Register a new tool that the AI agent can call.
     * Overwrites any existing tool with the same name.
     */
    register<TArgs extends z.ZodTypeAny = any, TResult = any>(tool: Tool<TArgs, TResult>): void;
    /**
     * Unregister a tool by name.
     * @returns true if the tool was removed, false if it didn't exist
     */
    unregister(name: string): boolean;
    /**
     * Check if a tool exists in the registry.
     */
    has(name: string): boolean;
    /**
     * Get all registered tool names.
     */
    list(): string[];
    /** Get a single tool by name */
    getTool(name: string): Tool | undefined;
    /** Get all registered tools as an array */
    getAllTools(): Tool[];
    /**
     * Execute a tool with automatic Zod schema validation.
     * Throws if the tool is not found or arguments fail validation.
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

export { Agent, AgentConfig, AgentResponse, CoreMessage, Tool, ToolRegistry, createAgent };
