"use client";

import React, { useState, useEffect, useRef } from 'react';

export default function TradingPage() {
  const [symbol, setSymbol] = useState('BTC/USDT');
  const [price, setPrice] = useState(0);
  const [orderType, setOrderType] = useState('market');
  const [side, setSide] = useState('buy');
  const [amount, setAmount] = useState('');
  
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Establish WebSocket Connection
    const ws = new WebSocket(`ws://localhost:8000/ws`);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'price_update' && data.symbol === symbol) {
          setPrice(data.price);
        }
      } catch (err) {
        console.error("WS parse error", err);
      }
    };

    return () => {
      ws.close();
    };
  }, [symbol]);

  // TradingView Widget Injection
  useEffect(() => {
    if (!chartContainerRef.current) return;
    
    chartContainerRef.current.innerHTML = '';
    
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (typeof window !== 'undefined' && (window as any).TradingView) {
        new (window as any).TradingView.widget({
          autosize: true,
          symbol: `BINANCE:${symbol.replace('/', '')}`,
          interval: "60",
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: "en",
          enable_publishing: false,
          backgroundColor: "#151311",
          gridColor: "rgba(255, 255, 255, 0.05)",
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          container_id: "tv_chart_container"
        });
      }
    };
    chartContainerRef.current.appendChild(script);
  }, [symbol]);

  return (
    <div className="p-gutter relative min-h-full">
      <div className="max-w-[1440px] mx-auto space-y-6 pb-20">
        
        {/* Page Header */}
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Live Trading</h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">Execute manual trades alongside the AI.</p>
          </div>
          <div className="flex gap-2">
            <select 
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="glass-panel text-on-surface font-data-sm text-data-sm rounded px-3 py-1.5 outline-none focus:border-primary cursor-pointer"
            >
              <option value="BTC/USDT">BTC/USDT</option>
              <option value="ETH/USDT">ETH/USDT</option>
              <option value="SOL/USDT">SOL/USDT</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[700px]">
          
          {/* Main Chart Area */}
          <div className="lg:col-span-3 glass-panel rounded-xl p-1 shadow-lg relative flex flex-col h-full overflow-hidden">
             <div className="absolute inset-0 rounded-xl pointer-events-none" style={{background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)', padding: '1px', WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude'}}></div>
             <div 
               id="tv_chart_container" 
               ref={chartContainerRef} 
               className="w-full h-full bg-surface rounded-lg z-10"
             ></div>
          </div>

          {/* Order Entry Panel */}
          <div className="glass-panel rounded-xl p-6 shadow-lg flex flex-col h-full relative glow-accent">
            <h3 className="font-title-md text-title-md text-on-surface mb-6 border-b border-white/10 pb-4">Place Order</h3>
            
            <div className="flex gap-2 mb-6 p-1 bg-surface-container-high rounded-lg">
               <button 
                 onClick={() => setSide('buy')}
                 className={`flex-1 py-2 font-label-caps text-label-caps rounded ${side === 'buy' ? 'bg-green-500/20 text-green-400 border border-green-500/50 shadow-[0_0_15px_rgba(74,222,128,0.2)]' : 'text-on-surface-variant hover:bg-surface-variant/50'}`}
               >
                 BUY
               </button>
               <button 
                 onClick={() => setSide('sell')}
                 className={`flex-1 py-2 font-label-caps text-label-caps rounded ${side === 'sell' ? 'bg-red-500/20 text-red-400 border border-red-500/50 shadow-[0_0_15px_rgba(248,113,113,0.2)]' : 'text-on-surface-variant hover:bg-surface-variant/50'}`}
               >
                 SELL
               </button>
            </div>

            <div className="space-y-4 flex-1">
              <div>
                <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">Order Type</label>
                <select 
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-white/10 rounded-lg px-3 py-2 text-on-surface font-body-md outline-none focus:border-primary focus:shadow-[0_0_10px_rgba(255,180,163,0.2)]"
                >
                  <option value="market">Market</option>
                  <option value="limit">Limit</option>
                </select>
              </div>

              {orderType === 'limit' && (
                <div>
                  <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">Limit Price (USDT)</label>
                  <input 
                    type="number"
                    value={price || ''}
                    className="w-full bg-surface-container-lowest border border-white/10 rounded-lg px-3 py-2 text-on-surface font-data-md outline-none focus:border-primary focus:shadow-[0_0_10px_rgba(255,180,163,0.2)]"
                  />
                </div>
              )}

              <div>
                <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">Amount ({symbol.split('/')[0]})</label>
                <input 
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-surface-container-lowest border border-white/10 rounded-lg px-3 py-2 text-on-surface font-data-md outline-none focus:border-primary focus:shadow-[0_0_10px_rgba(255,180,163,0.2)]"
                />
              </div>

              {/* Estimate Data */}
              <div className="mt-8 bg-surface-container-low border border-white/5 p-4 rounded-lg space-y-2">
                <div className="flex justify-between font-body-md text-sm text-on-surface-variant">
                  <span>Available Balance:</span>
                  <span className="text-on-surface font-data-sm">$1,450.00</span>
                </div>
                <div className="flex justify-between font-body-md text-sm text-on-surface-variant">
                  <span>Estimated Value:</span>
                  <span className="text-on-surface font-data-sm">
                    ${(parseFloat(amount || '0') * (price || 0)).toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </span>
                </div>
                <div className="flex justify-between font-body-md text-sm text-on-surface-variant">
                  <span>Fee (0.05%):</span>
                  <span className="text-on-surface font-data-sm">
                    ${((parseFloat(amount || '0') * (price || 0)) * 0.0005).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <button 
              className={`w-full py-3 rounded-lg font-label-caps text-label-caps tracking-widest transition-all ${side === 'buy' ? 'bg-green-500 hover:bg-green-400 text-green-950 shadow-[0_0_20px_rgba(74,222,128,0.4)] hover:shadow-[0_0_30px_rgba(74,222,128,0.6)]' : 'bg-red-500 hover:bg-red-400 text-red-950 shadow-[0_0_20px_rgba(248,113,113,0.4)] hover:shadow-[0_0_30px_rgba(248,113,113,0.6)]'}`}
            >
              {side === 'buy' ? 'EXECUTE LONG' : 'EXECUTE SHORT'}
            </button>
            
          </div>
        </div>

      </div>
    </div>
  );
}
