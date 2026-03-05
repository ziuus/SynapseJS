import { z } from 'zod';

/**
 * Standardized message format representing conversation history
 */
export type MessagePart = 
  | { type: 'text'; text: string }
  | { type: 'image'; image: string; mimeType: string };

/**
 * Standardized message format representing conversation history
 */
export type CoreMessage = {
  role: 'user' | 'assistant' | 'system' | 'data';
  content: string | MessagePart[];
};

export interface Tool<TArgs = any, TResult = any> {
  name: string;
  description: string;
  schema?: z.ZodType<TArgs>;
  jsonSchema?: any;
  execute: (args: any) => Promise<TResult> | TResult;
}

export interface AgentConfig {
  llmProvider: 'openai' | 'gemini' | 'groq' | 'mock';
  apiKey?: string;
  systemPrompt?: string;
  model?: string;
  maxSteps?: number;
  memory?: 'session' | 'none';
}

export interface AgentResponse {
  text: string;
  toolCalls?: { name: string; args: any }[];
}

// ── Typed Axon Signal union ────────────────────────────────────────────────────

/** Every signal type the SynapseJS built-in tools can emit */
export type SynapseSignalType =
  | 'UI_INTERACTION'
  | '3D_INTERACTION'
  | 'READ_ELEMENT'
  | 'NAVIGATE'
  | 'FILL_FORM'
  | 'SHOW_NOTIFICATION'
  | 'OBSERVE_STATE'
  | 'SCROLL_TO'
  | 'COPY_TO_CLIPBOARD'
  | 'TOGGLE_ELEMENT'
  | 'SELECT_DROPDOWN'
  | 'HIGHLIGHT_ELEMENT'
  | 'WAIT_FOR_ELEMENT'
  | 'GET_PAGE_URL'
  | 'SET_PAGE_TITLE'
  | 'OPEN_MODAL'
  | 'DOWNLOAD_FILE'
  | 'SUBMIT_FORM'
  | 'CHECKBOX_TOGGLE'
  | 'SET_THEME'
  | 'CAPTURE_SCREENSHOT';

/** The base shape of every signal returned by a built-in Axon tool */
export interface SynapseSignal<T = unknown> {
  _synapseSignal: SynapseSignalType;
  payload: T;
}

/** Handler map used by useSynapseSignals and processToolCalls */
export type AgentSignalHandler = Partial<Record<SynapseSignalType, (payload: any) => void>>;

/** All built-in tool names exported as a constant array */
export const SYNAPSE_TOOL_NAMES = [
  'interactWithScreen',
  'interactWith3DScene',
  'readScreenText',
  'navigateTo',
  'fillForm',
  'showNotification',
  'observeState',
  'scrollTo',
  'copyToClipboard',
  'toggleElement',
  'selectDropdown',
  'highlightElement',
  'waitForElement',
  'getPageUrl',
  'setPageTitle',
  'openModal',
  'downloadFile',
  'submitForm',
  'checkboxToggle',
  'setTheme',
] as const;

export type SynapseToolName = typeof SYNAPSE_TOOL_NAMES[number];

// ── Feats (High-level Automations) ───────────────────────────────────────────

/** metadata for a Synapse Feat */
export interface FeatManifest {
  name: string;
  version: string;
  description: string;
  author?: string;
  tags?: string[];
}

/** 
 * A Synapse Feat is a high-level automation bundle.
 * It can include multiple tools and a system prompt fragment.
 */
export interface SynapseFeat {
  manifest: FeatManifest;
  /** Tools provided by this feat */
  tools: Tool[];
  /** Optional instructions injected into the agent's system prompt when feat is active */
  instructions?: string;
  /** Optional initial signals to fire when feat is loaded */
  onLoad?: () => SynapseSignal[];
}

