"use strict";
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

// src/index.ts
var index_exports = {};
__export(index_exports, {
  Agent: () => import_core.Agent,
  SynapseProvider: () => SynapseProvider,
  createAgent: () => import_core.createAgent,
  useAgent: () => useAgent
});
module.exports = __toCommonJS(index_exports);

// src/SynapseProvider.tsx
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
var SynapseContext = (0, import_react.createContext)(null);
function SynapseProvider({ runtime, feats, children }) {
  (0, import_react.useEffect)(() => {
    if (feats) {
      feats.forEach((feat) => runtime.loadFeat(feat));
    }
  }, [runtime, feats]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SynapseContext.Provider, { value: { agent: runtime }, children });
}
function useAgent() {
  const context = (0, import_react.useContext)(SynapseContext);
  if (!context) {
    throw new Error("useAgent must be used within an SynapseProvider");
  }
  return context.agent;
}

// src/index.ts
var import_core = require("@synapsenodes/core");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Agent,
  SynapseProvider,
  createAgent,
  useAgent
});
