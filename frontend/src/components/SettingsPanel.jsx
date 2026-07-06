import { useState, useEffect } from 'react'
import { useApi } from '../hooks/useApi'

export default function SettingsPanel() {
  const api = useApi()
  
  const [settings, setSettings] = useState({
    MAX_DRAWDOWN_PCT: 15,
    DAILY_LOSS_LIMIT_PCT: 3,
    MAX_OPEN_POSITIONS: 2,
    MAX_RISK_PCT: 2,
    STARTING_CAPITAL: 10,
    DEFAULT_LEVERAGE: 5
  })
  
  const [loading, setLoading] = useState(true)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const data = await api.fetchSettings()
        if (data) {
          setSettings({
            MAX_DRAWDOWN_PCT: (data.MAX_DRAWDOWN_PCT || 0.15) * 100,
            DAILY_LOSS_LIMIT_PCT: (data.DAILY_LOSS_LIMIT_PCT || 0.03) * 100,
            MAX_OPEN_POSITIONS: data.MAX_OPEN_POSITIONS || 2,
            MAX_RISK_PCT: (data.MAX_RISK_PCT || 0.02) * 100,
            STARTING_CAPITAL: data.STARTING_CAPITAL || 10,
            DEFAULT_LEVERAGE: data.DEFAULT_LEVERAGE || 5
          })
        }
      } catch (err) {
        console.error("Failed to load settings:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setSettings(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }))
    setSaveSuccess(false)
  }

  const handleSave = async () => {
    const payload = {
      MAX_DRAWDOWN_PCT: settings.MAX_DRAWDOWN_PCT / 100,
      DAILY_LOSS_LIMIT_PCT: settings.DAILY_LOSS_LIMIT_PCT / 100,
      MAX_OPEN_POSITIONS: Math.floor(settings.MAX_OPEN_POSITIONS),
      MAX_RISK_PCT: settings.MAX_RISK_PCT / 100,
      STARTING_CAPITAL: parseFloat(settings.STARTING_CAPITAL),
      DEFAULT_LEVERAGE: Math.floor(settings.DEFAULT_LEVERAGE)
    }
    try {
      await api.saveSettings(payload)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error("Failed to save settings:", err)
    }
  }

  if (loading) {
    return <div className="loading-state">Loading settings...</div>
  }

  return (
    <div className="settings-grid">
      <div className="card">
        <div className="card-header"><h3>🔗 Exchange</h3></div>
        <div className="card-body">
          <div className="setting-row"><span>API</span><strong>https://testnet-api.delta.exchange</strong></div>
          <div className="setting-row"><span>API Key</span><strong>Set in backend/.env</strong></div>
          <div className="setting-row"><span>Mode</span><strong>Testnet (Paper Trading)</strong></div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3>💰 Trading Parameters</h3></div>
        <div className="card-body">
          <div className="form-row" style={{ flexDirection: 'column', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <label style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Starting Capital (USDT)</label>
            <input 
              type="number" 
              name="STARTING_CAPITAL"
              value={settings.STARTING_CAPITAL} 
              onChange={handleChange} 
              className="form-input" 
              style={{ width: '100%' }}
            />
          </div>
          <div className="form-row" style={{ flexDirection: 'column', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <label style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Default Leverage (x)</label>
            <input 
              type="number" 
              name="DEFAULT_LEVERAGE"
              value={settings.DEFAULT_LEVERAGE} 
              onChange={handleChange} 
              className="form-input" 
              style={{ width: '100%' }}
            />
          </div>
          <div className="setting-row"><span>Taker Fee (verified)</span><strong>0.05% (from delta.exchange)</strong></div>
          <div className="setting-row"><span>Slippage Model</span><strong>0.05% per side (unfavorable)</strong></div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3>🛡️ Risk Management</h3></div>
        <div className="card-body">
          <div className="form-row" style={{ flexDirection: 'column', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <label style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Max Drawdown (pause trading) %</label>
            <input 
              type="number" 
              name="MAX_DRAWDOWN_PCT"
              value={settings.MAX_DRAWDOWN_PCT} 
              onChange={handleChange} 
              className="form-input" 
              style={{ width: '100%' }}
            />
          </div>
          <div className="form-row" style={{ flexDirection: 'column', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <label style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Daily Loss Limit %</label>
            <input 
              type="number" 
              name="DAILY_LOSS_LIMIT_PCT"
              value={settings.DAILY_LOSS_LIMIT_PCT} 
              onChange={handleChange} 
              className="form-input" 
              style={{ width: '100%' }}
            />
          </div>
          <div className="form-row" style={{ flexDirection: 'column', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <label style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Max Open Positions</label>
            <input 
              type="number" 
              name="MAX_OPEN_POSITIONS"
              value={settings.MAX_OPEN_POSITIONS} 
              onChange={handleChange} 
              className="form-input" 
              style={{ width: '100%' }}
            />
          </div>
          <div className="form-row" style={{ flexDirection: 'column', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <label style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Max Risk Per Trade (e.g. 1% Rule) %</label>
            <input 
              type="number" 
              name="MAX_RISK_PCT"
              value={settings.MAX_RISK_PCT} 
              onChange={handleChange} 
              className="form-input" 
              style={{ width: '100%' }}
            />
          </div>
          
          <button 
            className="btn btn-primary" 
            style={{ marginTop: '1rem', width: '100%' }}
            onClick={handleSave}
            disabled={api.loading}
          >
            {api.loading ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3>📐 Kelly Criterion Formula</h3></div>
        <div className="card-body">
          <p className="formula">Full Kelly: f* = W − (1−W) / R</p>
          <p className="formula-note">W = Win Rate, R = Avg Win / Avg Loss</p>
          <br/>
          <p className="formula-note"><strong>Half Kelly (used):</strong> position = 0.5 × f* × balance</p>
          <p className="formula-note">Retains ~75% growth, halves volatility</p>
          <br/>
          <p className="formula-note"><strong>Guardrails:</strong></p>
          <ul className="formula-note" style={{ marginLeft: '1rem' }}>
            <li>Min 30 trades before Kelly activates</li>
            <li>Default 1% risk until enough data</li>
            <li>Hard cap: never risk &gt; 2% per trade</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
