import React, { createContext, useContext, ReactNode } from 'react';
import { Agent } from '@synapsejs/core';

interface SynapseContextType {
  agent: Agent;
}

const SynapseContext = createContext<SynapseContextType | null>(null);

export interface SynapseProviderProps {
  runtime: Agent;
  children: ReactNode;
}

export function SynapseProvider({ runtime, children }: SynapseProviderProps) {
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
