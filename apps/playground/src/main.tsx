import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AxonProvider, createAgent } from '@axonjs/react';
import { z } from 'zod';

const runtime = createAgent({
  llmProvider: import.meta.env.VITE_GEMINI_API_KEY ? 'gemini' : (import.meta.env.VITE_OPENAI_API_KEY ? 'openai' : 'mock'),
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY,
  memory: 'session'
});

// Register a mock tool with strict Zod validation
runtime.registerTool({
  name: 'navigateToPage',
  description: 'Navigates the user to a different page in the application. Use this whenever the user asks to see a different part of the app.',
  schema: z.object({
    url: z.string().describe("The path to navigate to, e.g. /dashboard or /settings")
  }),
  execute: ({ url }) => {
    console.log(`[App Execution] Navigating window to: ${url}`);
    return `Successfully navigated to ${url}`;
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AxonProvider runtime={runtime}>
      <App />
    </AxonProvider>
  </StrictMode>,
)
