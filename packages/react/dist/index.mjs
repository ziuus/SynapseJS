// src/SynapseProvider.tsx
import { createContext, useContext, useEffect } from "react";
import { jsx } from "react/jsx-runtime";
var SynapseContext = createContext(null);
function SynapseProvider({ runtime, feats, children }) {
  useEffect(() => {
    if (feats) {
      feats.forEach((feat) => runtime.loadFeat(feat));
    }
  }, [runtime, feats]);
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
import { createAgent, Agent } from "@synapsenodes/core";
export {
  Agent,
  SynapseProvider,
  createAgent,
  useAgent
};
