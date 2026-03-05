import { T as Tool, a as AgentConfig, S as SynapseFeat, b as SynapseSignal, C as CoreMessage, c as AgentResponse } from './types-f2mb4mMM.js';
export { A as AgentSignalHandler, F as FeatManifest, M as MessagePart, d as SYNAPSE_TOOL_NAMES, e as SynapseSignalType, f as SynapseToolName } from './types-f2mb4mMM.js';
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
    private feats;
    constructor(config: AgentConfig);
    /**
     * Helper to register a tool directly on the agent's registry.
     */
    registerTool<TArgs extends z.ZodTypeAny = any, TResult = any>(tool: Tool<TArgs, TResult>): void;
    /**
     * Loads a Feat (automation bundle) into the agent.
     * Registers feat tools and returns any initial signals defined by the feat.
     */
    loadFeat(feat: SynapseFeat): SynapseSignal[];
    /**
     * Aggregates default instructions with all loaded feat instructions.
     */
    private getFullSystemPrompt;
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

/**
 * UI Insights Feat
 * Provides meta-analysis of the current page structure and accessibility.
 */
declare const UIInsightsFeat: SynapseFeat;

/**
 * Vision Feat
 * Enables multi-modal UI analysis via viewport screenshots.
 */
declare const VisionFeat: SynapseFeat;

export { Agent, AgentConfig, AgentResponse, CoreMessage, SynapseFeat, SynapseSignal, Tool, ToolRegistry, UIInsightsFeat, VisionFeat, createAgent };
