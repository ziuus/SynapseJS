import React, { createContext, useContext, ReactNode } from 'react';
import { Agent } from '@axonjs/core';

interface AxonContextType {
  agent: Agent;
}

const AxonContext = createContext<AxonContextType | null>(null);

export interface AxonProviderProps {
  runtime: Agent;
  children: ReactNode;
}

export function AxonProvider({ runtime, children }: AxonProviderProps) {
  return (
    <AxonContext.Provider value={{ agent: runtime }}>
      {children}
    </AxonContext.Provider>
  );
}

export function useAgent(): Agent {
  const context = useContext(AxonContext);
  if (!context) {
    throw new Error('useAgent must be used within an AxonProvider');
  }
  return context.agent;
}
