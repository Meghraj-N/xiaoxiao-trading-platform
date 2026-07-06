"use client";

import React, { useState, useRef, useEffect } from 'react';

export default function AIAssistantPage() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Based on current open interest, TSLA max pain for this Friday is hovering around $185. The Put/Call ratio is currently heavily skewed towards calls at the $190 strike, indicating significant resistance level.' }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
    
    if (e.target.value.startsWith('/')) {
      setShowCommands(true);
    } else {
      setShowCommands(false);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const newMessages = [...messages, { role: 'user', text: inputValue }];
    setMessages(newMessages);
    setInputValue("");
    setShowCommands(false);
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:8000/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: inputValue })
      });
      const data = await res.json();
      if (data.response) {
        setMessages([...newMessages, { role: 'assistant', text: data.response }]);
      } else if (data.error) {
        setMessages([...newMessages, { role: 'assistant', text: `Error: ${data.error}` }]);
      }
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', text: "Failed to connect to AI engine." }]);
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex w-full h-[calc(100vh-64px)] overflow-hidden">
      
      {/* Sidebar: Past Sessions */}
      <aside className="w-64 border-r border-white/5 bg-surface/30 backdrop-blur-md hidden md:flex flex-col h-full shrink-0">
        <div className="p-4 border-b border-white/5">
          <button 
            onClick={() => setMessages([])}
            className="w-full flex items-center justify-center gap-2 border border-outline-variant hover:border-primary text-on-surface hover:text-primary rounded-lg py-2 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span className="font-title-md text-[14px]">New Chat</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto chat-scroll p-3 flex flex-col gap-1">
          <h3 className="font-label-caps text-[10px] text-on-surface-variant/60 uppercase px-2 pt-2 pb-1">Today</h3>
          <button className="w-full text-left px-3 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface font-body-md text-[14px] truncate flex items-center gap-2 border-l-2 border-primary">
            <span className="material-symbols-outlined text-[16px] text-primary">chat_bubble</span>
            TSLA Max Pain Analysis
          </button>
          <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant font-body-md text-[14px] truncate flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
            AAPL Earnings Straddle
          </button>
          
          <h3 className="font-label-caps text-[10px] text-on-surface-variant/60 uppercase px-2 pt-4 pb-1">Saved Strategies</h3>
          <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant font-body-md text-[14px] truncate flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">insights</span>
            Delta Neutral Hedge
          </button>
        </div>
      </aside>

      {/* Main Chat Workspace */}
      <main className="flex-1 flex flex-col relative w-full max-w-4xl mx-auto px-4 md:px-gutter pb-6 h-full overflow-hidden">
        
        {/* Chat History Area */}
        <div className="flex-1 overflow-y-auto chat-scroll py-8 flex flex-col gap-6 relative z-10" id="chatContainer">
          
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-70">
              <span className="material-symbols-outlined text-[64px] text-primary" style={{fontVariationSettings: "'FILL' 1"}}>smart_toy</span>
              <h1 className="font-headline-lg text-headline-lg text-primary-fixed">Xiaoxiao AI Studio</h1>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
                Your advanced trading assistant. Analyze trends, query option chains, or backtest strategies using natural language.
              </p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'user' ? (
                <div className="glass-card bg-surface-container-high/80 p-4 rounded-2xl rounded-tr-sm max-w-[80%] border-l-2 border-l-primary shadow-lg">
                  <p className="font-body-md text-body-md text-on-surface whitespace-pre-wrap">{msg.text}</p>
                </div>
              ) : (
                <div className="flex gap-3 max-w-[95%] md:max-w-[85%]">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1 border border-primary/30">
                    <span className="material-symbols-outlined text-[18px] text-primary" style={{fontVariationSettings: "'FILL' 1"}}>smart_toy</span>
                  </div>
                  <div className="glass-card bg-surface-container-low/60 p-5 rounded-2xl rounded-tl-sm border border-outline-variant/30 shadow-xl relative overflow-hidden group">
                    {/* Simulated Glow Track */}
                    <div className="absolute -inset-[300px] bg-[radial-gradient(circle,rgba(255,180,163,0.1)_0%,transparent_50%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none mix-blend-screen left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                    
                    <p className="font-body-md text-body-md text-on-surface relative z-10 leading-relaxed whitespace-pre-wrap">
                      {msg.text}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[80%]">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1 border border-primary/30">
                  <span className="material-symbols-outlined text-[18px] text-primary" style={{fontVariationSettings: "'FILL' 1"}}>smart_toy</span>
                </div>
                <div className="glass-card bg-surface-container-low/60 px-5 py-4 rounded-2xl rounded-tl-sm border border-outline-variant/30 flex items-center gap-2 shadow-lg">
                  <span className="font-body-md text-[13px] text-on-surface-variant/80 italic">Analyzing market conditions</span>
                  <div className="flex items-center gap-1 ml-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{animationDelay: '0ms'}}></div>
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{animationDelay: '150ms'}}></div>
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{animationDelay: '300ms'}}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area Container */}
        <div className="mt-auto relative z-20 pb-4">
          
          {/* Floating Command Palette */}
          {showCommands && (
            <div className="absolute bottom-full left-0 mb-2 w-72 glass-panel rounded-xl shadow-2xl border border-primary/30 flex flex-col overflow-hidden">
              <div className="px-3 py-2 text-label-caps font-label-caps text-primary bg-surface-container/80 border-b border-white/5 uppercase flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">terminal</span> Commands
              </div>
              <div className="max-h-48 overflow-y-auto">
                <button onClick={() => {setInputValue('/clone '); setShowCommands(false)}} className="flex items-center gap-3 px-3 py-2 text-left hover:bg-white/5 border-l-2 border-transparent hover:border-primary w-full group transition-colors">
                  <span className="material-symbols-outlined text-[18px] text-secondary group-hover:text-primary transition-colors">content_copy</span>
                  <div className="flex flex-col">
                    <span className="font-title-md text-title-md text-on-surface">/clone <span className="text-on-surface-variant font-normal">[strategy]</span></span>
                    <span className="text-data-sm font-data-sm text-on-surface-variant">Duplicate a strategy</span>
                  </div>
                </button>
                <button onClick={() => {setInputValue('/generate '); setShowCommands(false)}} className="flex items-center gap-3 px-3 py-2 text-left hover:bg-white/5 border-l-2 border-transparent hover:border-primary w-full group transition-colors">
                  <span className="material-symbols-outlined text-[18px] text-secondary group-hover:text-primary transition-colors">auto_fix_high</span>
                  <div className="flex flex-col">
                    <span className="font-title-md text-title-md text-on-surface">/generate</span>
                    <span className="text-data-sm font-data-sm text-on-surface-variant">Generate code</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          <div className="glass-card rounded-xl p-2 flex items-end gap-2 border-primary/50 shadow-[0_0_15px_rgba(255,180,163,0.1)] transition-all bg-surface-container-lowest/80 focus-within:shadow-[0_0_25px_rgba(255,180,163,0.2)] focus-within:border-primary">
            <button className="p-2 text-on-surface-variant hover:text-primary transition-colors rounded-lg hover:bg-white/5 shrink-0">
              <span className="material-symbols-outlined">attach_file</span>
            </button>
            <textarea 
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="w-full bg-transparent border-none text-on-surface font-body-md text-body-md resize-none py-2 px-2 focus:ring-0 placeholder:text-on-surface-variant/50 max-h-32 overflow-y-auto outline-none"
              placeholder="Ask Xiaoxiao AI... (Type '/' for commands)" 
              rows={1}
              style={{height: '40px'}}
            />
            <button 
              onClick={handleSend}
              className="btn-primary p-2 rounded-lg shrink-0 flex items-center justify-center group"
            >
              <span className="material-symbols-outlined text-[20px] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform">send</span>
            </button>
          </div>
          <div className="text-center mt-2">
            <span className="font-data-sm text-[11px] text-on-surface-variant/60 tracking-wide">Xiaoxiao AI can make mistakes. Verify critical trade data.</span>
          </div>

        </div>
      </main>
    </div>
  );
}
