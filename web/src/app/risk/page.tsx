"use client";

import React from 'react';

export default function RiskPage() {
  return (
    <div className="p-gutter min-h-full">
      <div className="max-w-[1440px] mx-auto space-y-6 pb-20">
        
        <header className="mb-10">
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-on-surface">Risk Management</h1>
          <p className="text-on-surface-variant mt-2 font-body-md text-sm">Manage your account security, authentication methods, and global risk parameters for AI agents.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* Left Column: Core Security & Risk limits */}
          <div className="lg:col-span-8 flex flex-col gap-gutter">
            
            {/* Global Risk Parameters */}
            <section className="glass-panel rounded-xl p-6 md:p-8">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: "'FILL' 1"}}>shield_lock</span>
                    <h2 className="font-title-md text-secondary text-xl">Global Engine Constraints</h2>
                  </div>
                  <p className="text-on-surface-variant text-sm max-w-xl">
                    These constraints act as a global kill-switch and limits for all active trading bots and AI strategies.
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in mt-1">
                    <input defaultChecked className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer opacity-0 z-10" id="tfa-toggle" type="checkbox" />
                    <label className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-500 cursor-pointer" htmlFor="tfa-toggle"></label>
                  </div>
                  <span className="text-primary mt-2 font-label-caps text-[10px] tracking-wider uppercase drop-shadow-[0_0_8px_rgba(255,180,163,0.6)]">Active</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-surface-container-low p-4 rounded-lg border border-white/5 flex flex-col gap-2 group hover:border-primary/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <h3 className="font-title-md text-sm text-on-surface">Max Daily Drawdown</h3>
                    <span className="font-data-sm text-error font-bold">-5.0%</span>
                  </div>
                  <input type="range" className="w-full accent-primary" min="1" max="20" defaultValue="5" />
                </div>
                <div className="bg-surface-container-low p-4 rounded-lg border border-white/5 flex flex-col gap-2 group hover:border-primary/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <h3 className="font-title-md text-sm text-on-surface">Max Position Size</h3>
                    <span className="font-data-sm text-secondary font-bold">15%</span>
                  </div>
                  <input type="range" className="w-full accent-secondary" min="1" max="50" defaultValue="15" />
                </div>
                <div className="bg-surface-container-low p-4 rounded-lg border border-white/5 flex flex-col gap-2 group hover:border-primary/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <h3 className="font-title-md text-sm text-on-surface">Max Leverage</h3>
                    <span className="font-data-sm text-outline font-bold">2.0x</span>
                  </div>
                  <input type="range" className="w-full accent-outline" min="1" max="10" defaultValue="2" />
                </div>
                <div className="bg-surface-container-low p-4 rounded-lg border border-white/5 flex flex-col gap-2 group hover:border-primary/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <h3 className="font-title-md text-sm text-on-surface">Kill Switch</h3>
                    <button className="bg-red-500/20 text-red-500 border border-red-500/30 px-3 py-1 rounded text-xs font-bold hover:bg-red-500 hover:text-white transition-colors">LIQUIDATE ALL</button>
                  </div>
                  <p className="text-[10px] text-on-surface-variant mt-1">Closes all positions and halts trading immediately.</p>
                </div>
              </div>
            </section>
            
            {/* Password Section */}
            <section className="glass-panel rounded-xl p-6 md:p-8">
              <div className="flex items-start justify-between border-b border-white/10 pb-4 mb-6">
                <div>
                  <h2 className="font-title-md text-on-surface text-lg">Change Password</h2>
                  <p className="text-on-surface-variant text-sm mt-1">Update your password regularly to keep your account secure.</p>
                </div>
              </div>
              <form className="max-w-md flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-label-caps text-on-surface-variant text-[10px]">CURRENT PASSWORD</label>
                  <input className="bg-surface-container border border-white/10 rounded px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none transition-colors" type="password" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-label-caps text-on-surface-variant text-[10px]">NEW PASSWORD</label>
                  <input className="bg-surface-container border border-white/10 rounded px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none transition-colors" type="password" />
                </div>
                <div className="flex flex-col gap-1 mb-2">
                  <label className="font-label-caps text-on-surface-variant text-[10px]">CONFIRM NEW PASSWORD</label>
                  <input className="bg-surface-container border border-white/10 rounded px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none transition-colors" type="password" />
                </div>
                <button className="btn-primary w-max px-6 py-2 rounded font-label-caps text-xs shadow-lg shadow-primary/20" type="button">UPDATE PASSWORD</button>
              </form>
            </section>
          </div>

          {/* Right Column: Sessions */}
          <div className="lg:col-span-4 flex flex-col gap-gutter">
            <section className="glass-panel rounded-xl p-6">
              <h2 className="font-title-md text-on-surface text-lg mb-4">Active Sessions</h2>
              <div className="flex flex-col gap-4">
                <div className="bg-surface-container-low border border-primary/20 rounded-lg p-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-title-md text-sm text-on-surface flex items-center gap-2">
                        Mac OS • Chrome
                        <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-label-caps">CURRENT</span>
                      </h3>
                      <p className="font-data-sm text-xs text-on-surface-variant mt-1">IP: 192.168.1.1</p>
                      <p className="text-[10px] text-on-surface-variant/50 mt-1">San Francisco, CA</p>
                    </div>
                  </div>
                </div>

                <div className="bg-surface-container-lowest border border-white/5 rounded-lg p-4 opacity-75">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-title-md text-sm text-on-surface">iOS • Orion App</h3>
                      <p className="font-data-sm text-xs text-on-surface-variant mt-1">IP: 172.56.21.9</p>
                      <p className="text-[10px] text-on-surface-variant/50 mt-1">Los Angeles, CA • Last active: 2h ago</p>
                    </div>
                    <button className="text-on-surface-variant hover:text-error transition-colors" title="Revoke Session">
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                </div>
              </div>
              <button className="w-full mt-6 py-2 border border-white/10 rounded font-label-caps text-xs text-on-surface-variant hover:bg-white/5 hover:text-on-surface transition-colors">
                LOG OUT ALL OTHER SESSIONS
              </button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
