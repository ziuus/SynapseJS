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
  useAgentDOM: () => useAgentDOM
});
module.exports = __toCommonJS(client_exports);

// src/useAgentDOM.ts
var import_react = require("react");
function useAgentDOM() {
  const [domElements, setDomElements] = (0, import_react.useState)([]);
  (0, import_react.useEffect)(() => {
    const scanDOM = () => {
      const interactables = document.querySelectorAll('button, input, a, [role="button"], [data-axon-read="true"]');
      const elements = [];
      interactables.forEach((el) => {
        if (!el.id) {
          el.id = "axon-" + Math.random().toString(36).substr(2, 9);
        }
        const tagName = el.tagName.toLowerCase();
        let type = "unknown";
        if (tagName === "button" || el.getAttribute("role") === "button") type = "button";
        if (tagName === "input") type = "input";
        if (tagName === "a") type = "link";
        elements.push({
          id: el.id,
          type,
          text: el.innerText?.trim() || el.getAttribute("aria-label") || void 0,
          placeholder: el.placeholder || void 0,
          actionable: !el.disabled
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  useAgentDOM
});
