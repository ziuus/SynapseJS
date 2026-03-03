import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AxonProvider, createAgent } from '@axonjs/react';

const runtime = createAgent({
  llmProvider: 'mock',
  memory: 'session'
});

// Register a mock tool
runtime.registerTool({
  name: 'navigateToPage',
  description: 'Navigates the user to a different page in the app',
  execute: ({ url }) => {
    console.log(`Executing navigation to: ${url}`);
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
