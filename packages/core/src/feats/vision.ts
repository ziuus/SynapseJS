import { SynapseFeat, Tool } from '../types';
import { z } from 'zod';

/**
 * Vision Feat
 * Enables multi-modal UI analysis via viewport screenshots.
 */
export const VisionFeat: SynapseFeat = {
  manifest: {
    name: 'Vision',
    version: '1.0.0',
    description: 'Enables the agent to see the UI via screenshots for complex visual analysis.',
    author: 'SynapseJS Core',
    tags: ['vision', 'multi-modal', 'canvas']
  },
  instructions: `
When you need to reason about non-DOM elements (like 3D scenes, Canvas elements, or complex visualizations), use 'scanViewport'.
The 'scanViewport' tool will provide you with a visual snapshot of the current view.
Wait for the screenshot data to be provided in the next turn before drawing conclusions about visual states.
  `,
  tools: [
    {
      name: 'scanViewport',
      description: 'Captures a full screenshot of the current viewport to analyze visual layout and non-DOM components.',
      schema: z.object({
        reason: z.string().describe('The reason for needing a visual scan (e.g., "analyzing 3D scene state")')
      }) as any,
      execute: async ({ reason }: any) => {
        return {
          _synapseSignal: 'CAPTURE_SCREENSHOT',
          payload: { reason }
        };
      }
    }
  ]
};
