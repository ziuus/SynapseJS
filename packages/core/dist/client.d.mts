type AgentElement = {
    id: string;
    type: 'button' | 'input' | 'link' | 'unknown';
    text?: string;
    placeholder?: string;
    actionable: boolean;
};
/**
 * A React Hook that scans the current DOM for interactable elements
 * and returns a JSON simplified representation for the LLM to understand.
 */
declare function useAgentDOM(): AgentElement[];

export { type AgentElement, useAgentDOM };
