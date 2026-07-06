"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function SideNavBar() {
  const pathname = usePathname();

  const getLinkClass = (path: string) => {
    const isActive = pathname === path;
    const baseClass = "flex items-center gap-3 px-3 py-2.5 rounded-lg active:translate-x-1 font-label-caps text-label-caps";
    
    if (isActive) {
      return `${baseClass} bg-primary-container/20 text-primary border-r-4 border-primary`;
    }
    return `${baseClass} text-on-surface-variant hover:bg-surface-variant/30 hover:bg-primary/10 transition-colors`;
  };

  return (
    <aside className="hidden md:flex flex-col py-unit gap-2 fixed left-0 top-16 h-[calc(100vh-64px)] w-64 bg-surface-container-low/60 dark:bg-surface-container-low/60 backdrop-blur-2xl border-r border-white/5 z-40">
      {/* Header/Profile */}
      <div className="px-6 py-6 mb-4 border-b border-white/5 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full overflow-hidden mb-3 border-2 border-primary/30 p-1">
          <img 
            alt="User Profile" 
            className="w-full h-full object-cover rounded-full" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDnUoGyTXPFnH_cg7oK9DryL38UC4YYlLh82FcEOUptBPEApic5ARCve_gq5DSHG2cDybsarku6bc1AE__xpNjJjplDKRGmUWBHSe8TJ45ubq2f2C8wFn5itYViWl3oxA8jO9EK1ftx_bJ-o6aR5d7d377gzYe8V5lMerdqaI6Il2sRlhacTQbZVrHozc5F0kncpZU5dt2EHaVSUGIS9fVWiAAQNvGrvnV_ObHxhC-M7VDTyL20U2Nz0A" 
          />
        </div>
        <h3 className="font-title-md text-title-md text-on-surface">Pro Trader</h3>
        <span className="font-label-caps text-label-caps text-primary/80 mt-1">Elite Tier</span>
        <button className="mt-4 w-full border border-primary/30 text-primary font-label-caps text-label-caps py-2 rounded hover:bg-primary/10 transition-colors active:scale-95 shadow-[0_0_10px_rgba(255,180,163,0.1)]">OPEN TRADE</button>
      </div>
      
      {/* Main Nav */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto chat-scroll">
        <Link href="/dashboard" className={getLinkClass('/dashboard')}>
          <span className="material-symbols-outlined">dashboard</span>
          Dashboard
        </Link>
        <Link href="/portfolio" className={getLinkClass('/portfolio')}>
          <span className="material-symbols-outlined">account_balance_wallet</span>
          Live Portfolio
        </Link>
        <Link href="/trading" className={getLinkClass('/trading')}>
          <span className="material-symbols-outlined">candlestick_chart</span>
          Trading
        </Link>
        <Link href="/ai-assistant" className={getLinkClass('/ai-assistant')}>
          <span className="material-symbols-outlined">smart_toy</span>
          AI Assistant
        </Link>
        <Link href="/strategy-builder" className={getLinkClass('/strategy-builder')}>
          <span className="material-symbols-outlined">architecture</span>
          Strategy Builder
        </Link>
        <Link href="/backtesting" className={getLinkClass('/backtesting')}>
          <span className="material-symbols-outlined">history</span>
          Backtesting
        </Link>
        <Link href="/markets" className={getLinkClass('/markets')}>
          <span className="material-symbols-outlined">monitoring</span>
          Markets
        </Link>
        <Link href="/risk" className={getLinkClass('/risk')}>
          <span className="material-symbols-outlined">shield_locked</span>
          Risk Management
        </Link>
      </nav>
      
      {/* Footer Nav */}
      <div className="px-3 mt-auto mb-4 border-t border-white/5 pt-4 space-y-1">
        <Link href="/settings" className={getLinkClass('/settings')}>
          <span className="material-symbols-outlined">settings</span>
          Settings
        </Link>
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-error-container/30 hover:text-error transition-colors active:translate-x-1 font-label-caps text-label-caps">
          <span className="material-symbols-outlined">logout</span>
          Logout
        </button>
      </div>
    </aside>
  );
}
