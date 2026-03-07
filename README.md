<div align="center">
  <h1>⚡ SynapseJS</h1>
  <p><strong>The AI Runtime Layer for Frontend Applications</strong></p>
  <p>
    <a href="https://www.npmjs.com/package/@synapsenodes/core"><img src="https://img.shields.io/npm/v/@synapsenodes/core?color=6366f1&label=npm" alt="npm version"></a>
    <img src="https://img.shields.io/badge/tools-20_built--in-emerald?color=10b981" alt="20 built-in tools">
    <img src="https://img.shields.io/badge/providers-Groq%20%7C%20Gemini%20%7C%20OpenAI-8b5cf6" alt="providers">
    <img src="https://img.shields.io/badge/TypeScript-5.x-3178c6" alt="TypeScript">
  </p>
</div>

---

**SynapseJS** lets any LLM see, click, scroll, fill, navigate, and control your web UI — with one line of setup and zero extra infrastructure. Drop it into any React / Next.js project and your AI agent gains 20 production-ready capabilities instantly.

```ts
const agent = new Agent({
  llmProvider: "groq",
  apiKey: process.env.GROQ_API_KEY,
});
const result = await agent.run([
  { role: "user", content: "Switch to dark mode" },
]);
// The AI calls interactWithScreen → clicks your theme toggle automatically
```

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Providers](#providers)
3. [Built-in Tools (20)](#built-in-tools)
4. [Custom Tools](#custom-tools)
5. [Frontend Integration](#frontend-integration)
   - [useSynapseDOM](#useagentdom)
   - [useSynapseSignals](#useaxonsignals)
6. [3D Scene Integration](#3d-scene-integration)
7. [API Reference](#api-reference)
8. [TypeScript Types](#typescript-types)
9. [FAQ](#faq)

---

## Quick Start

### 1. Install

```bash
npm install @synapsenodes/core
# or
pnpm add @synapsenodes/core
```

### 2. Create an Agent (backend — Next.js API route)

```ts
// app/api/chat/route.ts
import { Agent } from "@synapsenodes/core";

export async function POST(req: Request) {
  const { messages, domElements } = await req.json();

  const agent = new Agent({
    llmProvider: "groq",
    apiKey: process.env.GROQ_API_KEY,
    model: "llama-3.3-70b-versatile", // optional
    maxSteps: 5, // optional loop limit
  });

  // Register your own custom tools (optional)
  agent.tools.register({
    name: "getWeather",
    description: "Get the current weather for a city",
    schema: z.object({ city: z.string() }),
    execute: async ({ city }) =>
      fetch(`/api/weather?city=${city}`).then((r) => r.json()),
  });

  const result = await agent.run(messages, domElements);
  return Response.json(result);
}
```

### 3. Connect the frontend

```tsx
// app/page.tsx
"use client";
import { useSynapseDOM, useSynapseSignals } from "@synapsenodes/core/client";

export default function Page() {
  const domElements = useSynapseDOM(); // auto-scans interactive elements
  const { processSignals } = useSynapseSignals({
    // handle AI actions
    SHOW_NOTIFICATION: ({ message, type }) => toast(message, type),
    NAVIGATE: ({ url }) => router.push(url),
    SET_THEME: ({ theme }) => (document.documentElement.dataset.theme = theme),
    HIGHLIGHT_ELEMENT: ({ elementId }) => highlight(elementId),
    // ... handle whichever signals you need
  });

  const handleSubmit = async (message: string) => {
    const res = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ messages, domElements }),
    });
    const data = await res.json();
    processSignals(data.messages.flatMap((m: any) => m.toolCalls ?? []));
  };
}
```

---

## Providers

| Provider               | Env Variable     | Recommended Model         |
| ---------------------- | ---------------- | ------------------------- |
| **Groq** (recommended) | `GROQ_API_KEY`   | `llama-3.3-70b-versatile` |
| **Gemini**             | `GEMINI_API_KEY` | `gemini-2.0-flash-exp`    |
| **OpenAI**             | `OPENAI_API_KEY` | `gpt-4o`                  |

---

## Built-in Tools

SynapseJS ships **20 tools** that are registered automatically — no configuration needed. The LLM selects the right tool based on the user's intent.

### Wave 1 — Core UI Automation

| Tool                 | Signal              | Purpose                                             |
| -------------------- | ------------------- | --------------------------------------------------- |
| `interactWithScreen` | `UI_INTERACTION`    | Click any element or type into inputs               |
| `readScreenText`     | `READ_ELEMENT`      | Read the current text / value of any element        |
| `observeState`       | `OBSERVE_STATE`     | Read any DOM property (`value`, `checked`, `href`…) |
| `fillForm`           | `FILL_FORM`         | Batch-fill multiple form fields at once             |
| `navigateTo`         | `NAVIGATE`          | Navigate the browser to any URL or route            |
| `showNotification`   | `SHOW_NOTIFICATION` | Display a toast notification                        |

### Wave 2 — Enhanced Interactions

| Tool               | Signal              | Purpose                                  |
| ------------------ | ------------------- | ---------------------------------------- |
| `scrollTo`         | `SCROLL_TO`         | Scroll to an element or pixel offset     |
| `copyToClipboard`  | `COPY_TO_CLIPBOARD` | Copy text to the user's clipboard        |
| `toggleElement`    | `TOGGLE_ELEMENT`    | Show or hide any element                 |
| `selectDropdown`   | `SELECT_DROPDOWN`   | Set a `<select>` to any option           |
| `highlightElement` | `HIGHLIGHT_ELEMENT` | Draw an attention ring around an element |

### Wave 3 — Power Features

| Tool             | Signal             | Purpose                           |
| ---------------- | ------------------ | --------------------------------- |
| `waitForElement` | `WAIT_FOR_ELEMENT` | Poll DOM until an element appears |
| `getPageUrl`     | `GET_PAGE_URL`     | Return `window.location.href`     |
| `setPageTitle`   | `SET_PAGE_TITLE`   | Update `document.title`           |
| `openModal`      | `OPEN_MODAL`       | Open or close a modal/dialog      |
| `downloadFile`   | `DOWNLOAD_FILE`    | Trigger a file download           |
| `submitForm`     | `SUBMIT_FORM`      | Submit a `<form>` element         |
| `checkboxToggle` | `CHECKBOX_TOGGLE`  | Check/uncheck a checkbox          |
| `setTheme`       | `SET_THEME`        | Set `data-theme` on `<html>`      |

### 3D Scene Control

| Tool                  | Signal           | Purpose                                           |
| --------------------- | ---------------- | ------------------------------------------------- |
| `interactWith3DScene` | `3D_INTERACTION` | Emit events or set variables on a Spline 3D scene |

---

## Custom Tools

Register any tool that runs your own business logic:

```ts
import { Agent } from "@synapsenodes/core";
import { z } from "zod";

const agent = new Agent({ llmProvider: "groq", apiKey: "..." });

agent.tools.register({
  name: "sendEmail",
  description:
    'Send an email to a recipient. Requires "to", "subject", and "body".',
  schema: z.object({
    to: z.string().email(),
    subject: z.string(),
    body: z.string(),
  }),
  execute: async ({ to, subject, body }) => {
    await mailer.send({ to, subject, body });
    return { sent: true };
  },
});

const result = await agent.run([
  {
    role: "user",
    content: "Email john@example.com about the meeting tomorrow",
  },
]);
```

### Tool Registry API

```ts
agent.tools.register(tool); // Register a new tool
agent.tools.unregister(name); // Remove a tool   → boolean
agent.tools.has(name); // Check existence  → boolean
agent.tools.list(); // Get all names    → string[]
agent.tools.getTool(name); // Get a tool       → Tool | undefined
agent.tools.getAllTools(); // Get all tools    → Tool[]
agent.tools.execute(name, args); // Run a tool      → Promise<any>
```

---

## Frontend Integration

### useSynapseDOM

Automatically scans the DOM and returns a simplified JSON snapshot the LLM uses to understand your UI:

```tsx
import { useSynapseDOM } from "@synapsenodes/core/client";

const domElements = useSynapseDOM();
// Returns: [{ id: 'submit-btn', type: 'button', text: 'Submit', actionable: true }, ...]
```

Tag any element for AI visibility:

```html
<!-- Make a static element readable by the AI -->
<div id="cart-count" data-synapse-read="true">3 items</div>

<!-- Register a 3D canvas with controllable events -->
<div
  id="hero-scene"
  data-synapse-3d="true"
  data-3d-events="mouseHover, mouseDown"
  data-3d-variables="score, speed"
></div>
```

### useSynapseSignals

The zero-boilerplate way to handle any signal the AI emits:

```tsx
import { useSynapseSignals } from "@synapsenodes/core/client";

const { processSignals } = useSynapseSignals({
  UI_INTERACTION: ({ elementId, action, value }) => {
    const el = document.getElementById(elementId);
    if (action === "click") el?.click();
    if (action === "type") (el as HTMLInputElement).value = value;
  },
  SHOW_NOTIFICATION: ({ message, type, durationMs }) => {
    showToast(message, type, durationMs);
  },
  NAVIGATE: ({ url, newTab }) => {
    if (newTab) window.open(url, "_blank");
    else window.location.href = url;
  },
  SET_THEME: ({ theme }) => {
    document.documentElement.dataset.theme = theme;
  },
  // Handle only what you need — rest are silently ignored
});

// In your message handler:
const allToolCalls = data.messages.flatMap((m) => m.toolCalls ?? []);
processSignals(allToolCalls);
```

---

## 3D Scene Integration

```bash
npm install @splinetool/react-spline
```

```tsx
'use client';
import { useEffect } from 'react';
import type { Application } from '@splinetool/runtime';

declare global {
  interface Window { SynapseSplineInterop?: { emitEvent: ..., setVariable: ... } }
}

function SplineScene() {
  function onLoad(app: Application) {
    window.SynapseSplineInterop = {
      emitEvent: (action, target) => app.emitEvent(action as any, target),
      setVariable: (name, value) => app.setVariable(name, value as any),
    };
  }
  return (
    <div id="hero-3d-scene" data-synapse-3d="true" data-3d-events="mouseHover, mouseDown">
      <Spline scene="your-scene.splinecode" onLoad={onLoad} />
    </div>
  );
}
```

Then wire the signal:

```tsx
const { processSignals } = useSynapseSignals({
  "3D_INTERACTION": ({ actionType, target, value }) => {
    if (actionType === "emitEvent")
      window.SynapseSplineInterop?.emitEvent("mouseHover", target);
    if (actionType === "setVariable")
      window.SynapseSplineInterop?.setVariable(target, value);
  },
});
```

---

## API Reference

### `new Agent(config: AgentConfig)`

| Property       | Type                                       | Default          | Description                   |
| -------------- | ------------------------------------------ | ---------------- | ----------------------------- |
| `llmProvider`  | `'groq' \| 'gemini' \| 'openai' \| 'mock'` | required         | LLM backend to use            |
| `apiKey`       | `string`                                   | —                | Provider API key              |
| `model`        | `string`                                   | provider default | Override the default model    |
| `systemPrompt` | `string`                                   | SynapseJS default   | Custom system instructions    |
| `maxSteps`     | `number`                                   | `5`              | Max reasoning loop iterations |
| `memory`       | `'session' \| 'none'`                      | `'none'`         | Conversation memory mode      |

### `agent.run(messages, domElements?)`

Run the reasoning loop and return the full message history including all tool calls.

```ts
const result = await agent.run(
  [{ role: "user", content: "Submit the form" }],
  [{ id: "contact-form", type: "unknown", actionable: true }],
);
// result.messages — full history
// result.text     — final assistant text
```

---

## TypeScript Types

```ts
import type {
  AgentConfig,
  AgentResponse,
  SynapseSignalType,
  SynapseSignal,
  AgentSignalHandler,
  SynapseToolName,
  Tool,
  CoreMessage,
} from "@synapsenodes/core";
```

---

## FAQ

**Q: How does the AI know what's on the screen?**  
A: `useSynapseDOM()` scans for all `button`, `input`, `a`, and `data-synapse-read`/`data-synapse-3d` tagged elements and produces a JSON snapshot sent with every request.

**Q: Do I need to configure anything to get the 20 tools?**  
A: No. All tools are pre-registered in the constructor. Just create an `Agent` and they're available.

**Q: Can I remove a built-in tool I don't want?**  
A: Yes: `agent.tools.unregister('setTheme')`.

**Q: How do I add my own tools?**  
A: `agent.tools.register({ name, description, schema, execute })`. See [Custom Tools](#custom-tools).

**Q: Does this work with Next.js App Router?**  
A: Yes. The `Agent` class runs only on the server (API routes). `useSynapseDOM` and `useSynapseSignals` are client components.

**Q: What if I'm not using React?**  
A: The `Agent` class and `ToolRegistry` are framework-agnostic. Build your own signal dispatch layer for Vue, Svelte, or vanilla JS.

---

## License

MIT © SynapseJS Contributors
