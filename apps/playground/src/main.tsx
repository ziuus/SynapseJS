import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AxonProvider, createAgent } from '@axonjs/react';
import { z } from 'zod';

const runtime = createAgent({
  llmProvider: 'browser',
  browserModelId: 'Phi-3-mini-4k-instruct-q4f16_1-MLC', // A fast, tiny model
  onProgress: (progress) => {
    // Dispatch a custom event so the React app can pick it up for a loading bar
    window.dispatchEvent(new CustomEvent('axon-progress', { detail: progress }));
  },
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
