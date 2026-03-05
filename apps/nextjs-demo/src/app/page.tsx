'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSynapseDOM } from '@synapsejs/core/client';
import SplineScene from './SplineScene';

type Message = { role: 'user' | 'assistant', content: string, toolCalls?: any[] };
type Toast = { id: number; message: string; type: 'success' | 'error' | 'info' | 'warning' };

// ── Signal routing constants ─────────────────────────────────────────────────
const TOOL_TO_SIGNAL: Record<string, string> = {
  interactWithScreen: 'UI_INTERACTION', interactWith3DScene: '3D_INTERACTION',
  readScreenText: 'READ_ELEMENT', observeState: 'OBSERVE_STATE',
  navigateTo: 'NAVIGATE', fillForm: 'FILL_FORM', showNotification: 'SHOW_NOTIFICATION',
  scrollTo: 'SCROLL_TO', copyToClipboard: 'COPY_TO_CLIPBOARD',
  toggleElement: 'TOGGLE_ELEMENT', selectDropdown: 'SELECT_DROPDOWN',
  highlightElement: 'HIGHLIGHT_ELEMENT', waitForElement: 'WAIT_FOR_ELEMENT',
  getPageUrl: 'GET_PAGE_URL', setPageTitle: 'SET_PAGE_TITLE',
  openModal: 'OPEN_MODAL', downloadFile: 'DOWNLOAD_FILE',
  submitForm: 'SUBMIT_FORM', checkboxToggle: 'CHECKBOX_TOGGLE', setTheme: 'SET_THEME',
};

export default function ChatDashboard() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [cartCount, setCartCount] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [formData, setFormData] = useState({ name: '', email: '', plan: 'free', newsletter: false });
  const [modalOpen, setModalOpen] = useState(false);
  const [pageTitle, setPageTitle] = useState('SynapseJS Agent');

  const scrollRef = useRef<HTMLDivElement>(null);
  const domElements = useSynapseDOM();
  const toastId = useRef(0);

  // Keep page title in sync
  useEffect(() => { document.title = pageTitle; }, [pageTitle]);

  // ── Toast ────────────────────────────────────────────────────────────────
  const showToast = useCallback((message: string, type: Toast['type'] = 'info', durationMs = 3000) => {
    const id = ++toastId.current;
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), durationMs);
  }, []);

  // ── Full signal handler map ───────────────────────────────────────────────
  const processToolCalls = useCallback((toolCalls: { name: string; args: any }[]) => {
    for (const tc of toolCalls) {
      const signal = TOOL_TO_SIGNAL[tc.name];
      if (!signal) continue;

      switch (signal) {
        case 'UI_INTERACTION': {
          const { elementId, action, value } = tc.args;
          const el = document.getElementById(elementId);
          if (!el) break;
          if (action === 'click') (el as HTMLElement).click();
          else if (action === 'type' && value) {
            (el as any).value = value;
            el.dispatchEvent(new Event('input', { bubbles: true }));
          }
          break;
        }
        case '3D_INTERACTION': {
          const { actionType, target, value } = tc.args;
          if (!window.SynapseSplineInterop) break;
          if (actionType === 'emitEvent') window.SynapseSplineInterop.emitEvent('mouseHover', target);
          else if (actionType === 'setVariable' && value !== undefined)
            window.SynapseSplineInterop.setVariable(target, value);
          break;
        }
        case 'READ_ELEMENT':
        case 'OBSERVE_STATE': {
          const el = document.getElementById(tc.args.elementId);
          const prop = tc.args.property || 'textContent';
          const val = el ? (el as any)[prop] ?? '' : 'Not found';
          console.log(`[Axon Read] #${tc.args.elementId}.${prop} =`, val);
          break;
        }
        case 'NAVIGATE': {
          showToast(`Navigating to ${tc.args.url}…`, 'info');
          setTimeout(() => {
            if (tc.args.newTab) window.open(tc.args.url, '_blank');
            else window.location.href = tc.args.url;
          }, 800);
          break;
        }
        case 'FILL_FORM': {
          const fields: { elementId: string; value: string }[] = tc.args.fields || [];
          fields.forEach(({ elementId, value }) => {
            const el = document.getElementById(elementId) as HTMLInputElement;
            if (el) {
              el.value = value;
              // Update controlled React state too
              setFormData(prev => ({ ...prev, [elementId.replace('form-', '')]: value }));
              el.dispatchEvent(new Event('input', { bubbles: true }));
            }
          });
          showToast(`Filled ${fields.length} field(s) automatically`, 'success');
          break;
        }
        case 'SHOW_NOTIFICATION':
          showToast(tc.args.message, tc.args.type, tc.args.durationMs);
          break;
        case 'SCROLL_TO': {
          const { elementId, top, behavior = 'smooth' } = tc.args;
          if (elementId) document.getElementById(elementId)?.scrollIntoView({ behavior, block: 'center' });
          else if (top !== undefined) window.scrollTo({ top, behavior });
          break;
        }
        case 'COPY_TO_CLIPBOARD':
          navigator.clipboard.writeText(tc.args.text)
            .then(() => showToast('Copied to clipboard!', 'success'))
            .catch(() => showToast('Clipboard copy failed', 'error'));
          break;
        case 'TOGGLE_ELEMENT': {
          const el = document.getElementById(tc.args.elementId) as HTMLElement;
          if (!el) break;
          const show = tc.args.visible !== undefined ? tc.args.visible : el.style.display === 'none';
          el.style.display = show ? '' : 'none';
          break;
        }
        case 'SELECT_DROPDOWN': {
          const sel = document.getElementById(tc.args.elementId) as HTMLSelectElement;
          if (!sel) break;
          sel.value = tc.args.value;
          setFormData(prev => ({ ...prev, plan: tc.args.value }));
          sel.dispatchEvent(new Event('change', { bubbles: true }));
          break;
        }
        case 'HIGHLIGHT_ELEMENT': {
          const hl = document.getElementById(tc.args.elementId) as HTMLElement;
          if (!hl) break;
          const color = tc.args.color || '#6366f1';
          const dur = tc.args.durationMs || 2000;
          hl.style.outline = `3px solid ${color}`;
          hl.style.outlineOffset = '3px';
          hl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => { hl.style.outline = ''; hl.style.outlineOffset = ''; }, dur);
          showToast(`Highlighted #${tc.args.elementId}`, 'info', dur);
          break;
        }
        case 'WAIT_FOR_ELEMENT': {
          // Poll for element
          const timeout = tc.args.timeoutMs || 5000;
          const start = Date.now();
          const poll = () => {
            if (document.getElementById(tc.args.elementId)) {
              showToast(`Element #${tc.args.elementId} appeared`, 'success');
            } else if (Date.now() - start < timeout) {
              setTimeout(poll, 200);
            }
          };
          poll();
          break;
        }
        case 'GET_PAGE_URL':
          showToast(`URL: ${window.location.href}`, 'info', 5000);
          break;
        case 'SET_PAGE_TITLE':
          setPageTitle(tc.args.title);
          showToast(`Tab title set to "${tc.args.title}"`, 'success');
          break;
        case 'OPEN_MODAL': {
          const action = tc.args.action || 'open';
          setModalOpen(action === 'open');
          break;
        }
        case 'DOWNLOAD_FILE': {
          const a = document.createElement('a');
          a.href = tc.args.url;
          a.download = tc.args.filename || 'download';
          a.click();
          showToast(`Downloading ${tc.args.filename || 'file'}…`, 'info');
          break;
        }
        case 'SUBMIT_FORM': {
          const form = document.getElementById(tc.args.formId) as HTMLFormElement;
          if (form) {
            if (form.requestSubmit) { form.requestSubmit(); } else { form.submit(); }
            showToast('Form submitted!', 'success');
          }
          break;
        }
        case 'CHECKBOX_TOGGLE': {
          const cb = document.getElementById(tc.args.elementId) as HTMLInputElement;
          if (!cb) break;
          const next = tc.args.checked !== undefined ? tc.args.checked : !cb.checked;
          cb.checked = next;
          setFormData(prev => ({ ...prev, newsletter: next }));
          cb.dispatchEvent(new Event('change', { bubbles: true }));
          break;
        }
        case 'SET_THEME': {
          const t = tc.args.theme as 'dark' | 'light';
          setTheme(t);
          document.documentElement.dataset.theme = t;
          showToast(`Theme set to ${t}`, 'success');
          break;
        }
      }
    }
  }, [showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { role: 'user', content: input };
    const history = [...messages, userMsg];
    setMessages(history); setInput(''); setIsLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ messages: history, domElements })
      });
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
        processToolCalls(data.messages.flatMap((m: any) => m.toolCalls ?? []));
      } else {
        setMessages([...history, { role: 'assistant', content: 'Agent error.' }]);
      }
    } catch {
      setMessages([...history, { role: 'assistant', content: 'Network error.' }]);
    } finally { setIsLoading(false); }
  };

  const isDark = theme === 'dark';
  const toastColors: Record<Toast['type'], string> = {
    success: 'bg-emerald-500', error: 'bg-red-500', info: 'bg-indigo-500', warning: 'bg-amber-500',
  };

  const TOOLS = ['click/type','fillForm','navigate','notify','readText','observeState',
                 'scrollTo','copy','toggle','select','highlight','waitFor',
                 'getUrl','setTitle','modal','download','submitForm','checkbox','setTheme','3D'];

  return (
    <div className={`flex flex-col min-h-screen ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'} font-sans transition-colors duration-300`}>

      {/* ── Toast notifications ────────────────────────────────────────────── */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`${toastColors[t.type]} text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2`}>
            {t.type === 'success' && '✅'}{t.type === 'error' && '❌'}{t.type === 'info' && 'ℹ️'}{t.type === 'warning' && '⚠️'}
            {t.message}
          </div>
        ))}
      </div>

      {/* ── Modal ─────────────────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center" onClick={() => setModalOpen(false)}>
          <div id="demo-modal" className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl`} onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-2">AI Opened This Modal ✨</h3>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-4`}>The AI agent triggered the <code>openModal</code> tool to show this dialog.</p>
            <button id="close-modal-btn" onClick={() => setModalOpen(false)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium w-full transition-colors">Close Modal</button>
          </div>
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className={`px-6 py-4 border-b ${isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white/80'} backdrop-blur z-10 sticky top-0 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow font-bold text-white">A</div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">SynapseJS Agent</h1>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>20 built-in integrations · Spatial AI</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button id="open-modal-btn" onClick={() => setModalOpen(true)} className={`text-xs px-3 py-1.5 rounded-lg border ${isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-600'}`}>
            Open Modal
          </button>
          <button id="theme-toggle" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} className={`p-2 rounded-lg border ${isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-100'} transition-colors`} title="Toggle Theme">
            {isDark ? '🌙' : '☀️'}
          </button>
          <div id="cart-status" data-axon-read="true" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-500 font-medium text-sm border border-indigo-500/20">
            🛒 {cartCount} Items
          </div>
        </div>
      </header>

      {/* ── 3D Hero ───────────────────────────────────────────────────────── */}
      <SplineScene />

      {/* ── Tool pills ────────────────────────────────────────────────────── */}
      <div id="tools-bar" className={`flex gap-2 px-6 py-2.5 overflow-x-auto ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-100'} border-b text-xs`}>
        {TOOLS.map(t => (
          <span key={t} className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 whitespace-nowrap font-mono shrink-0">{t}</span>
        ))}
      </div>

      {/* ── Demo playground ───────────────────────────────────────────────── */}
      <div className={`mx-auto w-full max-w-4xl px-4 py-6 grid grid-cols-1 md:grid-cols-2 gap-4`}>

        {/* Interactive demo form */}
        <form id="demo-form" onSubmit={e => { e.preventDefault(); showToast('Form submitted!', 'success'); }} className={`${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'} border rounded-xl p-5 space-y-4`}>
          <h2 className="font-semibold text-sm uppercase tracking-wider text-indigo-400">Demo Form · Try "Fill the form"</h2>
          <div>
            <label className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} block mb-1`}>Name</label>
            <input id="form-name" value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))}
              className={`w-full rounded-lg px-3 py-2 text-sm border ${isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-slate-50 border-slate-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              placeholder="Your name" />
          </div>
          <div>
            <label className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} block mb-1`}>Email</label>
            <input id="form-email" type="email" value={formData.email} onChange={e => setFormData(p => ({...p, email: e.target.value}))}
              className={`w-full rounded-lg px-3 py-2 text-sm border ${isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-slate-50 border-slate-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              placeholder="you@example.com" />
          </div>
          <div>
            <label className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} block mb-1`}>Plan</label>
            <select id="form-plan" value={formData.plan} onChange={e => setFormData(p => ({...p, plan: e.target.value}))}
              className={`w-full rounded-lg px-3 py-2 text-sm border ${isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-slate-50 border-slate-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input id="form-newsletter" type="checkbox" checked={formData.newsletter} onChange={e => setFormData(p => ({...p, newsletter: e.target.checked}))}
              className="w-4 h-4 rounded accent-indigo-500" />
            <label htmlFor="form-newsletter" className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Subscribe to newsletter</label>
          </div>
          <button type="submit" id="form-submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">
            Submit Form
          </button>
        </form>

        {/* Quick action buttons */}
        <div className={`${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'} border rounded-xl p-5 space-y-3`}>
          <h2 className="font-semibold text-sm uppercase tracking-wider text-indigo-400">Quick Actions</h2>
          <button id="buy-product-1" onClick={() => setCartCount(c => c + 1)} className="w-full px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition-colors">
            🛒 Add to Cart
          </button>
          <button id="buy-product-2" onClick={() => setCartCount(c => c + 1)} className={`w-full px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${isDark ? 'border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10' : 'border-indigo-600 text-indigo-600 hover:bg-indigo-50'}`}>
            ✨ Exclusive Offer
          </button>
          <button id="show-notification-btn" onClick={() => showToast('Hello from a manual toast!', 'info')} className={`w-full px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-300 text-slate-600 hover:bg-slate-100'}`}>
            🔔 Test Toast
          </button>
          <button id="scroll-to-chat-btn" onClick={() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' })} className={`w-full px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-300 text-slate-600 hover:bg-slate-100'}`}>
            ⬇️ Scroll to Chat
          </button>
        </div>
      </div>

      {/* ── Chat Section ──────────────────────────────────────────────────── */}
      <div id="chat-section" className="flex-1 flex flex-col items-center px-4 pb-4" ref={scrollRef}>
        <div className="w-full max-w-3xl space-y-4 pb-24">

          {messages.length === 0 ? (
            <div className="text-center py-12 opacity-70">
              <div className="text-4xl mb-3">🪄</div>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Try: <span className="text-indigo-400">"Fill the form with test data"</span> ·{' '}
                <span className="text-indigo-400">"Select the Pro plan"</span> ·{' '}
                <span className="text-indigo-400">"Trigger the 3D hover animation"</span>
              </p>
            </div>
          ) : messages.map((m, i) => (
            <div key={i} className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 shadow-sm text-sm leading-relaxed whitespace-pre-wrap
                ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-br-sm'
                  : isDark ? 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-sm'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm'}`}>
                {m.role !== 'user' && (
                  <div className="text-indigo-400 text-xs font-semibold mb-1 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />Axon
                  </div>
                )}
                {m.content}
                {m.toolCalls && m.toolCalls.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {m.toolCalls.map((tc: any, ti: number) => (
                      <span key={ti} className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 font-mono">⚡ {tc.name}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className={`${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/80 border-slate-200'} border rounded-2xl px-5 py-3 flex items-center gap-2`}>
                <div className="h-4 w-4 rounded-full border-2 border-slate-600 border-t-indigo-500 animate-spin" />
                <span className="text-sm">Analyzing…</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Chat Input ────────────────────────────────────────────────────── */}
      <div className={`fixed bottom-0 left-0 right-0 p-4 ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'} border-t backdrop-blur flex justify-center z-20`}>
        <form onSubmit={handleSubmit} className="w-full max-w-3xl relative flex items-center">
          <input
            className={`w-full ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'} border-2 placeholder-slate-400 rounded-full pl-6 pr-14 py-4 focus:outline-none focus:border-indigo-500 transition-all shadow-lg text-sm`}
            value={input}
            placeholder="Try 'Fill the form', 'Select Pro plan', 'Highlight the cart'…"
            onChange={e => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading || !input.trim()} className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-full aspect-square flex items-center justify-center transition-colors shadow-md" aria-label="Send">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 ml-0.5"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
          </button>
        </form>
      </div>
    </div>
  );
}
