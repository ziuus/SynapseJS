"use strict";
"use client";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client.ts
var client_exports = {};
__export(client_exports, {
  useSynapseDOM: () => useSynapseDOM,
  useSynapseSignals: () => useSynapseSignals
});
module.exports = __toCommonJS(client_exports);

// src/useSynapseDOM.ts
var import_react = require("react");
function useSynapseDOM() {
  const [domElements, setDomElements] = (0, import_react.useState)([]);
  (0, import_react.useEffect)(() => {
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
var import_react2 = require("react");
function useSynapseSignals(handlers) {
  const handlersRef = (0, import_react2.useRef)(handlers);
  (0, import_react2.useEffect)(() => {
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  useSynapseDOM,
  useSynapseSignals
});
