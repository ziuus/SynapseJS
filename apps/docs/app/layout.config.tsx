import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import React from 'react';

/**
 * Shared layout configurations
 *
 * you can configure layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */
export const baseOptions: BaseLayoutProps = {
  nav: {
    title: (
      <div className="flex items-center gap-2 font-bold text-[1.1rem]">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[#f97316] to-[#ef4444] text-white shadow-[0_0_15px_rgba(249,115,22,0.3)] text-sm">
          ⚡
        </div>
        <span>Synapse<strong className="text-[#f97316]">JS</strong></span>
      </div>
    ),
  },
  links: [
    {
      text: 'Showcase Gallery',
      url: '/showcase',
      active: 'nested-url',
    },
  ],
  githubUrl: 'https://github.com/ziuus/SynapseJS',
};
