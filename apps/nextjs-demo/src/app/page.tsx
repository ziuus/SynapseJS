'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAgentDOM } from '@axonjs/core/client';
import SplineScene from './SplineScene';

type Message = { role: 'user' | 'assistant', content: string, toolCalls?: any[] };
type Toast = { id: number; message: string; type: 'success' | 'error' | 'info' | 'warning' };

// ── Signal dispatcher: handles all _axonSignal events from the AI ──────────
function dispatchSignal(toolName: string, args: any, handlers: Record<string, (a: any) => void>) {
  const h = handlers[toolName];
  if (h) h(args);
  else console.warn(`[Axon] No handler for tool signal: ${toolName}`);
}

export default function ChatDashboard() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [cartCount, setCartCount] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const domElements = useAgentDOM();
  const toastId = useRef(0);

  // ── Toast helpers ──────────────────────────────────────────────────────────
  const showToast = useCallback((message: string, type: Toast['type'] = 'info', durationMs = 3000) => {
    const id = ++toastId.current;
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), durationMs);
  }, []);

  // ── Core DOM interactor ────────────────────────────────────────────────────
  const handleAISignal = useCallback((args: any) => {
    const { elementId, action, value } = args;
    const el = document.getElementById(elementId);
    if (!el) { console.warn(`[Axon Signal] Element #${elementId} not found.`); return; }
    if (action === 'click') (el as HTMLElement).click();
    else if (action === 'type' && value) {
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  }, []);

  // ── 3D scene interactor ────────────────────────────────────────────────────
  const handle3DSignal = useCallback((args: any) => {
    const { actionType, target, value } = args;
    if (!window.AxonSplineInterop) { console.warn('[Axon 3D] Spline not loaded yet'); return; }
    if (actionType === 'emitEvent') window.AxonSplineInterop.emitEvent('mouseHover', target);
    else if (actionType === 'setVariable' && value !== undefined) window.AxonSplineInterop.setVariable(target, value);
  }, []);

  // ── Read element text/value ────────────────────────────────────────────────
  const handleReadElement = useCallback((args: any) => {
    const el = document.getElementById(args.elementId);
    const text = el ? (el as any).textContent || (el as any).value || '' : 'Element not found';
    console.log(`[Axon Read] #${args.elementId}:`, text);
    // Append the read value as an invisible assistant context message
    setMessages(prev => {
      const last = prev[prev.length - 1];
      if (last?.role === 'assistant') {
        return [...prev.slice(0, -1), { ...last, content: last.content + `\n🔍 "${text}"` }];
      }
      return prev;
    });
  }, []);

  // ── Navigate ───────────────────────────────────────────────────────────────
  const handleNavigate = useCallback((args: any) => {
    showToast(`Navigating to ${args.url}…`, 'info');
    if (args.newTab) window.open(args.url, '_blank');
    else window.location.href = args.url;
  }, [showToast]);

  // ── Fill form fields ───────────────────────────────────────────────────────
  const handleFillForm = useCallback((args: any) => {
    const fields: { elementId: string; value: string }[] = args.fields || [];
    fields.forEach(({ elementId, value }) => {
      const el = document.getElementById(elementId) as HTMLInputElement;
      if (el) {
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    showToast(`Filled ${fields.length} field(s) automatically`, 'success');
  }, [showToast]);

  // ── Master signal router ───────────────────────────────────────────────────
  const processToolCalls = useCallback((toolCalls: any[]) => {
    toolCalls.forEach(tc => {
      switch (tc.name) {
        case 'interactWithScreen':   handleAISignal(tc.args); break;
        case 'interactWith3DScene':  handle3DSignal(tc.args); break;
        case 'readScreenText':
        case 'observeState':         handleReadElement(tc.args); break;
        case 'navigateTo':           handleNavigate(tc.args); break;
        case 'fillForm':             handleFillForm(tc.args); break;
        case 'showNotification':     showToast(tc.args.message, tc.args.type, tc.args.durationMs); break;

        // ── Wave 2 signals ───────────────────────────────────────────────────
        case 'scrollTo': {
          const { elementId, top, behavior = 'smooth' } = tc.args;
          if (elementId) {
            document.getElementById(elementId)?.scrollIntoView({ behavior, block: 'center' });
          } else if (top !== undefined) {
            window.scrollTo({ top, behavior });
          }
          break;
        }
        case 'copyToClipboard':
          navigator.clipboard.writeText(tc.args.text).then(() =>
            showToast('Copied to clipboard!', 'success')
          ).catch(() => showToast('Clipboard copy failed', 'error'));
          break;
        case 'toggleElement': {
          const el = document.getElementById(tc.args.elementId) as HTMLElement;
          if (!el) break;
          const shouldShow = tc.args.visible !== undefined ? tc.args.visible : el.style.display === 'none';
          el.style.display = shouldShow ? '' : 'none';
          break;
        }
        case 'selectDropdown': {
          const sel = document.getElementById(tc.args.elementId) as HTMLSelectElement;
          if (!sel) break;
          sel.value = tc.args.value;
          sel.dispatchEvent(new Event('change', { bubbles: true }));
          break;
        }
        case 'highlightElement': {
          const hl = document.getElementById(tc.args.elementId) as HTMLElement;
          if (!hl) break;
          const color = tc.args.color || '#6366f1';
          const dur = tc.args.durationMs || 2000;
          const prev = hl.style.outline;
          hl.style.outline = `3px solid ${color}`;
          hl.style.outlineOffset = '3px';
          hl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => { hl.style.outline = prev; hl.style.outlineOffset = ''; }, dur);
          showToast(`Highlighted #${tc.args.elementId}`, 'info', dur);
          break;
        }
      }
    });
  }, [handleAISignal, handle3DSignal, handleReadElement, handleNavigate, handleFillForm, showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ messages: newHistory, domElements })
      });

      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
        // Process ALL tool calls from ALL messages
        const allToolCalls = data.messages.flatMap((m: any) => m.toolCalls || []);
        if (allToolCalls.length) processToolCalls(allToolCalls);
      } else {
        setMessages([...newHistory, { role: 'assistant', content: 'Error executing agent.' }]);
      }
    } catch {
      setMessages([...newHistory, { role: 'assistant', content: 'Network error calling AxonJS.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const addToCart = () => setCartCount(prev => prev + 1);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const isDark = theme === 'dark';
  const toastColors: Record<Toast['type'], string> = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    info: 'bg-indigo-500',
    warning: 'bg-amber-500',
  };

  return (
    <div className={`flex flex-col h-screen ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'} font-sans transition-colors duration-300`}>

      {/* ── Toast notifications ─────────────────────────────────────────────── */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`${toastColors[t.type]} text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-in slide-in-from-right-4`}
          >
            {t.type === 'success' && '✅'}
            {t.type === 'error' && '❌'}
            {t.type === 'info' && 'ℹ️'}
            {t.type === 'warning' && '⚠️'}
            {t.message}
          </div>
        ))}
      </div>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className={`px-6 py-4 border-b ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white/50'} backdrop-blur z-10 shadow-sm flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg font-bold text-lg text-white">A</div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">AxonJS Agent</h1>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Spatial AI · 7 built-in integrations</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            id="theme-toggle"
            onClick={toggleTheme}
            className={`p-2 rounded-lg border ${isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-100'} transition-colors`}
            title="Toggle Theme"
          >
            {isDark ? '🌙' : '☀️'}
          </button>
          <div
            id="cart-status"
            data-axon-read="true"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-500 font-medium text-sm border border-indigo-500/20"
          >
            🛒 {cartCount} Items
          </div>
        </div>
      </header>

      {/* ── 3D Hero ─────────────────────────────────────────────────────────── */}
      <SplineScene />

      {/* ── Tool pills — shows what integrations are active ─────────────────── */}
      <div className={`flex gap-2 px-6 py-2 overflow-x-auto ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-100'} border-b text-xs`}>
        {['click/type', 'fillForm', 'navigate', 'notify', 'readText', 'observeState', 'scrollTo', 'copy', 'toggle', 'selectDropdown', 'highlight', '3D scene'].map(t => (
          <span key={t} className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 whitespace-nowrap font-mono shrink-0">
            {t}
          </span>
        ))}
      </div>

      {/* ── Chat area ───────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center" ref={scrollRef}>
        <div className="w-full max-w-3xl space-y-6 pb-20">

          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center pt-16 text-center opacity-80">
              <div className="h-16 w-16 mb-6 rounded-full bg-slate-800 flex items-center justify-center text-3xl shadow-inner border border-slate-700">🪄</div>
              <h2 className="text-2xl font-medium mb-2">Autonomous UI Assistant</h2>
              <p className={`max-w-md mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                I can see, click, fill, navigate and even control the 3D scene.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 w-full max-w-sm">
                {[
                  { label: '🛒 Purchase Product', id: 'buy-product-1', action: addToCart },
                  { label: '✨ Exclusive Offer', id: 'buy-product-2', action: addToCart },
                ].map(btn => (
                  <button
                    key={btn.id}
                    id={btn.id}
                    onClick={btn.action}
                    className={`px-6 py-3 rounded-xl font-medium transition-all shadow hover:scale-105 text-sm ${btn.id === 'buy-product-1' ? 'bg-indigo-600 text-white hover:bg-indigo-500' : `border-2 ${isDark ? 'border-indigo-500/50 hover:bg-indigo-500/10 text-indigo-400' : 'border-indigo-600 hover:bg-indigo-50 text-indigo-600'}`}`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
              <p className={`mt-6 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Try: "Trigger 3D hover" · "Switch to light mode" · "Add to cart"</p>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 shadow-sm leading-relaxed whitespace-pre-wrap text-sm
                  ${m.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : isDark
                      ? 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-sm'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm'}`}>
                  {m.role !== 'user' && (
                    <div className="text-indigo-400 text-xs font-semibold mb-1 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block animate-pulse" />
                      Axon
                    </div>
                  )}
                  {m.content}
                  {m.toolCalls && m.toolCalls.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {m.toolCalls.map((tc: any, ti: number) => (
                        <span key={ti} className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 font-mono">
                          ⚡ {tc.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex w-full justify-start">
              <div className={`${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/80 border-slate-200'} border text-slate-400 rounded-2xl px-5 py-3 rounded-bl-sm flex items-center gap-2`}>
                <div className="h-4 w-4 rounded-full border-2 border-slate-600 border-t-indigo-500 animate-spin" />
                <span className="text-sm font-medium">Analyzing UI…</span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Input ───────────────────────────────────────────────────────────── */}
      <div className={`p-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'} border-t flex justify-center sticky bottom-0`}>
        <form onSubmit={handleSubmit} className="w-full max-w-3xl relative flex items-center">
          <input
            className={`w-full ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'} border-2 placeholder-slate-400 rounded-full pl-6 pr-14 py-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-lg text-sm`}
            value={input}
            placeholder="Try 'Switch to light mode' or 'Show a success toast'…"
            onChange={e => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-full aspect-square flex items-center justify-center transition-colors shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 ml-0.5"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
          </button>
        </form>
      </div>
    </div>
  );
}
