"use client";

import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

interface BotStatus {
  running: boolean;
  equity: number;
  starting_capital: number;
  pnl: number;
  uptime_seconds: number;
  exchange: string;
  testnet: boolean;
}

interface Position {
  id: string;
  symbol: string;
  side: string;
  entry_price: number;
  quantity: number;
  leverage: number;
  pnl?: number; // Calculated later if needed
}

export default function DashboardPage() {
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [equityCurve, setEquityCurve] = useState<any[]>([]);

  useEffect(() => {
    // Fetch initial state and poll
    const fetchData = async () => {
      try {
        const [statusRes, posRes, priceRes, equityRes] = await Promise.all([
          fetch('http://localhost:8000/api/status').then(r => r.json()),
          fetch('http://localhost:8000/api/positions').then(r => r.json()),
          fetch('http://localhost:8000/api/prices').then(r => r.json()),
          fetch('http://localhost:8000/api/equity').then(r => r.json())
        ]);
        setStatus(statusRes);
        setPositions(posRes.positions || []);
        setPrices(priceRes.prices || {});
        setEquityCurve(equityRes.equity_curve || []);
      } catch (err) {
        console.error("Error fetching data", err);
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const btcPrice = prices['BTC/USDT'] || 0;
  
  const chartData = {
    labels: equityCurve.map(e => new Date(e.timestamp * 1000).toLocaleTimeString()),
    datasets: [
      {
        fill: true,
        label: 'Equity',
        data: equityCurve.map(e => e.equity),
        borderColor: '#ffb4a3', // primary
        backgroundColor: 'rgba(255, 180, 163, 0.2)',
        tension: 0.4,
        pointRadius: 0,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, border: { display: false } },
      x: { grid: { display: false }, border: { display: false }, ticks: { maxTicksLimit: 8 } }
    },
    plugins: {
      legend: { display: false }
    }
  };

  return (
    <div className="p-gutter relative bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-surface-container-high/40 via-background to-background min-h-full">
      <div className="max-w-[1440px] mx-auto space-y-6 pb-20">
        
        {/* Page Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Trading Dashboard</h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">Live market overview and AI portfolio insights.</p>
          </div>
          <div className="flex gap-2">
            <select className="glass-panel text-on-surface font-data-sm text-data-sm rounded px-3 py-1.5 outline-none focus:border-primary cursor-pointer">
              <option value="all">All Accounts</option>
              <option value="paper">Paper Trading</option>
            </select>
          </div>
        </div>

        {/* Bento Grid / Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="glass-panel rounded-xl p-6 relative overflow-hidden group glow-accent">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="font-label-caps text-label-caps text-on-surface-variant mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
              Total Portfolio Value
            </div>
            <div className="font-data-lg text-data-lg text-primary text-3xl font-bold">
              ${status?.equity ? status.equity.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2}) : '0.00'}
            </div>
            <div className="font-data-sm text-data-sm text-on-surface-variant mt-1 flex items-center gap-1">
              PnL: <span className={(status?.pnl || 0) >= 0 ? "text-green-400" : "text-red-400"}>
                {(status?.pnl || 0) >= 0 ? '+' : ''}{status?.pnl ? status.pnl.toLocaleString(undefined, {minimumFractionDigits: 2}) : '0.00'}
              </span>
            </div>
          </div>

          <div className="glass-panel rounded-xl p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="font-label-caps text-label-caps text-on-surface-variant mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">bolt</span>
              Uptime
            </div>
            <div className="font-data-lg text-data-lg text-secondary text-3xl font-bold">
              {status?.uptime_seconds ? Math.floor(status.uptime_seconds / 3600) : 0}h {status?.uptime_seconds ? Math.floor((status.uptime_seconds % 3600) / 60) : 0}m
            </div>
            <div className="font-data-sm text-data-sm text-on-surface-variant mt-1">
              Exchange: <span className="text-on-surface capitalize">{status?.exchange || 'delta'}</span>
            </div>
          </div>

          <div className="glass-panel rounded-xl p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-tertiary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="font-label-caps text-label-caps text-on-surface-variant mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">currency_bitcoin</span>
              BTC/USDT
            </div>
            <div className="font-data-lg text-data-lg text-on-surface text-3xl font-bold">
              ${btcPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}
            </div>
            <div className="font-data-sm text-data-sm text-on-surface-variant mt-1 text-on-surface flex items-center gap-1">
              Live Price
            </div>
          </div>

          <div className="glass-panel rounded-xl p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-outline/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="font-label-caps text-label-caps text-on-surface-variant mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">power</span>
              System Status
            </div>
            <div className="font-data-lg text-data-lg text-3xl font-bold flex items-center gap-2">
              {status?.running ? (
                <>
                  <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-green-400">ONLINE</span>
                </>
              ) : (
                <>
                  <div className="w-4 h-4 rounded-full bg-red-500"></div>
                  <span className="text-red-400">OFFLINE</span>
                </>
              )}
            </div>
            <div className="font-data-sm text-data-sm text-on-surface-variant mt-1">
              Network: <span className="text-on-surface">{status?.testnet ? 'Testnet' : 'Live'}</span>
            </div>
          </div>
        </div>

        {/* Main Sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Chart Area */}
          <div className="lg:col-span-2 glass-panel rounded-xl p-1 shadow-lg relative glow-accent flex flex-col min-h-[450px]">
            <div className="absolute inset-0 rounded-xl pointer-events-none" style={{background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)', padding: '1px', WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude'}}></div>
            <div className="bg-surface-container-lowest/80 rounded-lg p-6 flex-1 flex flex-col relative overflow-hidden">
              <div className="flex justify-between items-center mb-6 z-10">
                <h2 className="font-title-md text-title-md text-on-surface">Live Equity Curve</h2>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary/80"></div><span className="font-data-sm text-data-sm text-on-surface-variant">Paper Equity</span></div>
                </div>
              </div>
              
              <div className="flex-1 w-full relative z-10 px-2 pb-2">
                {equityCurve.length > 0 ? (
                  <Line data={chartData} options={chartOptions} />
                ) : (
                  <div className="flex h-full items-center justify-center text-on-surface-variant">Waiting for equity snapshots...</div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar Area */}
          <div className="flex flex-col gap-6">
            
            {/* Active Positions */}
            <div className="glass-panel rounded-xl p-6 shadow-lg flex-1">
              <h3 className="font-title-md text-title-md text-on-surface mb-4 border-b border-white/10 pb-4">Active Positions</h3>
              <div className="space-y-3 mt-4 h-[350px] overflow-y-auto pr-2 chat-scroll">
                
                {positions.length > 0 ? positions.map((pos) => {
                  const currentPrice = prices[pos.symbol] || pos.entry_price;
                  const isLong = pos.side.toUpperCase() === 'BUY';
                  const unrealizedPnl = isLong 
                    ? (currentPrice - pos.entry_price) * pos.quantity 
                    : (pos.entry_price - currentPrice) * pos.quantity;
                  const isProfit = unrealizedPnl >= 0;

                  return (
                    <div key={pos.id} className="flex justify-between items-center p-3 bg-surface-container-lowest/50 rounded-lg border border-white/5">
                      <div>
                        <div className="font-label-caps text-on-surface flex items-center gap-2">
                          <span className={isLong ? "text-green-400 font-bold" : "text-red-400 font-bold"}>{isLong ? 'LONG' : 'SHORT'}</span> {pos.symbol}
                        </div>
                        <div className="font-data-sm text-xs text-on-surface-variant mt-1">Entry: ${pos.entry_price.toFixed(2)}</div>
                        <div className="font-data-sm text-[10px] text-primary/80 mt-1">{pos.leverage}x Lev</div>
                      </div>
                      <div className="text-right">
                        <div className={`font-data-md ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                          {isProfit ? '+' : ''}{unrealizedPnl.toFixed(2)}
                        </div>
                        <div className="font-data-sm text-xs text-on-surface-variant">{pos.quantity}</div>
                        <div className="font-data-sm text-[10px] text-on-surface mt-1">${currentPrice.toFixed(2)}</div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center text-on-surface-variant py-8 font-body-md text-sm">
                    No active positions.<br/>AI is waiting for signal.
                  </div>
                )}

              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
