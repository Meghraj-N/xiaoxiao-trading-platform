"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function TopNavBar() {
  const pathname = usePathname();

  const getLinkClass = (path: string) => {
    const isActive = pathname === path;
    const baseClass = "hover:text-primary hover:shadow-[0_0_15px_rgba(255,180,163,0.3)] transition-all active:scale-95 duration-150";
    
    if (isActive) {
      return `text-primary border-b-2 border-primary pb-1 ${baseClass}`;
    }
    return `text-on-surface-variant/80 ${baseClass}`;
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-surface/60 dark:bg-surface/60 backdrop-blur-xl border-b border-white/10 shadow-[0_0_20px_rgba(255,180,163,0.1)]">
      <div className="flex justify-between items-center h-16 px-gutter max-w-container-max mx-auto">
        {/* Brand */}
        <div className="flex items-center gap-4">
          <Link href="/">
            <span className="font-display-lg text-display-lg tracking-tighter text-primary dark:text-primary-fixed-dim whitespace-nowrap scale-50 origin-left -ml-4 md:ml-0 md:scale-75 lg:scale-100 cursor-pointer hover:drop-shadow-[0_0_8px_rgba(255,180,163,0.5)] transition-all">
              XIAOXIAO AI
            </span>
          </Link>
        </div>
        
        {/* Navigation Links (Web) */}
        <nav className="hidden md:flex items-center gap-6 font-title-md text-title-md">
          <Link href="/dashboard" className={getLinkClass('/dashboard')}>Dashboard</Link>
          <Link href="/trading" className={getLinkClass('/trading')}>Live Trading</Link>
          <Link href="/strategy-builder" className={getLinkClass('/strategy-builder')}>Strategy Builder</Link>
          <Link href="/backtesting" className={getLinkClass('/backtesting')}>Backtesting</Link>
        </nav>
        
        {/* Actions & Search */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center bg-surface-container-high/50 rounded-full px-3 py-1.5 border border-white/5 focus-within:border-primary/50 transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant text-sm mr-2">search</span>
            <input className="bg-transparent border-none outline-none text-sm text-on-surface focus:ring-0 placeholder-on-surface-variant/50 w-32 focus:w-48 transition-all duration-300" placeholder="Search markets..." type="text" />
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded bg-surface-container/50 border border-white/5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="font-data-sm text-data-sm text-on-surface-variant text-xs">SYSTEM ONLINE</span>
          </div>
        </div>
      </div>
    </header>
  );
}
