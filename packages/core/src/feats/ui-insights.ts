import { SynapseFeat, SynapseSignal, Tool } from '../types';
import { z } from 'zod';

/**
 * UI Insights Feat
 * Provides meta-analysis of the current page structure and accessibility.
 */
export const UIInsightsFeat: SynapseFeat = {
  manifest: {
    name: 'UI Insights',
    version: '1.0.0',
    description: 'Analyzes page structure, accessibility, and UX patterns.',
    author: 'SynapseJS Core',
    tags: ['accessibility', 'ux', 'analysis']
  },
  instructions: `
When the 'UI Insights' feat is active, you should proactively check for accessibility issues.
You can use 'analyzePageUX' to get a breakdown of the current page hierarchy and potential improvements.
Always suggest at least one UX improvement after a significant page transition.
  `,
  tools: [
    {
      name: 'analyzePageUX',
      description: 'Performs a deep scan of the current DOM to identify accessibility gaps and UX friction points.',
      schema: z.object({
        focusArea: z.string().optional().describe('Optional specific area to focus on (e.g., "forms", "navigation")')
      }) as any,
      execute: async ({ focusArea }: any) => {
        // In a real implementation, this would involve complex logic.
        // For the demo, we return a signal that the frontend can use to show a report.
        return {
          _synapseSignal: 'SHOW_NOTIFICATION',
          payload: {
            message: `UI Insights scan complete${focusArea ? ` for ${focusArea}` : ''}. Found 2 accessibility warnings.`,
            type: 'info'
          }
        };
      }
    }
  ]
};
