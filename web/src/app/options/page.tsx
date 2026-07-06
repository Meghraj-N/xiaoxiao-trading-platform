export default function OptionChainsPage() {
  return (
    <div className="p-gutter flex-1 flex flex-col gap-6 max-w-[1600px] w-full mx-auto relative z-10 pt-8 md:pt-12">
      {/* Background Ambient Glow */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
      
      {/* Header & Filters */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 relative z-10">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Options Chain <span className="text-primary font-data-lg text-data-lg tracking-widest ml-2 bg-primary/10 px-2 py-1 rounded">NVDA</span></h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Last: <span className="font-data-lg text-data-lg text-secondary">$124.50</span> <span className="font-data-sm text-data-sm text-primary">+2.4%</span></p>
        </div>
        <div className="flex flex-wrap gap-4 items-center bg-surface-container-high/40 p-2 rounded-lg backdrop-blur-md border border-white/5">
          <div className="flex items-center gap-2 px-3 py-1.5 border-r border-white/10">
            <span className="material-symbols-outlined text-on-surface-variant text-sm">calendar_month</span>
            <select className="bg-transparent border-none text-on-surface font-title-md text-title-md focus:ring-0 cursor-pointer appearance-none pr-6 outline-none">
              <option>15 Nov 2024 (7d)</option>
              <option>22 Nov 2024 (14d)</option>
              <option>17 Jan 2025 (63d)</option>
            </select>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 border-r border-white/10">
            <span className="material-symbols-outlined text-on-surface-variant text-sm">tune</span>
            <select className="bg-transparent border-none text-on-surface font-title-md text-title-md focus:ring-0 cursor-pointer appearance-none pr-6 outline-none">
              <option>All IV</option>
              <option>&gt; 50% IV</option>
              <option>&gt; 100% IV</option>
            </select>
          </div>
          <div className="px-3 py-1.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input className="form-checkbox rounded bg-surface border-outline-variant text-primary focus:ring-primary focus:ring-offset-surface" type="checkbox"/>
              <span className="font-label-caps text-label-caps text-on-surface-variant">Hide 0 Vol</span>
            </label>
          </div>
        </div>
      </header>

      {/* Data Table Container */}
      <div className="glass-panel rounded-xl flex-1 flex flex-col overflow-hidden relative min-h-[500px]">
        {/* Inner light stroke */}
        <div className="absolute inset-0 border border-white/10 rounded-xl pointer-events-none mix-blend-overlay"></div>
        <div className="overflow-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="sticky top-0 bg-surface-container-highest/90 backdrop-blur-md z-20 border-b border-white/10 shadow-md">
              <tr>
                <th className="p-3 text-center border-r border-white/5 font-label-caps text-label-caps text-primary tracking-widest bg-primary/5" colSpan={5}>CALLS</th>
                <th className="p-3 text-center font-label-caps text-label-caps text-on-surface w-24">STRIKE</th>
                <th className="p-3 text-center border-l border-white/5 font-label-caps text-label-caps text-secondary tracking-widest bg-secondary/5" colSpan={5}>PUTS</th>
              </tr>
              <tr className="font-label-caps text-label-caps text-on-surface-variant bg-surface-container-low/50">
                {/* Calls */}
                <th className="p-2 border-r border-white/5 border-t border-white/5">Vol</th>
                <th className="p-2 border-r border-white/5 border-t border-white/5">OI</th>
                <th className="p-2 border-r border-white/5 border-t border-white/5">IV %</th>
                <th className="p-2 border-r border-white/5 border-t border-white/5">Bid</th>
                <th className="p-2 border-r border-white/10 border-t border-white/5">Ask</th>
                {/* Strike */}
                <th className="p-2 border-t border-white/5"></th>
                {/* Puts */}
                <th className="p-2 border-l border-white/10 border-r border-white/5 border-t border-white/5">Bid</th>
                <th className="p-2 border-r border-white/5 border-t border-white/5">Ask</th>
                <th className="p-2 border-r border-white/5 border-t border-white/5">IV %</th>
                <th className="p-2 border-r border-white/5 border-t border-white/5">Vol</th>
                <th className="p-2 border-t border-white/5">OI</th>
              </tr>
            </thead>
            <tbody className="font-data-sm text-data-sm text-on-surface divide-y divide-white/5">
              {/* Row 1: ITM Call (Lower Strike) */}
              <tr className="hover:bg-surface-variant/30 transition-colors group cursor-pointer relative">
                <td className="p-2 border-r border-white/5 text-on-surface-variant">1,245</td>
                <td className="p-2 border-r border-white/5 text-on-surface-variant">8,432</td>
                <td className="p-2 border-r border-white/5 text-on-surface-variant">64.2</td>
                <td className="p-2 border-r border-white/5 text-primary">5.40</td>
                <td className="p-2 border-r border-white/10 text-primary group-hover:bg-primary/10">5.50</td>
                
                <td className="p-2 text-center font-bold bg-surface-container-highest/30">120.00</td>
                
                <td className="p-2 border-l border-white/10 border-r border-white/5 text-secondary group-hover:bg-secondary/10">0.85</td>
                <td className="p-2 border-r border-white/5 text-secondary">0.90</td>
                <td className="p-2 border-r border-white/5 text-on-surface-variant">66.1</td>
                <td className="p-2 border-r border-white/5 text-on-surface-variant">8,921</td>
                <td className="p-2 text-on-surface-variant">15,002</td>
              </tr>
              {/* Row 2: ATM */}
              <tr className="hover:bg-surface-variant/30 transition-colors group cursor-pointer bg-primary/5">
                <td className="p-2 border-r border-white/5 font-bold">12,450</td>
                <td className="p-2 border-r border-white/5 font-bold">45,120</td>
                <td className="p-2 border-r border-white/5 text-on-surface-variant">60.5</td>
                <td className="p-2 border-r border-white/5 text-primary">2.10</td>
                <td className="p-2 border-r border-white/10 text-primary font-bold group-hover:bg-primary/20">2.15</td>
                
                <td className="p-2 text-center font-bold bg-surface-container-highest/50 text-primary flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">star</span>
                  125.00
                </td>
                
                <td className="p-2 border-l border-white/10 border-r border-white/5 text-secondary font-bold group-hover:bg-secondary/20">2.80</td>
                <td className="p-2 border-r border-white/5 text-secondary">2.85</td>
                <td className="p-2 border-r border-white/5 text-on-surface-variant">62.3</td>
                <td className="p-2 border-r border-white/5 font-bold">18,530</td>
                <td className="p-2 font-bold">62,100</td>
              </tr>
              {/* Row 3: OTM Call */}
              <tr className="hover:bg-surface-variant/30 transition-colors group cursor-pointer relative">
                <td className="p-2 border-r border-white/5 text-on-surface-variant">4,521</td>
                <td className="p-2 border-r border-white/5 text-on-surface-variant">22,105</td>
                <td className="p-2 border-r border-white/5 text-on-surface-variant">58.9</td>
                <td className="p-2 border-r border-white/5 text-primary">0.95</td>
                <td className="p-2 border-r border-white/10 text-primary group-hover:bg-primary/10">1.00</td>
                
                <td className="p-2 text-center font-bold bg-surface-container-highest/30">130.00</td>
                
                <td className="p-2 border-l border-white/10 border-r border-white/5 text-secondary group-hover:bg-secondary/10">6.40</td>
                <td className="p-2 border-r border-white/5 text-secondary">6.55</td>
                <td className="p-2 border-r border-white/5 text-on-surface-variant">59.8</td>
                <td className="p-2 border-r border-white/5 text-on-surface-variant">1,205</td>
                <td className="p-2 text-on-surface-variant">8,450</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
