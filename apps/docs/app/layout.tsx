import './globals.css';
import { RootProvider } from 'fumadocs-ui/provider/next';
import { Outfit, JetBrains_Mono } from 'next/font/google';
import type { ReactNode } from 'react';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-sans',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata = {
  title: 'SynapseJS',
  description: 'The AI Runtime Layer for Frontend Applications',
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${mono.variable}`} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
