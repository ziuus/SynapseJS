import { A as AgentSignalHandler } from './types-f2mb4mMM.mjs';
import 'zod';

type AgentElement = {
    id: string;
    type: 'button' | 'input' | 'link' | 'unknown';
    text?: string;
    placeholder?: string;
    actionable: boolean;
    variables?: string;
    events?: string;
};
/**
 * A React Hook that scans the current DOM for interactable elements
 * and returns a JSON simplified representation for the LLM to understand.
 */
declare function useSynapseDOM(): AgentElement[];

/**
 * useSynapseSignals
 *
 * Drop this hook into any React component to automatically handle all signals
 * emitted by SynapseJS built-in tools. Pass a map of signal handlers and call
 * `processSignals(toolCalls)` whenever the agent responds.
 *
 * @example
 * const { processSignals } = useSynapseSignals({
 *   SHOW_NOTIFICATION: ({ message, type }) => showToast(message, type),
 *   NAVIGATE: ({ url }) => router.push(url),
 *   HIGHLIGHT_ELEMENT: ({ elementId }) => { ... },
 * });
 *
 * // Then in your chat handler:
 * processSignals(data.messages.flatMap(m => m.toolCalls ?? []));
 */
declare function useSynapseSignals(handlers: AgentSignalHandler): {
    processSignals: (toolCalls: {
        name: string;
        args: any;
    }[]) => void;
};

export { type AgentElement, useSynapseDOM, useSynapseSignals };
