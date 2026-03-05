import * as react_jsx_runtime from 'react/jsx-runtime';
import { ReactNode } from 'react';
import { Agent } from '@synapsejs/core';
export { Agent, createAgent } from '@synapsejs/core';

interface SynapseProviderProps {
    runtime: Agent;
    children: ReactNode;
}
declare function SynapseProvider({ runtime, children }: SynapseProviderProps): react_jsx_runtime.JSX.Element;
declare function useAgent(): Agent;

export { SynapseProvider, type SynapseProviderProps, useAgent };
