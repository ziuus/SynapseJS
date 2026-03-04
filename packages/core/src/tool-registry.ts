import { Tool } from './types';
import { z } from 'zod';

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  /**
   * Registers a new tool that the AI agent can call.
   */
  register<TArgs extends z.ZodTypeAny = any, TResult = any>(tool: Tool<TArgs, TResult>) {
    if (this.tools.has(tool.name)) {
      console.warn(`Tool with name '${tool.name}' is already registered and will be overwritten.`);
    }
    this.tools.set(tool.name, tool as Tool);
  }

  /**
   * Gets a tool by name.
   */
  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /**
   * Gets all registered tools.
   */
  getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Executes a tool with strict Zod validation.
   */
  async execute(name: string, args: any): Promise<any> {
    const tool = this.getTool(name);
    if (!tool) {
      throw new Error(`Tool '${name}' not found in registry.`);
    }
    
    // Strict Input Validation before anything touches the application
    console.log(`[AxonJS Validation] Validating arguments for ${name}...`);
    const parsedArgs = tool.schema ? tool.schema.parse(args) : args;
    
    return tool.execute(parsedArgs);
  }
}
