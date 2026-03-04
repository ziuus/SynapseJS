'use client';

import { useEffect, useRef, useState } from 'react';
import { useAgentDOM } from '@axonjs/core/client';

type Message = { role: 'user' | 'assistant', content: string, toolCalls?: any[] };

export default function ChatDashboard() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [cartCount, setCartCount] = useState(0);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const domElements = useAgentDOM();

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
            body: JSON.stringify({ 
              messages: newHistory,
              domElements 
            })
        });
        
        const data = await res.json();
        if (data.messages) {
            setMessages(data.messages);
            
            // Check for AI Interaction Signals
            const lastAssistantMsg = data.messages[data.messages.length - 1];
            const signalMsg = data.messages.find((m: any) => m.toolCalls?.some((tc: any) => tc.name === 'interactWithScreen'));
            
            if (signalMsg) {
              const interaction = signalMsg.toolCalls.find((tc: any) => tc.name === 'interactWithScreen');
              if (interaction) {
                handleAISignal(interaction.args);
              }
            }
        } else {
            setMessages([...newHistory, { role: 'assistant', content: "Error executing agent." }]);
        }
    } catch (e) {
        setMessages([...newHistory, { role: 'assistant', content: "Network error calling AxonJS." }]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleAISignal = (args: any) => {
    const { elementId, action, value } = args;
    console.log(`[Axon Signal] Executing AI request: ${action} on ${elementId}`);

    const element = document.getElementById(elementId);
    if (!element) {
      console.warn(`[Axon Signal] Element with ID ${elementId} not found.`);
      return;
    }

    if (action === 'click') {
      (element as HTMLElement).click();
    } else if (action === 'type' && value) {
      if (element instanceof HTMLInputElement) {
        element.value = value;
        // Trigger React change event
        const event = new Event('input', { bubbles: true });
        element.dispatchEvent(event);
      }
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const addToCart = () => {
    setCartCount(prev => prev + 1);
  };

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className={`flex flex-col h-screen ${theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'} font-sans transition-colors duration-300`}>
      
      {/* Header */}
      <header className={`px-6 py-4 border-b ${theme === 'dark' ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white/50'} backdrop-blur z-10 shadow-sm flex items-center justify-between`}>
        <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg font-bold text-lg text-white">
                A
            </div>
            <div>
                <h1 className="text-xl font-semibold tracking-tight">AxonJS Agent</h1>
                <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Unbounded UI Mode v2</p>
            </div>
        </div>

        <div className="flex items-center gap-4">
            <button 
              id="theme-toggle"
              onClick={toggleTheme}
              className={`p-2 rounded-lg border ${theme === 'dark' ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-100'} transition-colors`}
              title="Toggle Theme"
            >
              {theme === 'dark' ? '🌙' : '☀️'}
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

      {/* Main Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center" ref={scrollRef}>
        <div className="w-full max-w-3xl space-y-6 pb-20">
          
          {messages.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center pt-24 text-center opacity-80">
                <div className="h-16 w-16 mb-6 rounded-full bg-slate-800 flex items-center justify-center text-3xl shadow-inner border border-slate-700">
                    🪄
                </div>
                <h2 className="text-2xl font-medium mb-2">Autonomous UI Assistant</h2>
                <p className={`max-w-md ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  I can see the buttons on your screen. Try saying 
                  <span className="text-indigo-500 font-semibold px-1">"Switch to light mode"</span> 
                  or <span className="text-indigo-500 font-semibold px-1">"Add something to my cart"</span>.
                </p>
                
                <div className="mt-8 grid grid-cols-2 gap-4">
                    <button 
                      id="buy-product-1"
                      onClick={addToCart}
                      className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-all shadow-lg hover:scale-105"
                    >
                       Purchase Product 🚀
                    </button>
                    <button 
                      id="buy-product-2"
                      onClick={addToCart}
                      className={`px-6 py-3 rounded-xl border-2 ${theme === 'dark' ? 'border-indigo-500/50 hover:bg-indigo-500/10' : 'border-indigo-600 hover:bg-indigo-50'} text-indigo-500 font-medium transition-all`}
                    >
                       Exclusive Offer ✨
                    </button>
                </div>
             </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`
                    max-w-[85%] rounded-2xl px-5 py-3.5 shadow-sm leading-relaxed whitespace-pre-wrap
                    ${m.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-br-sm' 
                        : theme === 'dark' 
                            ? 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-sm'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm'}
                  `}
                >
                  {m.role !== 'user' && (
                      <div className="text-indigo-400 text-xs font-semibold mb-1 uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block animate-pulse"></span>
                          Axon
                      </div>
                  )}
                  {m.content}
                </div>
              </div>
            ))
          )}

          {/* Loading Indicator */}
          {isLoading && (
              <div className="flex w-full justify-start">
                  <div className={`${theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/80 border-slate-200'} border text-slate-400 rounded-2xl px-5 py-3 rounded-bl-sm flex items-center gap-2`}>
                       <div className="h-4 w-4 rounded-full border-2 border-slate-600 border-t-indigo-500 animate-spin"></div>
                       <span className="text-sm font-medium">Analyzing UI...</span>
                  </div>
              </div>
          )}
        </div>
      </main>

      {/* Input Area */}
      <div className={`p-4 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'} border-t flex justify-center sticky bottom-0`}>
        <form onSubmit={handleSubmit} className="w-full max-w-3xl relative flex items-center">
          <input
            className={`w-full ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'} border-2  placeholder-slate-400 rounded-full pl-6 pr-14 py-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-lg`}
            value={input}
            placeholder="Try 'Click the purchase button'..."
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button 
            type="submit" 
            disabled={isLoading || !input || !input.trim()}
            className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-full aspect-square flex items-center justify-center transition-colors shadow-md"
            aria-label="Send message"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 ml-0.5"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
          </button>
        </form>
      </div>
      
    </div>
  );
}
