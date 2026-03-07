'use client';

import { useEffect, useState } from 'react';
import { useSynapseDOM, useSynapseSignals } from '@synapsejs/core/client';

export function FloatingAssistant() {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
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
      if (!args) return;
      const url = args.url || args.path;
      if (!url) return;
      window.location.href = url;
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
      setMessages([...history, { role: 'assistant', content: "⚠️ Connection error." }]);
    } finally {
      setIsLoading(false);
    }
  };

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
    { role: 'ai', text: "👋 I'm the SynapseJS demo agent. I can control this page in real time.<br><br>Try: <em>\"Go to the docs\"</em>" }
  ];

  return (
    <div className={`synapse-assistant-bundle ${isAssistantOpen ? 'is-open' : ''}`}>
      <button 
        id="synapse-fab" 
        className="synapse-fab"
        onClick={() => setIsAssistantOpen(!isAssistantOpen)}
      >
        <div className="fab-icon">{isAssistantOpen ? '✕' : '⚡'}</div>
      </button>

      <div className="synapse-chat-panel">
        <div className="chat-header">
          <div className="agent-avatar">⚡</div>
          <div className="agent-info">
            <div className="agent-name">Synapse Agent</div>
            <div className="agent-status">Online</div>
          </div>
        </div>
        
        <div className="chat-body">
            {chatMessages.map((m, i) => (
                <div key={i} className={`chat-bubble-container ${m.role}`}>
                    <div className="chat-bubble" dangerouslySetInnerHTML={{ __html: m.text }} />
                </div>
            ))}
            {isLoading && (
                <div className="chat-bubble-container ai">
                    <div className="chat-bubble loading-dots">
                        <span>.</span><span>.</span><span>.</span>
                    </div>
                </div>
            )}
        </div>

        <div className="chat-footer">
          <input 
            type="text" 
            placeholder="Type a command..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button id="chat-send-btn" onClick={handleSend} disabled={isLoading}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
