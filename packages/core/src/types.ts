import { z } from 'zod';

/**
 * Standardized message format representing conversation history
 */
export type CoreMessage = {
  role: 'user' | 'assistant' | 'system' | 'data';
  content: string;
};

export interface Tool<TArgs = any, TResult = any> {
  name: string;
  description: string;
  schema?: z.ZodType<TArgs>; // Zod schema is now optional if jsonSchema is provided
  jsonSchema?: any; // Raw JSON schema for high compatibility
  execute: (args: any) => Promise<TResult> | TResult;
}

export interface AgentConfig {
  llmProvider: 'openai' | 'gemini' | 'groq' | 'mock'; 
  apiKey?: string; // Required for 'openai', 'gemini', and 'groq'
  systemPrompt?: string; // Custom instructions for the agent
  model?: string; // Optional specific model override
  maxSteps?: number; // Optional loop limit
  memory?: 'session' | 'none';
}

export interface AgentResponse {
  text: string;
  toolCalls?: { name: string; args: any }[];
}
