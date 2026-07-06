"use client";

import React, { useState } from 'react';
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
import { Line } from 'react-chartjs-2';

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

export default function BacktestingPage() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runBacktest = () => {
    setRunning(true);
    setResults(null);
    setTimeout(() => {
      setRunning(false);
      setResults({
        totalReturn: '+18.4%',
        maxDrawdown: '-6.2%',
        winRate: '68%',
        profitFactor: '2.1',
        sharpeRatio: '1.85',
        totalTrades: 142,
        chartData: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [
            {
              fill: true,
              label: 'Strategy Return',
              data: [100, 102, 105, 104, 112, 118.4],
              borderColor: '#ffb4a3',
              backgroundColor: 'rgba(255, 180, 163, 0.2)',
              tension: 0.4,
            },
            {
              fill: true,
              label: 'Buy & Hold SPY',
              data: [100, 101, 103, 102, 104, 106.5],
              borderColor: '#a68b84',
              backgroundColor: 'transparent',
              borderDash: [5, 5],
              tension: 0.4,
            }
          ]
        }
      });
    }, 2000);
  };

  return (
    <div className="p-gutter min-h-full">
      <div className="max-w-[1440px] mx-auto space-y-6 pb-20">
        
        {/* Header Section */}
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">Backtesting Engine</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">Simulate AI strategies against historical data before deploying capital.</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Controls */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="glass-panel rounded-xl p-6 flex flex-col gap-4 shadow-[0_0_15px_rgba(255,180,163,0.05)]">
              <h3 className="font-title-md text-title-md text-on-surface">Configuration</h3>
              
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-on-surface-variant text-[10px]">STRATEGY</label>
                <select className="bg-surface-container border border-white/10 rounded px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none">
                  <option>Volatility Scalper</option>
                  <option>Trend Follower</option>
                  <option>HFT Arbitrage</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-on-surface-variant text-[10px]">TICKER / SYMBOL</label>
                <input type="text" defaultValue="SPY, QQQ" className="bg-surface-container border border-white/10 rounded px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="font-label-caps text-on-surface-variant text-[10px]">START DATE</label>
                  <input type="date" defaultValue="2023-01-01" className="bg-surface-container border border-white/10 rounded px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-caps text-on-surface-variant text-[10px]">END DATE</label>
                  <input type="date" defaultValue="2023-12-31" className="bg-surface-container border border-white/10 rounded px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-on-surface-variant text-[10px]">INITIAL CAPITAL</label>
                <input type="number" defaultValue="100000" className="bg-surface-container border border-white/10 rounded px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none" />
              </div>

              <button 
                onClick={runBacktest}
                disabled={running}
                className="btn-primary mt-2 py-3 rounded font-label-caps text-[12px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,180,163,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {running ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
                    Simulating...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                    Run Backtest
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Area */}
          <div className="lg:col-span-8">
            {results ? (
              <div className="flex flex-col gap-6">
                
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="glass-panel rounded-xl p-4 flex flex-col gap-1 border border-primary/20 bg-primary/5">
                    <span className="font-label-caps text-[10px] text-on-surface-variant">TOTAL RETURN</span>
                    <span className="font-data-lg text-primary text-2xl">{results.totalReturn}</span>
                  </div>
                  <div className="glass-panel rounded-xl p-4 flex flex-col gap-1">
                    <span className="font-label-caps text-[10px] text-on-surface-variant">MAX DRAWDOWN</span>
                    <span className="font-data-lg text-error text-2xl">{results.maxDrawdown}</span>
                  </div>
                  <div className="glass-panel rounded-xl p-4 flex flex-col gap-1">
                    <span className="font-label-caps text-[10px] text-on-surface-variant">WIN RATE</span>
                    <span className="font-data-lg text-on-surface text-2xl">{results.winRate}</span>
                  </div>
                  <div className="glass-panel rounded-xl p-4 flex flex-col gap-1">
                    <span className="font-label-caps text-[10px] text-on-surface-variant">PROFIT FACTOR</span>
                    <span className="font-data-lg text-secondary text-xl">{results.profitFactor}</span>
                  </div>
                  <div className="glass-panel rounded-xl p-4 flex flex-col gap-1">
                    <span className="font-label-caps text-[10px] text-on-surface-variant">SHARPE RATIO</span>
                    <span className="font-data-lg text-on-surface text-xl">{results.sharpeRatio}</span>
                  </div>
                  <div className="glass-panel rounded-xl p-4 flex flex-col gap-1">
                    <span className="font-label-caps text-[10px] text-on-surface-variant">TOTAL TRADES</span>
                    <span className="font-data-lg text-outline text-xl">{results.totalTrades}</span>
                  </div>
                </div>

                {/* Chart */}
                <div className="glass-panel rounded-xl p-6 relative">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-headline-lg text-[20px] text-on-surface">Equity Curve</h3>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary"></div><span className="font-data-sm text-[12px] text-on-surface-variant">Strategy</span></div>
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-outline"></div><span className="font-data-sm text-[12px] text-on-surface-variant">SPY</span></div>
                    </div>
                  </div>
                  <div className="h-64 w-full relative">
                    <Line 
                      data={results.chartData} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                          x: { grid: { display: false }, ticks: { color: 'rgba(231, 225, 222, 0.6)' } },
                          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(231, 225, 222, 0.6)' } }
                        }
                      }} 
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-panel rounded-xl h-full min-h-[400px] flex flex-col items-center justify-center opacity-60">
                <span className="material-symbols-outlined text-[64px] text-on-surface-variant mb-4">analytics</span>
                <h3 className="font-title-md text-on-surface text-lg">Awaiting Configuration</h3>
                <p className="font-body-md text-on-surface-variant text-sm mt-2 max-w-sm text-center">
                  Configure your strategy parameters and run the simulation to view historical performance metrics.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
