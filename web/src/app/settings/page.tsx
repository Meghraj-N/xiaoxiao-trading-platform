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

  useEffect(() => {
    fetch('http://localhost:8000/api/settings')
      .then(res => res.json())
      .then(data => {
        setSettings(data);
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

  if (loading) {
    return (
      <div className="p-gutter min-h-full flex items-center justify-center">
        <div className="text-primary font-mono animate-pulse">Loading settings...</div>
      </div>
    );
  }

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
            <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-title-md text-title-md text-sm border-l-2 border-transparent hover:border-outline-variant text-left transition-colors">
              <span className="material-symbols-outlined text-[20px]">person</span>
              Account Details
            </button>
            <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-title-md text-title-md text-sm border-l-2 border-transparent hover:border-outline-variant text-left transition-colors">
              <span className="material-symbols-outlined text-[20px]">security</span>
              Security
            </button>
            <button className="flex items-center gap-3 px-4 py-3 rounded-lg bg-surface-container-high text-primary font-title-md text-title-md text-sm border-l-2 border-primary text-left transition-colors">
              <span className="material-symbols-outlined text-[20px]" style={{fontVariationSettings: "'FILL' 1"}}>key</span>
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
            
            {/* API Keys Panel */}
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
                    <input 
                      list="ai_models"
                      name="DEFAULT_AI_MODEL"
                      value={settings.DEFAULT_AI_MODEL || 'meta/llama-3.1-405b-instruct'}
                      onChange={handleChange}
                      placeholder="e.g. openai/gpt-4o"
                      className="input-field w-full py-2 font-title-md text-on-surface px-3 bg-surface-container-highest rounded border border-white/5 text-xs"
                    />
                    <datalist id="ai_models">
                      <option value="meta/llama-3.1-405b-instruct">Llama 3.1 405B (NVIDIA)</option>
                      <option value="nvidia/nemotron-4-340b-instruct">Nemotron 340B (NVIDIA)</option>
                      <option value="mistralai/mixtral-8x22b-instruct-v0.1">Mixtral 8x22B (NVIDIA)</option>
                      <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet (OpenRouter)</option>
                      <option value="openai/gpt-4o">GPT-4o (OpenRouter)</option>
                      <option value="deepseek/deepseek-chat">DeepSeek Chat (OpenRouter)</option>
                      <option value="google/gemini-pro-1.5">Gemini Pro 1.5 (OpenRouter)</option>
                    </datalist>
                  </div>

                </div>

              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}

