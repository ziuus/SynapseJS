'use client';

import { useEffect, useRef } from 'react';
import { useSynapseDOM } from '@synapsenodes/core/client';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './landing.css';

export default function LandingPage() {
  const landingRef = useRef<HTMLDivElement>(null);
  const domElements = useSynapseDOM();

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    
    // Hero Animation
    gsap.from('.hero-content > *', {
      y: 100,
      opacity: 0,
      duration: 1,
      stagger: 0.2,
      ease: 'power4.out',
    });

    // Feature Cards Animation
    gsap.from('.feature-card', {
      scrollTrigger: {
        trigger: '.features-grid',
        start: 'top 80%',
      },
      y: 60,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: 'back.out(1.7)',
    });
  }, []);

  return (
    <div ref={landingRef} className="landing-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-bg">
          <div className="gradient-blob blob-1"></div>
          <div className="gradient-blob blob-2"></div>
          <div className="gradient-blob blob-3"></div>
        </div>
        
        <div className="hero-content">
          <div className="badge">v0.3.0 Now Available</div>
          <h1 className="hero-title">
            The Agentic Layer <br />
            <span>For Modern Web Apps</span>
          </h1>
          <p className="hero-subtitle">
            SynapseJS bridges the gap between LLMs and your UI. 
            Enable your AI to see, feel, and control your application with zero friction.
          </p>
          <div className="hero-cta">
            <Link href="/docs" className="btn btn-primary">Get Started</Link>
            <Link href="https://github.com/ziuus/SynapseJS" className="btn btn-secondary">View GitHub</Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="features-section">
        <div className="section-header">
          <h2 className="section-title">Core Capabilities</h2>
          <p className="section-desc">Everything you need to build next-generation AI-powered interfaces.</p>
        </div>

        <div className="features-grid">
          <div id="feature-dom" className="feature-card">
            <div className="feature-icon">👁️</div>
            <h3>DOM Awareness</h3>
            <p>Automatic real-time mapping of your interface state into semantic JSON for LLM consumption.</p>
          </div>

          <div id="feature-control" className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Direct Control</h3>
            <p>Safe, intent-based UI manipulation via high-level signals and atomic interactions.</p>
          </div>

          <div id="feature-multi" className="feature-card">
            <div className="feature-icon">🧠</div>
            <h3>Multi-Provider</h3>
            <p>Native support for OpenAI, Gemini, Anthropic, and Groq with ultra-stable tool parsing.</p>
          </div>

          <div id="feature-3d" className="feature-card">
            <div className="feature-icon">🎮</div>
            <h3>3D Integration</h3>
            <p>First-class control for Spline and Three.js scenes. Let your agent drive the 3D world.</p>
          </div>
        </div>
      </section>

      {/* Code Snippet Section */}
      <section className="code-section">
        <div className="code-container">
          <div className="code-header">
            <div className="dots"><span></span><span></span><span></span></div>
            <div className="file-name">SynapseProvider.tsx</div>
          </div>
          <pre className="code-body">
            <code>{`// Initialize Synapse across your app
<SynapseProvider 
  config={{ 
    llmProvider: 'anthropic',
    model: 'claude-3-5-sonnet'
  }}
>
  <YourApp />
</SynapseProvider>`}</code>
          </pre>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-logo">SynapseJS</div>
          <div className="footer-links">
            <Link href="/docs">Documentation</Link>
            <Link href="/docs/guide/agent">Agent API</Link>
            <Link href="https://github.com/ziuus/SynapseJS">GitHub</Link>
          </div>
          <div className="footer-copy">© 2026 Axon Foundation. Glassmorphism Design.</div>
        </div>
      </footer>
    </div>
  );
}
