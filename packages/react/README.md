# @synapsenodes/react

The React adapter for SynapseJS. Provides hooks for seamless integration of AI agents into React and Next.js applications.

## Installation

```bash
npm install @synapsenodes/core @synapsenodes/react
```

## Hooks

### `useSynapseDOM`

Scans the document for interactive elements and returns a compact representation optimized for LLM context.

### `useSynapseSignals`

A powerful hook for handling signals emitted by the AI agent.

```tsx
import { useSynapseDOM, useSynapseSignals } from "@synapsenodes/react";

function Chat() {
  const domElements = useSynapseDOM();
  const { processSignals } = useSynapseSignals({
    SHOW_NOTIFICATION: ({ message }) => toast(message),
    NAVIGATE: ({ url }) => router.push(url),
  });

  // ...
}
```

For full documentation, visit [synapsejs.com](https://synapsejs.com).
