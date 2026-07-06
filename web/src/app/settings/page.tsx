"use client";

import React from 'react';

export default function SettingsPage() {
  return (
    <div className="p-gutter min-h-full">
      <div className="max-w-[1440px] mx-auto space-y-6 pb-20">
        
        {/* Header */}
        <header className="flex flex-col gap-2">
          <h1 className="font-display-lg text-headline-lg-mobile md:text-headline-lg text-on-surface tracking-tight">Settings</h1>
          <p className="text-on-surface-variant font-body-md text-body-md">Manage your account preferences, security settings, and API access.</p>
        </header>
        
        {/* Settings Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Settings Navigation (Local) */}
          <div className="lg:col-span-3 flex flex-col gap-1 sticky top-24">
            <button className="flex items-center gap-3 px-4 py-3 rounded-lg bg-surface-container-high text-primary font-title-md text-title-md text-sm border-l-2 border-primary text-left transition-colors">
              <span className="material-symbols-outlined text-[20px]" style={{fontVariationSettings: "'FILL' 1"}}>person</span>
              Account Details
            </button>
            <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-title-md text-title-md text-sm border-l-2 border-transparent hover:border-outline-variant text-left transition-colors">
              <span className="material-symbols-outlined text-[20px]">security</span>
              Security
            </button>
            <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-title-md text-title-md text-sm border-l-2 border-transparent hover:border-outline-variant text-left transition-colors">
              <span className="material-symbols-outlined text-[20px]">key</span>
              API Keys
            </button>
            <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-title-md text-title-md text-sm border-l-2 border-transparent hover:border-outline-variant text-left transition-colors">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              Notifications
            </button>
            <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-title-md text-title-md text-sm border-l-2 border-transparent hover:border-outline-variant text-left transition-colors">
              <span className="material-symbols-outlined text-[20px]">palette</span>
              Appearance
            </button>
          </div>

          {/* Settings Content Panels */}
          <div className="lg:col-span-9 flex flex-col gap-6">
            
            {/* Account Panel */}
            <section className="glass-panel glass-panel-hover rounded-xl p-6 md:p-8 flex flex-col gap-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50 pointer-events-none"></div>
              <div className="flex justify-between items-end border-b border-outline-variant/30 pb-4 relative z-10">
                <div>
                  <h2 className="font-headline-lg text-title-md text-on-surface">Profile Information</h2>
                  <p className="text-on-surface-variant text-sm mt-1">Update your basic profile details.</p>
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-8 items-start relative z-10 mt-2">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-24 h-24 rounded-full bg-surface-variant overflow-hidden border-2 border-primary/30 relative group cursor-pointer">
                    <img 
                      alt="User Avatar" 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDnUoGyTXPFnH_cg7oK9DryL38UC4YYlLh82FcEOUptBPEApic5ARCve_gq5DSHG2cDybsarku6bc1AE__xpNjJjplDKRGmUWBHSe8TJ45ubq2f2C8wFn5itYViWl3oxA8jO9EK1ftx_bJ-o6aR5d7d377gzYe8V5lMerdqaI6Il2sRlhacTQbZVrHozc5F0kncpZU5dt2EHaVSUGIS9fVWiAAQNvGrvnV_ObHxhC-M7VDTyL20U2Nz0A"
                    />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-white">photo_camera</span>
                    </div>
                  </div>
                  <button className="text-primary hover:text-secondary font-label-caps text-label-caps text-xs transition-colors">Change Avatar</button>
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  <div className="flex flex-col gap-2">
                    <label className="font-label-caps text-label-caps text-on-surface-variant text-[10px]">First Name</label>
                    <input className="input-field w-full py-2 font-title-md text-on-surface px-1 bg-transparent text-sm" type="text" defaultValue="Pro" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-label-caps text-label-caps text-on-surface-variant text-[10px]">Last Name</label>
                    <input className="input-field w-full py-2 font-title-md text-on-surface px-1 bg-transparent text-sm" type="text" defaultValue="Trader" />
                  </div>
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="font-label-caps text-label-caps text-on-surface-variant text-[10px]">Email Address</label>
                    <input className="input-field w-full py-2 font-title-md text-on-surface px-1 bg-transparent text-sm text-on-surface/70" disabled type="email" defaultValue="pro.trader@xiaoxiao.ai" />
                    <p className="text-[10px] text-on-surface-variant mt-1">Email changes require security verification.</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-4 relative z-10">
                <button className="btn-primary px-6 py-2 rounded font-label-caps text-label-caps text-sm tracking-widest">
                  SAVE CHANGES
                </button>
              </div>
            </section>

            {/* API Keys Panel */}
            <section className="glass-panel rounded-xl p-6 md:p-8 flex flex-col gap-6 relative">
              <div className="flex justify-between items-center border-b border-outline-variant/30 pb-4">
                <div>
                  <h2 className="font-headline-lg text-title-md text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[20px]">api</span>
                    API Management
                  </h2>
                  <p className="text-on-surface-variant text-sm mt-1">Manage keys for algorithmic trading and external access.</p>
                </div>
                <button className="btn-primary px-4 py-2 rounded font-label-caps text-label-caps text-xs transition-colors flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  NEW KEY
                </button>
              </div>
              
              <div className="flex flex-col gap-4">
                {/* Key Item 1 */}
                <div className="bg-surface-container/50 border border-white/5 rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex flex-col gap-1 w-full md:w-auto">
                    <div className="flex items-center gap-2">
                      <span className="font-title-md text-on-surface text-sm">OpenRouter Key (AI)</span>
                      <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-[10px] font-label-caps uppercase tracking-wider">Active</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <code className="font-data-sm text-data-sm text-on-surface-variant/70 text-xs">sk-or-v1-*******************</code>
                      <button className="text-on-surface-variant hover:text-primary transition-colors" title="Copy Key">
                        <span className="material-symbols-outlined text-[16px]">content_copy</span>
                      </button>
                    </div>
                    <div className="text-[10px] text-on-surface-variant/50 mt-1">Loaded from backend environment</div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto justify-end">
                    <button className="p-2 rounded hover:bg-surface-variant text-on-surface-variant hover:text-error transition-colors" title="Revoke Key">
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </div>

                {/* Key Item 2 */}
                <div className="bg-surface-container/50 border border-white/5 rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 opacity-75">
                  <div className="flex flex-col gap-1 w-full md:w-auto">
                    <div className="flex items-center gap-2">
                      <span className="font-title-md text-on-surface text-sm">Trading Engine Webhook</span>
                      <span className="bg-surface-variant text-on-surface-variant px-2 py-0.5 rounded-full text-[10px] font-label-caps uppercase tracking-wider">Read/Write</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <code className="font-data-sm text-data-sm text-on-surface-variant/70 text-xs">pk_live_*******************</code>
                      <button className="text-on-surface-variant hover:text-primary transition-colors" title="Copy Key">
                        <span className="material-symbols-outlined text-[16px]">content_copy</span>
                      </button>
                    </div>
                    <div className="text-[10px] text-on-surface-variant/50 mt-1">Last used: 2 mins ago</div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto justify-end">
                    <button className="p-2 rounded hover:bg-surface-variant text-on-surface-variant hover:text-error transition-colors" title="Revoke Key">
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Appearance Panel */}
            <section className="glass-panel rounded-xl p-6 md:p-8 flex flex-col gap-6">
              <div className="border-b border-outline-variant/30 pb-4">
                <h2 className="font-headline-lg text-title-md text-on-surface">Appearance</h2>
                <p className="text-on-surface-variant text-sm mt-1">Customize your platform interface.</p>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex flex-col gap-1">
                  <span className="font-title-md text-on-surface text-sm">Theme Preference</span>
                  <span className="text-on-surface-variant text-xs">Switch between dark and light modes.</span>
                </div>
                <div className="bg-surface-container rounded-full p-1 flex items-center border border-outline-variant/30">
                  <button className="px-3 py-1.5 rounded-full text-on-surface-variant hover:text-on-surface text-xs font-title-md flex items-center gap-2 transition-colors">
                    <span className="material-symbols-outlined text-[16px]">light_mode</span>
                    Light
                  </button>
                  <button className="px-3 py-1.5 rounded-full bg-primary-container/20 text-primary border border-primary/20 text-xs font-title-md flex items-center gap-2 transition-colors shadow-[0_0_10px_rgba(255,180,163,0.1)]">
                    <span className="material-symbols-outlined text-[16px]" style={{fontVariationSettings: "'FILL' 1"}}>dark_mode</span>
                    Dark
                  </button>
                  <button className="px-3 py-1.5 rounded-full text-on-surface-variant hover:text-on-surface text-xs font-title-md flex items-center gap-2 transition-colors">
                    <span className="material-symbols-outlined text-[16px]">desktop_windows</span>
                    System
                  </button>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
