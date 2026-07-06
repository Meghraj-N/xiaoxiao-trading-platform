"use client";

import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function MarketsPage() {
  const [data, setData] = useState({
    spot: 516.24,
    maxPain: 515.00,
    ratio: 0.84,
    oi: '4,281,902',
    strikes: [] as number[],
    calls: [] as number[],
    puts: [] as number[],
  });

  useEffect(() => {
    // Generate some mock options data
    const strikes = Array.from({length: 20}, (_, i) => 500 + i);
    const calls = strikes.map(s => Math.floor(Math.random() * 50000 + (s === 515 ? 50000 : 0)));
    const puts = strikes.map(s => Math.floor(Math.random() * 50000 + (s === 515 ? 50000 : 0)));

    setData(prev => ({ ...prev, strikes, calls, puts }));
  }, []);

  const chartData = {
    labels: data.strikes.map(s => `$${s}`),
    datasets: [
      {
        label: 'Calls',
        data: data.calls,
        backgroundColor: 'rgba(255, 183, 128, 0.8)', // secondary
      },
      {
        label: 'Puts',
        data: data.puts,
        backgroundColor: 'rgba(166, 139, 132, 0.8)', // outline
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: 'rgba(231, 225, 222, 0.6)' }
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: 'rgba(231, 225, 222, 0.6)' }
      },
    },
  };

  return (
    <div className="p-gutter min-h-full">
      <div className="max-w-[1200px] mx-auto space-y-6 pb-20">
        
        {/* Page Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface">SPY Max Pain Theory</h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">Analyzing optimal expiration pinning logic.</p>
          </div>
          <div className="flex gap-2">
            <select className="glass-panel text-on-surface font-data-sm text-data-sm rounded px-3 py-1.5 outline-none focus:border-primary">
              <option value="spy">SPY</option>
              <option value="qqq">QQQ</option>
              <option value="aapl">AAPL</option>
            </select>
            <select className="glass-panel text-on-surface font-data-sm text-data-sm rounded px-3 py-1.5 outline-none focus:border-primary">
              <option value="1">17 May 2024</option>
              <option value="2">24 May 2024</option>
            </select>
          </div>
        </div>

        {/* Bento Grid / Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-panel rounded-xl p-6 relative overflow-hidden group shadow-[0_0_20px_rgba(255,180,163,0.15)]">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="font-label-caps text-label-caps text-on-surface-variant mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">target</span>
              Current Max Pain Price
            </div>
            <div className="font-data-lg text-data-lg text-primary text-3xl font-bold">${data.maxPain.toFixed(2)}</div>
            <div className="font-data-sm text-data-sm text-on-surface-variant mt-1 flex items-center gap-1">
              Current Spot: <span className="text-on-surface">${data.spot.toFixed(2)}</span>
            </div>
          </div>
          <div className="glass-panel rounded-xl p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="font-label-caps text-label-caps text-on-surface-variant mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">pie_chart</span>
              Call/Put Ratio (OI)
            </div>
            <div className="font-data-lg text-data-lg text-secondary text-3xl font-bold">{data.ratio}</div>
            <div className="font-data-sm text-data-sm text-on-surface-variant mt-1">
              Total OI: <span className="text-on-surface">{data.oi}</span>
            </div>
          </div>
          <div className="glass-panel rounded-xl p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-surface-variant/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="font-label-caps text-label-caps text-on-surface-variant mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">calendar_month</span>
              Days to Expiration
            </div>
            <div className="font-data-lg text-data-lg text-on-surface text-3xl font-bold">2 DTE</div>
            <div className="font-data-sm text-data-sm text-on-surface-variant mt-1">
              Friday, May 17th
            </div>
          </div>
        </div>

        {/* Main Chart Area */}
        <div className="glass-panel rounded-xl p-1 shadow-lg relative shadow-[0_0_20px_rgba(255,180,163,0.15)]">
          <div className="bg-surface-container-lowest/80 rounded-lg p-6 h-[400px] flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-center mb-6 z-10">
              <h2 className="font-title-md text-title-md text-on-surface">Open Interest Profile</h2>
              <div className="flex gap-4">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-secondary/80"></div><span className="font-data-sm text-data-sm text-on-surface-variant">Calls</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-outline/80"></div><span className="font-data-sm text-data-sm text-on-surface-variant">Puts</span></div>
              </div>
            </div>
            <div className="flex-1 w-full relative z-10">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Option Chain Snippet Table */}
        <div className="glass-panel rounded-xl p-6 overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-title-md text-title-md text-on-surface">Key Strikes Open Interest</h3>
            <button className="text-primary font-label-caps text-label-caps hover:underline">VIEW FULL CHAIN</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-white/10 font-label-caps text-label-caps text-on-surface-variant opacity-80">
                  <th className="pb-3 px-2 font-normal text-right">Call Volume</th>
                  <th className="pb-3 px-2 font-normal text-right">Call OI</th>
                  <th className="pb-3 px-2 font-normal text-center w-24">Strike</th>
                  <th className="pb-3 px-2 font-normal text-left">Put OI</th>
                  <th className="pb-3 px-2 font-normal text-left">Put Volume</th>
                </tr>
              </thead>
              <tbody className="font-data-sm text-data-sm text-on-surface">
                {data.strikes.slice(10, 15).map((strike, idx) => (
                  <tr key={idx} className={`border-b border-white/5 hover:bg-surface-variant/20 transition-colors ${strike === 515 ? 'bg-primary/5 border-primary/20' : ''}`}>
                    <td className="py-2 px-2 text-right">{Math.floor(data.calls[idx + 10] / 3).toLocaleString()}</td>
                    <td className="py-2 px-2 text-right font-bold text-secondary">{data.calls[idx + 10].toLocaleString()}</td>
                    <td className="py-2 px-2 text-center relative">
                      <div className="bg-surface-variant/50 rounded py-1 px-2 border border-white/10 inline-block min-w-[60px]">
                        ${strike.toFixed(2)}
                      </div>
                    </td>
                    <td className="py-2 px-2 text-left font-bold text-outline">{data.puts[idx + 10].toLocaleString()}</td>
                    <td className="py-2 px-2 text-left">{Math.floor(data.puts[idx + 10] / 3).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
