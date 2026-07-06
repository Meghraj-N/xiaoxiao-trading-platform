"use client";

import React, { useEffect, useState } from 'react';
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

export default function PortfolioPage() {
  const [positions, setPositions] = useState<any[]>([]);
  const [totalValue, setTotalValue] = useState(0);

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/positions');
        const data = await res.json();
        setPositions(data.positions);
        
        let total = 100000; // base mock cash
        data.positions.forEach((p: any) => {
          total += p.size * p.entry_price;
        });
        setTotalValue(total);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPositions();
    const interval = setInterval(fetchPositions, 5000);
    return () => clearInterval(interval);
  }, []);

  const chartData = {
    labels: ['9:30', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'],
    datasets: [
      {
        fill: true,
        label: 'Portfolio Value',
        data: [100000, 102000, 101500, 105000, 104200, 108000, 107500, totalValue > 100000 ? totalValue : 110000],
        borderColor: '#ffb4a3',
        backgroundColor: 'rgba(255, 180, 163, 0.2)',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        grid: { display: false, color: 'rgba(255,255,255,0.05)' },
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
      <div className="max-w-[1440px] mx-auto space-y-6 pb-20">
        
        {/* Header Section */}
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">Portfolio Analytics</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">Real-time performance and risk assessment across all active positions.</p>
          </div>
          <div className="flex gap-2 bg-surface-container-low p-1 rounded-lg border border-white/5">
            <button className="px-4 py-1.5 rounded-md font-label-caps text-label-caps bg-surface-variant text-on-surface shadow">1D</button>
            <button className="px-4 py-1.5 rounded-md font-label-caps text-label-caps text-on-surface-variant hover:text-on-surface">1W</button>
            <button className="px-4 py-1.5 rounded-md font-label-caps text-label-caps text-on-surface-variant hover:text-on-surface">1M</button>
            <button className="px-4 py-1.5 rounded-md font-label-caps text-label-caps text-on-surface-variant hover:text-on-surface">YTD</button>
          </div>
        </header>

        {/* Top Row Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="glass-panel rounded-xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-primary/20 transition-all"></div>
            <div className="font-title-md text-title-md text-on-surface-variant text-[14px] mb-2 flex justify-between items-center">
              Total Value
              <span className="material-symbols-outlined text-primary text-[18px]">account_balance_wallet</span>
            </div>
            <div className="font-data-lg text-[28px] leading-tight text-on-surface mb-2 tracking-wide">
              ${totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </div>
            <div className="font-data-sm text-data-sm text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)] flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">trending_up</span>
              +2.4% (+$2,845.20)
            </div>
          </div>
          
          <div className="glass-panel rounded-xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-secondary/20 transition-all"></div>
            <div className="font-title-md text-title-md text-on-surface-variant text-[14px] mb-2 flex justify-between items-center">
              Daily P&L
              <span className="material-symbols-outlined text-secondary text-[18px]">payments</span>
            </div>
            <div className="font-data-lg text-[28px] leading-tight text-on-surface mb-2 tracking-wide">+$1,210.80</div>
            <div className="font-data-sm text-data-sm text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)] flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
              +1.2% Today
            </div>
          </div>

          <div className="glass-panel rounded-xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-error/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-error/20 transition-all"></div>
            <div className="font-title-md text-title-md text-on-surface-variant text-[14px] mb-2 flex justify-between items-center">
              Max Drawdown
              <span className="material-symbols-outlined text-error text-[18px]">warning</span>
            </div>
            <div className="font-data-lg text-[28px] leading-tight text-on-surface mb-2 tracking-wide">-4.2%</div>
            <div className="font-data-sm text-data-sm text-on-surface-variant opacity-70 flex items-center gap-1">
              Last 30 Days
            </div>
          </div>

          <div className="glass-panel rounded-xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary-container/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-primary-container/20 transition-all"></div>
            <div className="font-title-md text-title-md text-on-surface-variant text-[14px] mb-2 flex justify-between items-center">
              Sharpe Ratio
              <span className="material-symbols-outlined text-primary-container text-[18px]">multiline_chart</span>
            </div>
            <div className="font-data-lg text-[28px] leading-tight text-on-surface mb-2 tracking-wide">2.14</div>
            <div className="font-data-sm text-data-sm text-on-surface-variant opacity-70 flex items-center gap-1">
              Risk Adjusted
            </div>
          </div>
        </div>

        {/* Main Dashboard Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <div className="lg:col-span-2 glass-panel rounded-xl p-6 relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline-lg text-[24px] text-on-surface">Performance Chart</h3>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary shadow-[0_0_8px_#ffb4a3]"></span>
                <span className="font-data-sm text-data-sm text-on-surface-variant">Portfolio</span>
              </div>
            </div>
            <div className="h-64 w-full relative">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* Right Side Stack */}
          <div className="flex flex-col gap-4">
            {/* Sector Exposure (Donut Faux) */}
            <div className="glass-panel rounded-xl p-6 flex-1">
              <h3 className="font-headline-lg text-[20px] text-on-surface mb-6">Sector Exposure</h3>
              <div className="relative w-40 h-40 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-[16px] border-surface-variant"></div>
                <div className="absolute inset-0 rounded-full border-[16px] border-primary" style={{clipPath: "polygon(50% 50%, 100% 0, 100% 100%, 0 100%, 0 50%)", transform: "rotate(45deg)"}}></div>
                <div className="absolute inset-0 rounded-full border-[16px] border-secondary" style={{clipPath: "polygon(50% 50%, 100% 0, 100% 100%)", transform: "rotate(225deg)"}}></div>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="font-data-lg text-data-lg text-on-surface">Tech</span>
                  <span className="font-data-sm text-data-sm text-primary">45%</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-data-sm font-data-sm">
                  <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-primary"></span><span className="text-on-surface">Technology</span></div>
                  <span className="text-on-surface-variant">45%</span>
                </div>
                <div className="flex justify-between items-center text-data-sm font-data-sm">
                  <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-secondary"></span><span className="text-on-surface">Financials</span></div>
                  <span className="text-on-surface-variant">30%</span>
                </div>
                <div className="flex justify-between items-center text-data-sm font-data-sm">
                  <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-surface-variant"></span><span className="text-on-surface">Healthcare</span></div>
                  <span className="text-on-surface-variant">25%</span>
                </div>
              </div>
            </div>

            {/* Risk Metrics */}
            <div className="glass-panel rounded-xl p-6">
              <h3 className="font-headline-lg text-[20px] text-on-surface mb-4">Risk Profile</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between font-data-sm text-data-sm mb-1">
                    <span className="text-on-surface-variant">Beta (1Y)</span>
                    <span className="text-on-surface">1.15</span>
                  </div>
                  <div className="w-full bg-surface-variant h-1.5 rounded-full overflow-hidden">
                    <div className="bg-primary w-[65%] h-full rounded-full shadow-[0_0_8px_#ffb4a3]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between font-data-sm text-data-sm mb-1">
                    <span className="text-on-surface-variant">Volatility</span>
                    <span className="text-on-surface">18.4%</span>
                  </div>
                  <div className="w-full bg-surface-variant h-1.5 rounded-full overflow-hidden">
                    <div className="bg-secondary w-[40%] h-full rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Positions Table */}
        <div className="glass-panel rounded-xl p-6 overflow-x-auto">
          <div className="flex justify-between items-center mb-6 min-w-[600px]">
            <h3 className="font-headline-lg text-[20px] text-on-surface">Live Positions</h3>
            <button className="flex items-center gap-2 font-label-caps text-label-caps text-primary hover:text-primary-fixed-dim transition-colors">
              <span className="material-symbols-outlined text-[18px]">filter_list</span>
              FILTER
            </button>
          </div>
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-white/10 font-label-caps text-label-caps text-on-surface-variant opacity-80">
                <th className="pb-3 px-2 font-normal">Asset</th>
                <th className="pb-3 px-2 font-normal">Type</th>
                <th className="pb-3 px-2 font-normal text-right">Entry Price</th>
                <th className="pb-3 px-2 font-normal text-right">Quantity</th>
                <th className="pb-3 px-2 font-normal text-right">Total</th>
              </tr>
            </thead>
            <tbody className="font-data-sm text-data-sm">
              {positions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-on-surface-variant">
                    No active positions.
                  </td>
                </tr>
              ) : (
                positions.map((pos, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-surface-variant/20 transition-colors">
                    <td className="py-3 px-2 flex items-center gap-2">
                      <div className={`w-8 h-8 rounded ${pos.side === 'BUY' ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary'} flex items-center justify-center font-bold text-[12px]`}>
                        {pos.symbol.substring(0, 4)}
                      </div>
                      <span className="text-on-surface">{pos.symbol}</span>
                    </td>
                    <td className={`py-3 px-2 ${pos.side === 'BUY' ? 'text-primary' : 'text-secondary'}`}>
                      {pos.side}
                    </td>
                    <td className="py-3 px-2 text-right text-on-surface-variant">
                      ${pos.entry_price.toFixed(2)}
                    </td>
                    <td className="py-3 px-2 text-right text-on-surface-variant">
                      {pos.size}
                    </td>
                    <td className="py-3 px-2 text-right text-on-surface font-bold">
                      ${(pos.entry_price * pos.size).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
