"use client";

import { useEffect, useState } from 'react';

export type AgentElement = {
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
export function useAgentDOM() {
  const [domElements, setDomElements] = useState<AgentElement[]>([]);

  useEffect(() => {
    // We run a scan whenever the DOM changes using a MutationObserver in a real app,
    // but a simple interval or dependency array works for this MVP.
    const scanDOM = () => {
      const interactables = document.querySelectorAll('button, input, a, [role="button"], [data-axon-read="true"]');
      const elements: AgentElement[] = [];

      interactables.forEach((el) => {
        // Enforce IDs so the Agent has a target
        if (!el.id) {
          el.id = 'axon-' + Math.random().toString(36).substr(2, 9);
        }

        const tagName = el.tagName.toLowerCase();
        let type: AgentElement['type'] = 'unknown';
        
        if (tagName === 'button' || el.getAttribute('role') === 'button') type = 'button';
        if (tagName === 'input') type = 'input';
        if (tagName === 'a') type = 'link';

        elements.push({
          id: el.id,
          type,
          text: (el as HTMLElement).innerText?.trim() || el.getAttribute('aria-label') || undefined,
          placeholder: (el as HTMLInputElement).placeholder || undefined,
          actionable: !(el as HTMLButtonElement).disabled
        });
      });

      setDomElements(elements);
    };

    scanDOM();

    // Re-scan on clicks or typing
    window.addEventListener('click', scanDOM);
    window.addEventListener('keyup', scanDOM);

    return () => {
      window.removeEventListener('click', scanDOM);
      window.removeEventListener('keyup', scanDOM);
    };
  }, []);

  return domElements;
}
