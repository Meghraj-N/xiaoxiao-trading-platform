"use client";

import React, { useState, useEffect } from 'react';

export default function StrategyBuilderPage() {
  const [strategies, setStrategies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createCode, setCreateCode] = useState("");

  const fetchStrategies = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/strategies');
      const data = await res.json();
      
      const builtInNames = [
        "EMA Cross", "RSI Revert", "Boll Break", 
        "200-MA Trend Following", "ORB Breakout", "Supertrend Flipper"
      ];

      const loaded = (data.strategies || []).map((s: any) => ({
        ...s,
        isCustom: !builtInNames.includes(s.name),
        winRate: "0.0", 
        pnl: "0.00",
        sharpe: "0.00",
        maxDd: "0.0"
      }));

      // Add a couple defaults if backend doesn't have them running
      if (loaded.length === 0) {
        loaded.push({
          name: "Volatility Scalper", active: true, isCustom: false,
          winRate: "0.0", pnl: "0.00", sharpe: "0.00", maxDd: "0.0"
        });
      }

      setStrategies(loaded);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStrategies();
  }, []);

  const toggleStrategy = async (name: string, currentStatus: boolean) => {
    try {
      const endpoint = currentStatus ? '/api/control/stop' : '/api/control/start';
      await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy: name })
      });
      // Refresh
      fetchStrategies();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-gutter min-h-full">
      <div className="max-w-[1440px] mx-auto space-y-6 pb-20">
        
        {/* Page Header */}
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">Strategy Hub</h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
              Deploy automated trading algorithms tailored to your risk profile. Monitor performance metrics in real-time and manage your active bots.
            </p>
          </div>
          {/* Filter/Sort Controls */}
          <div className="flex items-center gap-3">
            <div className="relative glass-card rounded-lg flex items-center px-3 py-2 w-full md:w-auto">
              <span className="material-symbols-outlined text-on-surface-variant mr-2">search</span>
              <input className="bg-transparent border-none text-on-surface font-body-md text-body-md focus:ring-0 p-0 placeholder-on-surface-variant/50 w-full md:w-48 outline-none" placeholder="Search strategies..." type="text" />
            </div>
            <button className="glass-card p-2 rounded-lg text-on-surface-variant hover:text-primary transition-colors flex-shrink-0">
              <span className="material-symbols-outlined">filter_list</span>
            </button>
            <button 
              onClick={() => {
                 setCreateName("");
                 setCreateCode("");
                 setShowCreateModal(true);
              }}
              className="btn-primary p-2 rounded-lg text-on-primary transition-colors flex items-center gap-2 px-4 shadow-[0_0_15px_rgba(255,180,163,0.3)]"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span className="font-label-caps uppercase tracking-wider hidden md:block">New Custom Strategy</span>
            </button>
          </div>
        </header>

        {/* Strategy Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {strategies.map((strat, idx) => (
            <article key={idx} className={`rounded-xl p-6 flex flex-col gap-6 relative overflow-hidden group transition-all ${strat.active ? 'glass-card-hover border-primary/50 shadow-[0_0_20px_rgba(255,126,95,0.15)]' : 'glass-panel hover:border-primary/30'}`}>
              
              {strat.active && (
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-[60px] pointer-events-none"></div>
              )}

              <header className="flex justify-between items-start z-10">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined ${strat.active ? 'text-primary' : 'text-secondary'} text-lg`} style={{fontVariationSettings: strat.active ? "'FILL' 1" : ""}}>
                      {strat.isCustom ? 'architecture' : 'bolt'}
                    </span>
                    <h3 className="font-title-md text-title-md text-on-surface">{strat.name}</h3>
                  </div>
                  <span className="font-data-sm text-data-sm text-on-surface-variant bg-surface-container-high/50 px-2 py-0.5 rounded w-max">
                    {strat.isCustom ? 'Custom AI Built' : 'Built-in Engine'}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-label-caps text-[10px] text-on-surface-variant mb-1 opacity-60">RISK LEVEL</span>
                  <div className="flex gap-1">
                    <span className={`w-3 h-1 rounded-full ${strat.active ? 'bg-primary shadow-[0_0_8px_rgba(255,180,163,0.6)]' : 'bg-secondary'}`}></span>
                    <span className={`w-3 h-1 rounded-full ${strat.active ? 'bg-primary shadow-[0_0_8px_rgba(255,180,163,0.6)]' : 'bg-secondary'}`}></span>
                    <span className={`w-3 h-1 rounded-full ${strat.active ? 'bg-primary shadow-[0_0_8px_rgba(255,180,163,0.6)]' : 'bg-surface-variant'}`}></span>
                  </div>
                </div>
              </header>

              <div className="grid grid-cols-2 gap-y-4 gap-x-2 z-10">
                <div className="flex flex-col">
                  <span className="font-label-caps text-[10px] text-on-surface-variant opacity-60">WIN RATE</span>
                  <span className="font-data-lg text-data-lg text-on-surface">{strat.winRate}%</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-caps text-[10px] text-on-surface-variant opacity-60">24H P&L</span>
                  <span className={`font-data-lg text-data-lg px-2 py-0.5 rounded ${parseFloat(strat.pnl) > 0 ? 'text-primary bg-primary/10 shadow-[0_0_8px_rgba(255,180,163,0.2)]' : parseFloat(strat.pnl) < 0 ? 'text-error bg-error/10' : 'text-on-surface bg-surface-container-high'}`}>
                    {parseFloat(strat.pnl) > 0 ? '+' : ''}${strat.pnl}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-caps text-[10px] text-on-surface-variant opacity-60">SHARPE</span>
                  <span className="font-data-sm text-on-surface">{strat.sharpe}</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-caps text-[10px] text-on-surface-variant opacity-60">MAX DD</span>
                  <span className="font-data-sm text-error">{strat.maxDd}%</span>
                </div>
              </div>

              {/* Sparkline (mock) */}
              <div className={`h-12 w-full z-10 transition-all duration-500 ${strat.active ? '' : 'opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-100'}`}>
                <svg height="100%" preserveAspectRatio="none" viewBox="0 0 100 30" width="100%">
                  <defs>
                    <linearGradient id="sparkline-grad" x1="0%" x2="100%" y1="0%" y2="0%">
                      <stop offset="0%" stopColor="#ffb4a3"></stop>
                      <stop offset="100%" stopColor="#ffb780"></stop>
                    </linearGradient>
                    <linearGradient id="sparkline-area-grad" x1="0%" x2="0%" y1="0%" y2="100%">
                      <stop offset="0%" stopColor="#ffb4a3" stopOpacity="0.3"></stop>
                      <stop offset="100%" stopColor="#ffb4a3" stopOpacity="0"></stop>
                    </linearGradient>
                  </defs>
                  <path d={strat.active ? "M0,30 L0,20 C15,18 25,25 40,15 C55,5 75,20 100,5 L100,30 Z" : "M0,30 L0,15 C20,25 40,5 60,20 C80,10 90,25 100,15 L100,30 Z"} fill="url(#sparkline-area-grad)"></path>
                  <path d={strat.active ? "M0,20 C15,18 25,25 40,15 C55,5 75,20 100,5" : "M0,15 C20,25 40,5 60,20 C80,10 90,25 100,15"} fill="none" stroke="url(#sparkline-grad)" strokeWidth="1.5"></path>
                </svg>
              </div>

              <footer className="mt-auto flex flex-col gap-2 z-10">
                {strat.active ? (
                  <>
                    <div className="flex items-center justify-between bg-surface-container-lowest/40 px-3 py-2 rounded border border-white/5">
                      <span className="font-data-sm text-[12px] text-on-surface-variant flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
                        Bot Active
                      </span>
                      <span className="font-data-sm text-[12px] text-on-surface opacity-80">Connected</span>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 py-2 px-3 rounded bg-surface-container-high hover:bg-surface-bright border border-white/10 text-on-surface font-label-caps text-[11px] transition-all flex items-center justify-center gap-2">
                        CONFIG
                      </button>
                      <button 
                        onClick={() => toggleStrategy(strat.name, strat.active)}
                        className="flex-1 py-2 px-3 rounded bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 text-red-400 font-label-caps text-[11px] transition-all flex items-center justify-center gap-2"
                      >
                        STOP BOT
                      </button>
                    </div>
                  </>
                ) : (
                  <button 
                    onClick={() => toggleStrategy(strat.name, strat.active)}
                    className="w-full py-2.5 px-4 rounded btn-primary font-label-caps text-[11px] flex items-center justify-center gap-2"
                  >
                    START STRATEGY
                  </button>
                )}
              </footer>
            </article>
          ))}
        </div>

      </div>

      {/* Manual Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-container p-6 rounded-2xl border border-white/10 w-full max-w-2xl shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-3 text-primary mb-2">
              <span className="material-symbols-outlined text-[24px]">architecture</span>
              <h3 className="font-headline-sm text-headline-sm">Create Custom Strategy</h3>
            </div>
            
            <p className="text-on-surface-variant font-body-md text-sm">
              Manually write or paste your Python trading strategy code here.
            </p>

            <input 
              value={createName}
              onChange={e => setCreateName(e.target.value)}
              placeholder="Strategy Name (e.g. My Custom Algo)"
              autoFocus
              className="w-full bg-surface-container-lowest border border-white/10 p-3 rounded-lg text-on-surface font-title-md focus:border-primary focus:ring-0 outline-none transition-colors"
            />

            <textarea 
              value={createCode}
              onChange={e => setCreateCode(e.target.value)}
              placeholder="from engine.strategies.base import BaseStrategy..."
              rows={12}
              className="w-full bg-surface-container-lowest border border-white/10 p-3 rounded-lg text-on-surface font-body-md font-mono text-[13px] focus:border-primary focus:ring-0 outline-none transition-colors resize-none"
            />
            
            <div className="flex justify-between items-center mt-2">
              <span className="font-data-sm text-[11px] text-on-surface-variant opacity-70">
                You can also ask the <a href="/ai-assistant" className="text-primary hover:underline">AI Assistant</a> to build one for you!
              </span>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setShowCreateModal(false)} 
                  className="px-4 py-2 rounded-lg text-on-surface-variant hover:bg-white/5 hover:text-on-surface transition-colors font-label-caps tracking-wide"
                >
                  Cancel
                </button>
                <button 
                  disabled={!createName.trim() || !createCode.trim()}
                  onClick={async () => {
                     try {
                        const res = await fetch('http://localhost:8000/api/custom-strategies', {
                           method: 'POST',
                           headers: {'Content-Type': 'application/json'},
                           body: JSON.stringify({ name: createName.trim(), code: createCode })
                        });
                        if (res.ok) {
                          setShowCreateModal(false);
                          fetchStrategies(); // refresh list
                        } else {
                          const err = await res.json();
                          alert(`Failed to save strategy: ${err.detail || 'Unknown error'}`);
                        }
                     } catch (e) {
                        alert('Failed to connect to backend server');
                     }
                  }}
                  className="px-6 py-2 bg-primary text-on-primary rounded-lg hover:opacity-90 transition-opacity font-label-caps tracking-wide disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
