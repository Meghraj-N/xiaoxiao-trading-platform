"use client";

import { AnimatedAIChat } from "@/components/ui/animated-ai-chat";

export default function AIStudioPage() {
  return (
    <div className="flex-1 flex w-full max-w-container-max mx-auto h-[calc(100vh-64px)] overflow-hidden">
      {/* Sidebar: Past Sessions */}
      <aside className="w-64 border-r border-white/5 bg-surface/30 backdrop-blur-md hidden md:flex flex-col h-full shrink-0">
        <div className="p-4 border-b border-white/5">
          <button className="w-full flex items-center justify-center gap-2 border border-outline-variant hover:border-primary text-on-surface hover:text-primary rounded-lg py-2 transition-colors">
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
          
          <h3 className="font-label-caps text-[10px] text-on-surface-variant/60 uppercase px-2 pt-4 pb-1">Previous 7 Days</h3>
          <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant font-body-md text-[14px] truncate flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
            SPY Iron Condor Setup
          </button>
          <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant font-body-md text-[14px] truncate flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
            NVDA Volatility Skew
          </button>
          <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant font-body-md text-[14px] truncate flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
            VIX Trend Correlation
          </button>
        </div>
      </aside>

      {/* Main Chat Workspace */}
      <main className="flex-1 flex flex-col relative w-full max-w-4xl mx-auto px-4 md:px-gutter pb-6 h-full overflow-hidden">
        {/* Ambient Background Glow */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none -z-10" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(255, 180, 163, 0.05) 0%, transparent 70%)' }}></div>
        
        <div className="w-full h-full pt-8 flex flex-col relative z-10">
          <AnimatedAIChat />
        </div>
      </main>
    </div>
  );
}
