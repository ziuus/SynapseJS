"use client";

// src/useSynapseDOM.ts
import { useEffect, useState } from "react";
function useSynapseDOM() {
  const [domElements, setDomElements] = useState([]);
  useEffect(() => {
    const scanDOM = () => {
      const interactables = document.querySelectorAll('button, input, a, [role="button"], [data-synapse-read="true"], [data-synapse-3d="true"]');
      const elements = [];
      interactables.forEach((el) => {
        if (!el.id) {
          el.id = "synapse-" + Math.random().toString(36).substr(2, 9);
        }
        const tagName = el.tagName.toLowerCase();
        let type = "unknown";
        if (tagName === "button" || el.getAttribute("role") === "button") type = "button";
        if (tagName === "input") type = "input";
        if (tagName === "a") type = "link";
        let is3D = false;
        let variables, events;
        if (el.getAttribute("data-synapse-3d") === "true") {
          type = "unknown";
          is3D = true;
          variables = el.getAttribute("data-3d-variables") || void 0;
          events = el.getAttribute("data-3d-events") || void 0;
        }
        elements.push({
          id: el.id,
          type: is3D ? "3d-scene" : type,
          text: el.innerText?.trim() || el.getAttribute("aria-label") || void 0,
          placeholder: el.placeholder || void 0,
          actionable: !el.disabled || is3D,
          ...is3D && { variables, events }
        });
      });
      setDomElements(elements);
    };
    scanDOM();
    window.addEventListener("click", scanDOM);
    window.addEventListener("keyup", scanDOM);
    return () => {
      window.removeEventListener("click", scanDOM);
      window.removeEventListener("keyup", scanDOM);
    };
  }, []);
  return domElements;
}

// src/useSynapseSignals.ts
import { useEffect as useEffect2, useRef } from "react";
function useSynapseSignals(handlers) {
  const handlersRef = useRef(handlers);
  useEffect2(() => {
    handlersRef.current = handlers;
  });
  const processSignals = (toolCalls) => {
    for (const tc of toolCalls) {
      const signalType = TOOL_NAME_TO_SIGNAL[tc.name];
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
var TOOL_NAME_TO_SIGNAL = {
  interactWithScreen: "UI_INTERACTION",
  interactWith3DScene: "3D_INTERACTION",
  readScreenText: "READ_ELEMENT",
  observeState: "OBSERVE_STATE",
  navigateTo: "NAVIGATE",
  fillForm: "FILL_FORM",
  showNotification: "SHOW_NOTIFICATION",
  scrollTo: "SCROLL_TO",
  copyToClipboard: "COPY_TO_CLIPBOARD",
  toggleElement: "TOGGLE_ELEMENT",
  selectDropdown: "SELECT_DROPDOWN",
  highlightElement: "HIGHLIGHT_ELEMENT",
  waitForElement: "WAIT_FOR_ELEMENT",
  getPageUrl: "GET_PAGE_URL",
  setPageTitle: "SET_PAGE_TITLE",
  openModal: "OPEN_MODAL",
  downloadFile: "DOWNLOAD_FILE",
  submitForm: "SUBMIT_FORM",
  checkboxToggle: "CHECKBOX_TOGGLE",
  setTheme: "SET_THEME"
};
export {
  useSynapseDOM,
  useSynapseSignals
};
