import { Tool } from './types';
import { z } from 'zod';

/**
 * ToolRegistry — central store for all AI-callable tools.
 *
 * The Agent pre-registers 20 built-in tools. Developers can add custom tools
 * via `agent.tools.register(...)` after construction.
 */
export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  /**
   * Register a new tool that the AI agent can call.
   * Overwrites any existing tool with the same name.
   */
  register<TArgs extends z.ZodTypeAny = any, TResult = any>(tool: Tool<TArgs, TResult>) {
    if (this.tools.has(tool.name)) {
      console.warn(`[AxonJS] Tool '${tool.name}' overwritten.`);
    }
    this.tools.set(tool.name, tool as Tool);
  }

  /**
   * Unregister a tool by name.
   * @returns true if the tool was removed, false if it didn't exist
   */
  unregister(name: string): boolean {
    return this.tools.delete(name);
  }

  /**
   * Check if a tool exists in the registry.
   */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Get all registered tool names.
   */
  list(): string[] {
    return Array.from(this.tools.keys());
  }

  /** Get a single tool by name */
  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /** Get all registered tools as an array */
  getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Execute a tool with automatic Zod schema validation.
   * Throws if the tool is not found or arguments fail validation.
   */
  async execute(name: string, args: any): Promise<any> {
    const tool = this.getTool(name);
    if (!tool) {
      throw new Error(`[AxonJS] Tool '${name}' not found. Available: ${this.list().join(', ')}`);
    }
    const parsedArgs = tool.schema ? tool.schema.parse(args) : args;
    return tool.execute(parsedArgs);
  }
}
