'use client';

import { useEffect, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { useSynapseDOM, useSynapseSignals } from '@synapsejs/core/client';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './landing.css';

export default function LandingPage() {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // ── SynapseJS real integration ───────────────────────────────────────────
  const domElements = useSynapseDOM();
  const { processSignals } = useSynapseSignals({
    HIGHLIGHT_ELEMENT: (args) => {
      if (!args) return;
      const elementId = args.elementId || args.id;
      if (!elementId) return;
      const el = document.getElementById(elementId);
      if (el) {
        el.classList.add('synapse-highlight-active');
        setTimeout(() => el.classList.remove('synapse-highlight-active'), 3000);
      }
    },
    SCROLL_TO: (args) => {
      if (!args) return;
      const { elementId, top } = args;
      if (elementId) {
        document.getElementById(elementId)?.scrollIntoView({ behavior: 'smooth' });
      } else if (top !== undefined) {
        window.scrollTo({ top, behavior: 'smooth' });
      }
    },
    NAVIGATE: (args) => {
      if (!args || !args.url) return;
      window.location.href = args.url;
    },
    UI_INTERACTION: (args) => {
       if (!args || !args.elementId) return;
       const { elementId, action } = args;
       const el = document.getElementById(elementId);
       if (!el) return;
       if (action === 'click') {
          el.click();
       } else if (action === 'type' && args.value) {
          (el as any).value = args.value;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
       }
    }
  });

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = { role: 'user', content: input };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, domElements })
      });
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
      } else if (data.error) {
        setMessages([...history, { role: 'assistant', content: `⚠️ Error: ${data.error}` }]);
      }
    } catch (e: any) {
      console.error('Chat error:', e);
      setMessages([...history, { role: 'assistant', content: "⚠️ Sorry, I encountered a connection error." }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Reactive Signal Processing
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === 'assistant' && (lastMsg as any).toolCalls) {
        processSignals((lastMsg as any).toolCalls);
    }
  }, [messages, processSignals]);

  const chatMessages = messages.length > 0 ? messages.map(m => ({ 
    role: m.role === 'user' ? 'user' : 'ai', 
    text: m.content 
  })) : [
    { role: 'ai', text: "👋 I'm the SynapseJS demo agent. I can control this page in real time.<br><br>Try: <em>\"Highlight the features\"</em> or <em>\"Take me to the docs\"</em>" }
  ];

  const heroBadgeRef = useRef(null);
  const heroTitleRef = useRef(null);
  const heroDescRef = useRef(null);
  const heroActionsRef = useRef(null);
  const heroCodeRef = useRef(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Entrance animations
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.to(heroBadgeRef.current, { opacity: 1, y: 0, duration: 0.8 }, 0.2)
      .to(heroTitleRef.current, { opacity: 1, y: 0, duration: 1.0 }, 0.4)
      .to(heroDescRef.current, { opacity: 1, y: 0, duration: 0.9 }, 0.6)
      .to(heroActionsRef.current, { opacity: 1, y: 0, duration: 0.8 }, 0.8)
      .to(heroCodeRef.current, { opacity: 1, y: 0, duration: 1.2 }, 0.9);

    // Scroll reveal for cards and sections
    gsap.utils.toArray('.reveal').forEach((el: any) => {
      gsap.to(el, {
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          toggleActions: 'play none none reverse',
        },
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
      });
    });

    gsap.utils.toArray('.card').forEach((card: any, i: number) => {
      gsap.to(card, {
        scrollTrigger: {
          trigger: card,
          start: 'top 90%',
          toggleActions: 'play none none reverse',
        },
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: i * 0.08,
        ease: 'power3.out',
      });
    });

    // 3D Parallax on hero code
    const handleMouseMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const rx = ((e.clientY - cy) / cy) * -8;
      const ry = ((e.clientX - cx) / cx) * 8;
      
      if (heroCodeRef.current) {
        gsap.to(heroCodeRef.current, {
          rotateX: 14 + rx,
          rotateY: ry,
          duration: 2,
          ease: 'power2.out',
        });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Particle Background
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        let particles: any[] = [];
        const COUNT = window.innerWidth < 600 ? 30 : 70;

        const resize = () => {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        class Particle {
          x=0; y=0; r=0; dx=0; dy=0; alpha=0; life=0; decay=0;
          constructor() { this.reset(true); }
          reset(randomY = false) {
            this.x = Math.random() * canvas!.width;
            this.y = randomY ? Math.random() * canvas!.height : canvas!.height + 10;
            this.r = Math.random() * 2 + 0.5;
            this.dx = (Math.random() - 0.5) * 0.4;
            this.dy = -(Math.random() * 0.5 + 0.2);
            this.alpha = Math.random() * 0.5 + 0.1;
            this.life = 1;
            this.decay = Math.random() * 0.002 + 0.001;
          }
          update() {
            this.x += this.dx;
            this.y += this.dy;
            this.life -= this.decay;
            if (this.life <= 0 || this.y < -10) this.reset();
          }
          draw() {
            const isLight = document.documentElement.getAttribute('data-theme') === 'light';
            const col = isLight ? `rgba(234,88,12,${this.alpha * this.life})` : `rgba(249,115,22,${this.alpha * this.life})`;
            ctx!.shadowBlur = 6;
            ctx!.shadowColor = col;
            ctx!.fillStyle = col;
            ctx!.beginPath();
            ctx!.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx!.fill();
            ctx!.shadowBlur = 0;
          }
        }

        for (let i = 0; i < COUNT; i++) particles.push(new Particle());

        let animationFrame: number;
        const loop = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          particles.forEach(p => { p.update(); p.draw(); });
          animationFrame = requestAnimationFrame(loop);
        };
        loop();
        return () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('resize', resize);
          cancelAnimationFrame(animationFrame);
        };
      }
    }
  }, []);

  // Magnetic Button Logic
  useEffect(() => {
    const magnetics = document.querySelectorAll('.magnetic');
    magnetics.forEach((el: any) => {
      const handleMouseMove = (e: any) => {
        const { left, top, width, height } = el.getBoundingClientRect();
        const x = (e.clientX - left - width / 2) * 0.45;
        const y = (e.clientY - top - height / 2) * 0.45;
        gsap.to(el, { x, y, duration: 0.9, ease: 'power3.out', overwrite: 'auto' });
      };
      const handleMouseLeave = () => {
        gsap.to(el, { x: 0, y: 0, duration: 1.5, ease: 'elastic.out(1, 0.3)' });
      };
      el.addEventListener('mousemove', handleMouseMove);
      el.addEventListener('mouseleave', handleMouseLeave);
      return () => {
        el.removeEventListener('mousemove', handleMouseMove);
        el.removeEventListener('mouseleave', handleMouseLeave);
      };
    });
  }, []);


  return (
    <div className="landing-body">
      <canvas ref={canvasRef} id="particle-canvas" />

      {/* Navigation */}
      <nav tabIndex={-1} className="navbar" id="navbar">
        <Link href="/" className="logo magnetic">
          <div className="logo-mark">⚡</div>
          <span>Synapse<strong>JS</strong></span>
        </Link>
        <div className="nav-center">
          <Link href="/docs" className="nav-link">Docs</Link>
          <Link href="/docs/showcase" className="nav-link">Showcase</Link>
          <a href="https://github.com/ziuus/SynapseJS" target="_blank" className="nav-link">GitHub</a>
          <Link href="/docs/changelog" className="nav-link">Changelog</Link>
        </div>
        <div className="nav-end">
          <Link href="/docs" className="btn btn-primary magnetic">Get Started →</Link>
        </div>
      </nav>

      <main>
        {/* HERO */}
        <section className="hero">
          <div ref={heroBadgeRef} className="hero-badge" id="hero-badge">
            <span className="badge-dot" />
            v0.3.0 — Feats & Vision Now Available
          </div>

          <h1 ref={heroTitleRef} className="hero-title" id="hero-title">
            The AI Runtime<br />
            <span className="text-gradient">Layer for Your UI</span>
          </h1>

          <p ref={heroDescRef} className="hero-desc" id="hero-desc">
            Connect any AI agent directly to your web application.<br />
            20+ built-in tools. Zero config. Instant superpowers.
          </p>

          <div ref={heroActionsRef} className="hero-actions" id="hero-actions">
            <Link href="/docs" className="btn btn-primary magnetic">
              Start in 5 Minutes
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
            <a href="https://github.com/ziuus/SynapseJS" target="_blank" className="btn btn-ghost magnetic">
              View on GitHub
            </a>
          </div>

          {/* Hero Code Preview */}
          <div ref={heroCodeRef} className="hero-code-wrapper" id="hero-code">
            <div className="code-topbar">
              <div className="code-dots"><span /><span /><span /></div>
              <span className="code-label">agent.ts</span>
            </div>
            <pre className="code-block"><code>
              <span className="c-keyword">import</span> <span className="c-brace">{'{'}</span> createAgent <span className="c-brace">{'}'}</span> <span className="c-keyword">from</span> <span className="c-string">'@synapsejs/core'</span>;<br />
              <br />
              <span className="c-keyword">const</span> agent <span className="c-op">=</span> <span className="c-fn">createAgent</span>(<span className="c-brace">{'{'}</span><br />
              &nbsp;&nbsp;model: <span className="c-fn">google</span>(<span className="c-string">'gemini-2.0-flash'</span>),<br />
              &nbsp;&nbsp;tools: [<br />
              &nbsp;&nbsp;&nbsp;&nbsp;<span className="c-fn">scrollTo</span>(),<br />
              &nbsp;&nbsp;&nbsp;&nbsp;<span className="c-fn">highlightElement</span>(),<br />
              &nbsp;&nbsp;&nbsp;&nbsp;<span className="c-fn">fillForm</span>(),<br />
              &nbsp;&nbsp;&nbsp;&nbsp;<span className="c-fn">vision</span>()&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="c-comment">// ← See what the user sees</span><br />
              &nbsp;&nbsp;]<br />
              <span className="c-brace">{'}'}</span>);<br />
              <br />
              <span className="c-keyword">await</span> agent.<span className="c-fn">run</span>(<span className="c-string">'Help me find the checkout button'</span>);
            </code></pre>
          </div>
        </section>

        {/* STATS BAR */}
        <section className="stats-bar reveal">
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-num">20+</span>
              <span className="stat-label">Built-in Tools</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-num">3</span>
              <span className="stat-label">AI Providers</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-num">&lt; 5min</span>
              <span className="stat-label">Setup Time</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-num">0</span>
              <span className="stat-label">Config Files</span>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="section" id="features">
          <div className="section-inner">
            <div className="section-header reveal">
              <div className="section-tag">Why SynapseJS</div>
              <h2>Everything your AI agent needs<br /><span className="text-gradient">to understand your UI</span></h2>
              <p className="section-sub">A complete toolkit for building AI-native user experiences — from Vision to fine-grained DOM control.</p>
            </div>

            <div className="features-grid">
              <div className="card card-lg" id="feat-vision">
                <div className="card-icon">👁️</div>
                <h3>Vision Support</h3>
                <p>Your agent can literally <em>see</em> the current state of the page via screenshot analysis — understanding dynamic UI without manual selectors.</p>
                <div className="card-tag">NEW in v0.3.0</div>
              </div>
              <div className="card">
                <div className="card-icon">⚡</div>
                <h3>20+ DOM Tools</h3>
                <p>Scroll, click, fill forms, highlight elements, show toasts — all pre-built and ready for your agent to call.</p>
              </div>
              <div className="card">
                <div className="card-icon">🔌</div>
                <h3>Multi-Provider</h3>
                <p>Works with Gemini, GPT-4, Groq, and any Vercel AI SDK compatible model. Swap with one line of code.</p>
              </div>
              <div className="card">
                <div className="card-icon">🧩</div>
                <h3>React Native</h3>
                <p>First-class React hooks (<code>&lt;SynapseProvider&gt;</code>, <code>useAgent()</code>) for seamless integration into any component tree.</p>
              </div>
              <div className="card">
                <div className="card-icon">🏎️</div>
                <h3>Feats System</h3>
                <p>Chain multiple tools into reusable automation "feats" that execute complex multi-step workflows from a single agent command.</p>
              </div>
              <div className="card">
                <div className="card-icon">🔒</div>
                <h3>Type-Safe</h3>
                <p>Built on <strong>Zod</strong> for full end-to-end type safety. Define your tool schemas and get auto-complete in your IDE.</p>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="section section-alt" id="how-it-works">
          <div className="section-inner">
            <div className="section-header reveal">
              <div className="section-tag">How It Works</div>
              <h2>From setup to AI-powered<br /><span className="text-gradient">UI in three steps</span></h2>
            </div>

            <div className="flex flex-col md:flex-row gap-8 justify-between">
              <div className="step-item reveal flex-1">
                <div className="step-num">01</div>
                <h3>Install & Configure</h3>
                <p>Add <code>@synapsejs/core</code> and wrap your app with <code>&lt;SynapseProvider&gt;</code>. Point it at your preferred AI model.</p>
              </div>
              <div className="step-item reveal flex-1">
                <div className="step-num">02</div>
                <h3>Drop In Your Tools</h3>
                <p>Select from 20+ pre-built tools or define custom ones using the Zod schema builder. No boilerplate.</p>
              </div>
              <div className="step-item reveal flex-1">
                <div className="step-num">03</div>
                <h3>Agent Goes to Work</h3>
                <p>Call <code>agent.run(prompt)</code> and watch your AI navigate, fill, and control your UI in real time.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="section cta-section reveal">
          <div className="cta-card">
            <h2>Ready to build AI-native<br /><span className="text-gradient">web experiences?</span></h2>
            <p>Join developers building the next generation of intelligent UI. SynapseJS is open source and free forever.</p>
            <div className="cta-actions">
              <Link href="/docs" className="btn btn-primary magnetic">Read the Docs →</Link>
              <a href="https://github.com/ziuus/SynapseJS" target="_blank" className="btn btn-ghost magnetic">⭐ Star on GitHub</a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="logo">
            <div className="logo-mark">⚡</div>
            <span>Synapse<strong>JS</strong></span>
          </div>
          <p className="footer-copy">© 2026 SynapseJS. Open Source, MIT Licensed.</p>
          <div className="footer-links">
            <a href="https://github.com/ziuus/SynapseJS" target="_blank">GitHub</a>
            <Link href="/docs">Docs</Link>
            <Link href="/docs/showcase">Showcase</Link>
          </div>
        </div>
      </footer>

      {/* Assistant Widget */}
      <div id="synapse-assistant" className={isAssistantOpen ? 'active' : ''}>
        <div className="assistant-header">
          <div className="flex items-center gap-2">
            <div className="logo-mark" style={{ width: 28, height: 28, fontSize: '.9rem' }}>⚡</div>
            <span className="assistant-title">Synapse <strong>Assistant</strong></span>
            <div className="assistant-status">Live</div>
          </div>
          <button className="close-btn" onClick={() => setIsAssistantOpen(false)}>✕</button>
        </div>
        <div className="assistant-chat">
          {chatMessages.map((msg, i) => (
            <div key={i} className={`msg msg-${msg.role}`} dangerouslySetInnerHTML={{ __html: msg.text }} />
          ))}
        </div>
        <div className="assistant-input-row">
          <input
            id="ai-input"
            type="text"
            placeholder="Ask me to do something…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
          />
          <button className="send-btn" onClick={handleSend} disabled={isLoading}>
            {isLoading ? '...' : '↑'}
          </button>
        </div>
      </div>
      
      <button className="assistant-fab magnetic" onClick={() => setIsAssistantOpen(true)}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" /></svg>
      </button>

      <style jsx global>{`
        .synapse-highlight-active {
          border-color: var(--accent) !important;
          box-shadow: 0 0 20px var(--accent-glow) !important;
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
}
