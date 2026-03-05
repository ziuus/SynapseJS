// src/SynapseProvider.tsx
import { createContext, useContext } from "react";
import { jsx } from "react/jsx-runtime";
var SynapseContext = createContext(null);
function SynapseProvider({ runtime, children }) {
  return /* @__PURE__ */ jsx(SynapseContext.Provider, { value: { agent: runtime }, children });
}
function useAgent() {
  const context = useContext(SynapseContext);
  if (!context) {
    throw new Error("useAgent must be used within an SynapseProvider");
  }
  return context.agent;
}

// src/index.ts
import { createAgent, Agent } from "@synapsejs/core";
export {
  Agent,
  SynapseProvider,
  createAgent,
  useAgent
};
