import { z } from 'zod';

export interface Tool<TArgs extends z.ZodTypeAny = any, TResult = any> {
  name: string;
  description: string;
  schema: TArgs; // Zod schema is now required for strict validation
  execute: (args: z.infer<TArgs>) => Promise<TResult> | TResult;
}

export interface AgentConfig {
  llmProvider: 'openai' | 'gemini' | 'mock'; 
  apiKey?: string; // Required for 'openai' and 'gemini'
  memory?: 'session' | 'none';
}

export interface AgentResponse {
  text: string;
  toolCalls?: { name: string; args: any }[];
}
