"use client";

import React, { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    DELTA_API_KEY: "",
    DELTA_API_SECRET: "",
    NVIDIA_API_KEY: "",
    OPENROUTER_API_KEY: "",
    AI_PROVIDER: "nvidia",
    DEFAULT_AI_MODEL: "meta/llama-3.1-405b-instruct"
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<'account' | 'security' | 'api' | 'notifications' | 'appearance'>('api');
  const [isCustomModel, setIsCustomModel] = useState(false);

  const PRESET_MODELS = [
    "meta/llama-3.1-405b-instruct",
    "nvidia/nemotron-4-340b-instruct",
    "mistralai/mixtral-8x22b-instruct-v0.1",
    "anthropic/claude-3.5-sonnet",
    "openai/gpt-4o",
    "deepseek/deepseek-chat",
    "google/gemini-pro-1.5"
  ];

  useEffect(() => {
    fetch('http://localhost:8000/api/settings')
      .then(res => res.json())
      .then(data => {
        setSettings(data);
        if (data.DEFAULT_AI_MODEL && !PRESET_MODELS.includes(data.DEFAULT_AI_MODEL)) {
          setIsCustomModel(true);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch('http://localhost:8000/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.status === "success") {
        setMessage("Settings saved successfully! Engine updated.");
      } else {
        setMessage("Failed to save settings.");
      }
    } catch (err) {
      setMessage("Error connecting to server.");
    }
    setSaving(false);
    setTimeout(() => setMessage(""), 5000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setSettings({
      ...settings,
      [e.target.name]: e.target.value
    });
  };

  const handleModelSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "custom") {
      setIsCustomModel(true);
      setSettings({ ...settings, DEFAULT_AI_MODEL: "" });
    } else {
      setIsCustomModel(false);
      setSettings({ ...settings, DEFAULT_AI_MODEL: val });
    }
  };

  if (loading) {
    return (
      <div className="p-gutter min-h-full flex items-center justify-center">
        <div className="text-primary font-mono animate-pulse">Loading settings...</div>
      </div>
    );
  }

  const renderTabContent = () => {
    if (activeTab === 'account') {
      return (
        <section className="glass-panel rounded-xl p-6 md:p-8 flex flex-col gap-6 relative">
          <div className="flex justify-between items-center border-b border-outline-variant/30 pb-4">
            <div>
              <h2 className="font-headline-lg text-title-md text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">person</span>
                Account Details
              </h2>
              <p className="text-on-surface-variant text-sm mt-1">Manage your personal profile and subscription.</p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40 mb-4">construction</span>
            <h3 className="text-on-surface font-title-md text-lg">Coming Soon</h3>
            <p className="text-on-surface-variant text-sm max-w-md mt-2">
              Account management features are being integrated with Supabase Auth in the upcoming release.
            </p>
          </div>
        </section>
      );
    }
    
    if (activeTab === 'security') {
      return (
        <section className="glass-panel rounded-xl p-6 md:p-8 flex flex-col gap-6 relative">
          <div className="flex justify-between items-center border-b border-outline-variant/30 pb-4">
            <div>
              <h2 className="font-headline-lg text-title-md text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">security</span>
                Security Settings
              </h2>
              <p className="text-on-surface-variant text-sm mt-1">Configure two-factor authentication and passwords.</p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40 mb-4">lock</span>
            <h3 className="text-on-surface font-title-md text-lg">Secure by Design</h3>
            <p className="text-on-surface-variant text-sm max-w-md mt-2">
              Advanced security settings (2FA, Password management, Active Sessions) will be available once the cloud environment is finalized.
            </p>
          </div>
        </section>
      );
    }

    if (activeTab === 'notifications') {
      return (
        <section className="glass-panel rounded-xl p-6 md:p-8 flex flex-col gap-6 relative">
          <div className="flex justify-between items-center border-b border-outline-variant/30 pb-4">
            <div>
              <h2 className="font-headline-lg text-title-md text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">notifications</span>
                Notification Preferences
              </h2>
              <p className="text-on-surface-variant text-sm mt-1">Control how and when you receive trading alerts.</p>
            </div>
          </div>
          <div className="flex flex-col gap-4 max-w-xl mt-4">
            <div className="flex items-center justify-between p-4 bg-surface-container-highest rounded border border-white/5">
              <div>
                <h4 className="text-on-surface font-title-md text-sm">Trade Executions</h4>
                <p className="text-on-surface-variant text-xs mt-1">Receive alerts when the bot buys or sells.</p>
              </div>
              <div className="w-10 h-5 bg-primary/20 border border-primary/50 rounded-full flex items-center px-0.5 cursor-pointer">
                <div className="w-4 h-4 bg-primary rounded-full translate-x-5"></div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-surface-container-highest rounded border border-white/5">
              <div>
                <h4 className="text-on-surface font-title-md text-sm">Risk Limits</h4>
                <p className="text-on-surface-variant text-xs mt-1">Alerts when daily stop-loss limits are hit.</p>
              </div>
              <div className="w-10 h-5 bg-primary/20 border border-primary/50 rounded-full flex items-center px-0.5 cursor-pointer">
                <div className="w-4 h-4 bg-primary rounded-full translate-x-5"></div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-surface-container-highest rounded border border-white/5">
              <div>
                <h4 className="text-on-surface font-title-md text-sm">Marketing Emails</h4>
                <p className="text-on-surface-variant text-xs mt-1">Receive platform updates and news.</p>
              </div>
              <div className="w-10 h-5 bg-surface-container rounded-full flex items-center px-0.5 cursor-pointer border border-white/10">
                <div className="w-4 h-4 bg-on-surface-variant rounded-full"></div>
              </div>
            </div>
          </div>
        </section>
      );
    }

    if (activeTab === 'appearance') {
      return (
        <section className="glass-panel rounded-xl p-6 md:p-8 flex flex-col gap-6 relative">
          <div className="flex justify-between items-center border-b border-outline-variant/30 pb-4">
            <div>
              <h2 className="font-headline-lg text-title-md text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">palette</span>
                Appearance
              </h2>
              <p className="text-on-surface-variant text-sm mt-1">Customize the visual theme of the trading hub.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 max-w-2xl">
            <div className="border-2 border-primary rounded-lg overflow-hidden cursor-pointer">
              <div className="h-20 bg-background flex items-center justify-center border-b border-white/10">
                <span className="text-on-surface font-mono text-sm">Dark (Pro)</span>
              </div>
              <div className="p-3 bg-surface text-center">
                <span className="text-primary text-xs font-label-caps">ACTIVE</span>
              </div>
            </div>
            <div className="border border-white/10 rounded-lg overflow-hidden cursor-not-allowed opacity-50">
              <div className="h-20 bg-[#F5F5F5] flex items-center justify-center border-b border-black/10">
                <span className="text-[#1A1A1A] font-mono text-sm">Light</span>
              </div>
              <div className="p-3 bg-white text-center">
                <span className="text-[#666666] text-xs font-label-caps">UNAVAILABLE</span>
              </div>
            </div>
          </div>
        </section>
      );
    }

    // Default API Keys Tab
    return (
      <section className="glass-panel rounded-xl p-6 md:p-8 flex flex-col gap-6 relative">
        <div className="flex justify-between items-center border-b border-outline-variant/30 pb-4">
          <div>
            <h2 className="font-headline-lg text-title-md text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">api</span>
              API Management
            </h2>
            <p className="text-on-surface-variant text-sm mt-1">Manage keys for algorithmic trading and AI access.</p>
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary px-4 py-2 rounded font-label-caps text-label-caps text-xs transition-colors flex items-center gap-2">
            {saving ? (
              <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
            ) : (
              <span className="material-symbols-outlined text-[16px]">save</span>
            )}
            {saving ? "SAVING..." : "SAVE KEYS"}
          </button>
        </div>

        {message && (
          <div className={`p-3 rounded text-sm ${message.includes('success') ? 'bg-primary/20 text-primary' : 'bg-error/20 text-error'}`}>
            {message}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Exchange Keys */}
          <div className="flex flex-col gap-4">
            <h3 className="font-title-md text-on-surface text-sm border-b border-white/10 pb-2">Delta Exchange API</h3>
            <div className="flex flex-col gap-2">
              <label className="font-label-caps text-label-caps text-on-surface-variant text-[10px]">API Key</label>
              <input 
                name="DELTA_API_KEY"
                value={settings.DELTA_API_KEY || ''}
                onChange={handleChange}
                placeholder="Paste Delta API Key"
                className="input-field w-full py-2 font-mono text-on-surface px-3 bg-surface-container-highest rounded border border-white/5 text-xs" 
                type="password" 
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-label-caps text-label-caps text-on-surface-variant text-[10px]">API Secret</label>
              <input 
                name="DELTA_API_SECRET"
                value={settings.DELTA_API_SECRET || ''}
                onChange={handleChange}
                placeholder="Paste Delta API Secret"
                className="input-field w-full py-2 font-mono text-on-surface px-3 bg-surface-container-highest rounded border border-white/5 text-xs" 
                type="password" 
              />
            </div>
          </div>

          {/* AI Keys */}
          <div className="flex flex-col gap-4">
            <h3 className="font-title-md text-on-surface text-sm border-b border-white/10 pb-2">AI Providers</h3>
            
            <div className="flex flex-col gap-2">
              <label className="font-label-caps text-label-caps text-on-surface-variant text-[10px]">Active AI Provider</label>
              <select 
                name="AI_PROVIDER"
                value={settings.AI_PROVIDER || 'nvidia'}
                onChange={handleChange}
                className="input-field w-full py-2 font-title-md text-on-surface px-3 bg-surface-container-highest rounded border border-white/5 text-xs"
              >
                <option value="nvidia">NVIDIA NIM</option>
                <option value="openrouter">OpenRouter</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-label-caps text-label-caps text-on-surface-variant text-[10px]">NVIDIA NIM API Key</label>
              <input 
                name="NVIDIA_API_KEY"
                value={settings.NVIDIA_API_KEY || ''}
                onChange={handleChange}
                placeholder="nvapi-..."
                className="input-field w-full py-2 font-mono text-on-surface px-3 bg-surface-container-highest rounded border border-white/5 text-xs" 
                type="password" 
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="font-label-caps text-label-caps text-on-surface-variant text-[10px]">OpenRouter API Key</label>
              <input 
                name="OPENROUTER_API_KEY"
                value={settings.OPENROUTER_API_KEY || ''}
                onChange={handleChange}
                placeholder="sk-or-v1-..."
                className="input-field w-full py-2 font-mono text-on-surface px-3 bg-surface-container-highest rounded border border-white/5 text-xs" 
                type="password" 
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-label-caps text-label-caps text-on-surface-variant text-[10px]">Default Model</label>
              <select 
                value={isCustomModel ? "custom" : (settings.DEFAULT_AI_MODEL || 'meta/llama-3.1-405b-instruct')}
                onChange={handleModelSelect}
                className="input-field w-full py-2 font-title-md text-on-surface px-3 bg-surface-container-highest rounded border border-white/5 text-xs mb-1"
              >
                <option value="meta/llama-3.1-405b-instruct">Llama 3.1 405B (NVIDIA)</option>
                <option value="nvidia/nemotron-4-340b-instruct">Nemotron 340B (NVIDIA)</option>
                <option value="mistralai/mixtral-8x22b-instruct-v0.1">Mixtral 8x22B (NVIDIA)</option>
                <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet (OpenRouter)</option>
                <option value="openai/gpt-4o">GPT-4o (OpenRouter)</option>
                <option value="deepseek/deepseek-chat">DeepSeek Chat (OpenRouter)</option>
                <option value="google/gemini-pro-1.5">Gemini Pro 1.5 (OpenRouter)</option>
                <option value="custom">+ Add Custom Model...</option>
              </select>
              
              {isCustomModel && (
                <div className="mt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="font-label-caps text-label-caps text-on-surface-variant text-[10px]">Custom Model ID</label>
                  <input 
                    name="DEFAULT_AI_MODEL"
                    value={settings.DEFAULT_AI_MODEL || ''}
                    onChange={handleChange}
                    placeholder="Enter any Model ID (e.g. meta-llama/llama-3-70b)"
                    className="input-field w-full py-2 font-mono text-on-surface px-3 bg-surface-container-highest rounded border border-primary/50 focus:border-primary text-xs" 
                    autoFocus
                  />
                  <p className="text-xs text-on-surface-variant mt-1">Make sure you have access to this model via your active API Provider.</p>
                </div>
              )}
            </div>

          </div>

        </div>
      </section>
    );
  };

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
            <button 
              onClick={() => setActiveTab('account')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-title-md text-title-md text-sm border-l-2 text-left transition-colors ${
                activeTab === 'account' ? 'bg-surface-container-high text-primary border-primary' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface border-transparent hover:border-outline-variant'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]" style={activeTab === 'account' ? {fontVariationSettings: "'FILL' 1"} : {}}>person</span>
              Account Details
            </button>
            <button 
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-title-md text-title-md text-sm border-l-2 text-left transition-colors ${
                activeTab === 'security' ? 'bg-surface-container-high text-primary border-primary' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface border-transparent hover:border-outline-variant'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]" style={activeTab === 'security' ? {fontVariationSettings: "'FILL' 1"} : {}}>security</span>
              Security
            </button>
            <button 
              onClick={() => setActiveTab('api')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-title-md text-title-md text-sm border-l-2 text-left transition-colors ${
                activeTab === 'api' ? 'bg-surface-container-high text-primary border-primary' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface border-transparent hover:border-outline-variant'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]" style={activeTab === 'api' ? {fontVariationSettings: "'FILL' 1"} : {}}>key</span>
              API Keys
            </button>
            <button 
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-title-md text-title-md text-sm border-l-2 text-left transition-colors ${
                activeTab === 'notifications' ? 'bg-surface-container-high text-primary border-primary' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface border-transparent hover:border-outline-variant'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]" style={activeTab === 'notifications' ? {fontVariationSettings: "'FILL' 1"} : {}}>notifications</span>
              Notifications
            </button>
            <button 
              onClick={() => setActiveTab('appearance')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-title-md text-title-md text-sm border-l-2 text-left transition-colors ${
                activeTab === 'appearance' ? 'bg-surface-container-high text-primary border-primary' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface border-transparent hover:border-outline-variant'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]" style={activeTab === 'appearance' ? {fontVariationSettings: "'FILL' 1"} : {}}>palette</span>
              Appearance
            </button>
          </div>

          {/* Settings Content Panels */}
          <div className="lg:col-span-9 flex flex-col gap-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
