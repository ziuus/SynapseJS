# @synapsejs/core

The AI Runtime Layer for Frontend Applications. SynapseJS bridges your LLM (Groq, Gemini, OpenAI) and your web UI, providing a structured toolkit for AI agents to interact with the DOM.

## Installation

```bash
npm install @synapsejs/core
```

## Features

- **20+ Built-in Tools**: Click, fill, scroll, navigate, and more.
- **Provider Agnostic**: Seamless support for Groq, Google Gemini, and OpenAI.
- **Signal-Based Architecture**: Your frontend stays in control via typed signals.
- **TypeScript First**: Full type safety for all tool arguments and signals.

## Quick Start

```typescript
import { Agent } from "@synapsejs/core";

const agent = new Agent({
  llmProvider: "groq",
  apiKey: process.env.GROQ_API_KEY,
});

const result = await agent.run(messages, domElements);
```

For full documentation, visit [synapsejs.com](https://synapsejs.com).
