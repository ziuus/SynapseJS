import * as react_jsx_runtime from 'react/jsx-runtime';
import { ReactNode } from 'react';
import { Agent, SynapseFeat } from '@synapsenodes/core';
export { Agent, createAgent } from '@synapsenodes/core';

interface SynapseProviderProps {
    runtime: Agent;
    feats?: SynapseFeat[];
    children: ReactNode;
}
declare function SynapseProvider({ runtime, feats, children }: SynapseProviderProps): react_jsx_runtime.JSX.Element;
declare function useAgent(): Agent;

export { SynapseProvider, type SynapseProviderProps, useAgent };
