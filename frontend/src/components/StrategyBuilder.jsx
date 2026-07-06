import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import BacktestCard from './BacktestCard'

export default function StrategyBuilder() {
  const [strategies, setStrategies] = useState([])
  const [customStrategies, setCustomStrategies] = useState([])
  const [backtestResults, setBacktestResults] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newStrategy, setNewStrategy] = useState({ name: '', description: '', code: '' })
  const [backtesting, setBacktesting] = useState(null)
  const [activeTab, setActiveTab] = useState('all')

  // Built-in strategies
  const builtinStrategies = [
    { name: 'EMA Cross', type: 'built-in', description: 'EMA 9/21 crossover. Stop: 1.5× ATR. TP: 2:1 R:R.', active: true },
    { name: 'RSI Revert', type: 'built-in', description: 'RSI(14) mean reversion with volume confirmation.', active: true },
    { name: 'Boll Break', type: 'built-in', description: 'Bollinger Band breakout with expanding bandwidth.', active: true },
  ]

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load custom strategies
      const csRes = await fetch('/api/custom-strategies')
      const csData = await csRes.json()
      setCustomStrategies(csData.strategies || [])

      // Load backtest results
      const btRes = await fetch('/api/backtest-results')
      const btData = await btRes.json()
      setBacktestResults(btData.results || [])

      // Load active strategies
      const sRes = await fetch('/api/strategies')
      const sData = await sRes.json()
      setStrategies(sData.strategies || [])
    } catch (e) { /* backend not running */ }
  }

  const runBacktest = async (name) => {
    setBacktesting(name)
    try {
      const safeName = name.toLowerCase().replace(/\s+/g, '_')
      const res = await fetch(`/api/backtest/${safeName}?symbol=BTC/USDT`, { method: 'POST' })
      const data = await res.json()
      if (!data.error) {
        setBacktestResults(prev => [data, ...prev])
      }
    } catch (e) {
      console.error('Backtest failed:', e)
    }
    setBacktesting(null)
  }

  const saveNewStrategy = async () => {
    if (!newStrategy.name || !newStrategy.code) return

    try {
      const res = await fetch('/api/custom-strategies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStrategy),
      })
      const data = await res.json()
      if (!data.error) {
        setShowAddForm(false)
        setNewStrategy({ name: '', description: '', code: '' })
        loadData()
      }
    } catch (e) {
      console.error('Save failed:', e)
    }
  }

  const deleteStrategy = async (name) => {
    if (!confirm(`Delete "${name}"?`)) return
    try {
      await fetch(`/api/custom-strategies/${encodeURIComponent(name)}`, { method: 'DELETE' })
      loadData()
    } catch (e) {
      console.error('Delete failed:', e)
    }
  }

  const allStrategies = [
    ...builtinStrategies,
    ...customStrategies.map(cs => ({
      name: cs.name,
      type: 'custom',
      description: cs.description || 'Custom AI-generated strategy',
      active: cs.is_active,
      ai_model: cs.ai_model_used,
      backtest_passed: cs.backtest_passed,
    }))
  ]

  const filteredStrategies = activeTab === 'all'
    ? allStrategies
    : activeTab === 'builtin'
      ? allStrategies.filter(s => s.type === 'built-in')
      : allStrategies.filter(s => s.type === 'custom')

  return (
    <div className="strategy-builder">
      {/* Header */}
      <div className="builder-header">
        <div className="tab-bar">
          {[
            { id: 'all', label: 'All Strategies', count: allStrategies.length },
            { id: 'builtin', label: 'Built-in', count: builtinStrategies.length },
            { id: 'custom', label: 'Custom', count: customStrategies.length },
            { id: 'results', label: 'Backtest Results', count: backtestResults.length },
          ].map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label} <span className="tab-count">{tab.count}</span>
            </button>
          ))}
        </div>
        <motion.button
          className="btn btn-primary"
          onClick={() => setShowAddForm(!showAddForm)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          ➕ Add Strategy
        </motion.button>
      </div>

      {/* Add Strategy Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            className="card add-strategy-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="card-header"><h3>✨ New Strategy</h3></div>
            <div className="card-body">
              <div className="form-row">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Strategy Name"
                  value={newStrategy.name}
                  onChange={e => setNewStrategy(prev => ({ ...prev, name: e.target.value }))}
                />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Description"
                  value={newStrategy.description}
                  onChange={e => setNewStrategy(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <textarea
                className="code-editor"
                placeholder="Paste strategy Python code here... (must inherit from BaseStrategy)"
                value={newStrategy.code}
                onChange={e => setNewStrategy(prev => ({ ...prev, code: e.target.value }))}
                rows={12}
              />
              <div className="form-actions">
                <button className="btn btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
                <motion.button
                  className="btn btn-primary"
                  onClick={saveNewStrategy}
                  disabled={!newStrategy.name || !newStrategy.code}
                  whileHover={{ scale: 1.03 }}
                >
                  💾 Save & Load
                </motion.button>
              </div>
              <p className="form-hint">
                💡 Tip: Use the <strong>AI Lab</strong> to generate strategy code automatically!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Strategy List or Backtest Results */}
      {activeTab === 'results' ? (
        <div className="backtest-results-grid">
          {backtestResults.length === 0 ? (
            <div className="card"><div className="card-body">
              <p className="empty-state-text">No backtest results yet. Run a backtest on any strategy to see results here.</p>
            </div></div>
          ) : (
            backtestResults.map((r, i) => (
              <BacktestCard key={r.id || i} result={r} />
            ))
          )}
        </div>
      ) : (
        <div className="strategy-list">
          {filteredStrategies.map((s, i) => (
            <motion.div
              key={s.name}
              className="strategy-item card"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -3 }}
            >
              <div className="strategy-item-header">
                <div className="strategy-info">
                  <div className="strategy-name-row">
                    <h3>{s.name}</h3>
                    <span className={`type-badge ${s.type}`}>
                      {s.type === 'built-in' ? '📦 Built-in' : '🤖 Custom'}
                    </span>
                    {s.backtest_passed ? (
                      <span className="gate-badge pass">✅ Passed</span>
                    ) : s.type === 'custom' ? (
                      <span className="gate-badge pending">⏳ Not tested</span>
                    ) : null}
                  </div>
                  <p className="strategy-desc">{s.description}</p>
                  {s.ai_model && <span className="ai-model-tag">🧠 {s.ai_model}</span>}
                </div>
                <div className="strategy-actions">
                  <motion.button
                    className="btn btn-secondary"
                    onClick={() => runBacktest(s.name)}
                    disabled={backtesting === s.name}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {backtesting === s.name ? '⏳ Running...' : '📈 Backtest'}
                  </motion.button>
                  {s.type === 'custom' && (
                    <motion.button
                      className="btn btn-danger"
                      onClick={() => deleteStrategy(s.name)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      🗑️
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Show latest backtest for this strategy */}
              {backtestResults.filter(r => r.strategy_name === s.name || r.strategy === s.name).slice(0, 1).map((r, j) => (
                <div key={j} className="strategy-backtest-preview">
                  <BacktestCard result={r} compact />
                </div>
              ))}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
