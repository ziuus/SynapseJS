"use client";

import { useEffect, useRef } from 'react';
import type { AgentSignalHandler, AxonSignalType } from './types';

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
export function useSynapseSignals(handlers: AgentSignalHandler) {
  // Keep handlers ref fresh without re-registering effect
  const handlersRef = useRef(handlers);
  useEffect(() => { handlersRef.current = handlers; });

  /**
   * Process an array of tool calls from an agent response.
   * Each call whose name matches a signal will invoke the registered handler.
   */
  const processSignals = (toolCalls: { name: string; args: any }[]) => {
    for (const tc of toolCalls) {
      // Built-in signals come back with _axonSignal in the result,
      // but we route them by tool name for simplicity
      const signalType = TOOL_NAME_TO_SIGNAL[tc.name as keyof typeof TOOL_NAME_TO_SIGNAL];
      if (!signalType) continue;

      const handler = handlersRef.current[signalType];
      if (handler) {
        try {
          handler(tc.args);
        } catch (e) {
          console.error(`[SynapseJS] Handler for signal '${signalType}' threw:`, e);
        }
      }
    }
  };

  return { processSignals };
}

/** Maps tool name → signal type for routing */
const TOOL_NAME_TO_SIGNAL: Record<string, AxonSignalType> = {
  interactWithScreen:  'UI_INTERACTION',
  interactWith3DScene: '3D_INTERACTION',
  readScreenText:      'READ_ELEMENT',
  observeState:        'OBSERVE_STATE',
  navigateTo:          'NAVIGATE',
  fillForm:            'FILL_FORM',
  showNotification:    'SHOW_NOTIFICATION',
  scrollTo:            'SCROLL_TO',
  copyToClipboard:     'COPY_TO_CLIPBOARD',
  toggleElement:       'TOGGLE_ELEMENT',
  selectDropdown:      'SELECT_DROPDOWN',
  highlightElement:    'HIGHLIGHT_ELEMENT',
  waitForElement:      'WAIT_FOR_ELEMENT',
  getPageUrl:          'GET_PAGE_URL',
  setPageTitle:        'SET_PAGE_TITLE',
  openModal:           'OPEN_MODAL',
  downloadFile:        'DOWNLOAD_FILE',
  submitForm:          'SUBMIT_FORM',
  checkboxToggle:      'CHECKBOX_TOGGLE',
  setTheme:            'SET_THEME',
};
