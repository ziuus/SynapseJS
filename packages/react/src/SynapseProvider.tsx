import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { Agent, SynapseFeat } from '@synapsejs/core';

interface SynapseContextType {
  agent: Agent;
}

const SynapseContext = createContext<SynapseContextType | null>(null);

export interface SynapseProviderProps {
  runtime: Agent;
  feats?: SynapseFeat[];
  children: ReactNode;
}

export function SynapseProvider({ runtime, feats, children }: SynapseProviderProps) {
  // Load feats on initialization
  useEffect(() => {
    if (feats) {
      feats.forEach(feat => runtime.loadFeat(feat));
    }
  }, [runtime, feats]);

  return (
    <SynapseContext.Provider value={{ agent: runtime }}>
      {children}
    </SynapseContext.Provider>
  );
}

export function useAgent(): Agent {
  const context = useContext(SynapseContext);
  if (!context) {
    throw new Error('useAgent must be used within an SynapseProvider');
  }
  return context.agent;
}
