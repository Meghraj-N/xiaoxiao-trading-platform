import { motion } from 'motion/react'
import StatusBadge from './StatusBadge'
import { formatCurrency } from '../utils/formatters'

const NAV_ITEMS = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { id: 'ai_lab', icon: '🧠', label: 'AI Lab' },
  { id: 'options_analytics', icon: '📈', label: 'Options Analytics' },
  { id: 'strategies', icon: '🎯', label: 'Strategies' },
  { id: 'backtest', icon: '🧪', label: 'Backtest' },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
]

export default function Layout({
  page, onPageChange, isConnected, equity,
  botRunning, onStart, onStop, strategies = [],
  selectedStrategy, setSelectedStrategy, children
}) {
  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1 className="brand-text">🧡 Xiaoxiao</h1>
          <span className="brand-tagline">HONEST AI TRADING BOT</span>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item, i) => (
            <motion.button
              key={item.id}
              className={`nav-item ${page === item.id ? 'active' : ''}`}
              onClick={() => onPageChange(item.id)}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, type: 'spring', stiffness: 300 }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </motion.button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <StatusBadge
            status={isConnected ? 'online' : 'offline'}
            label={isConnected ? 'Connected' : 'Offline'}
          />
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        <header className="top-header">
          <div className="header-left">
            <h2 className="page-title">
              {NAV_ITEMS.find(n => n.id === page)?.label || 'Dashboard'}
            </h2>
            <span className="mode-badge">📝 Paper Trading</span>
          </div>
          <div className="header-right">
            <div className="header-controls" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {page === 'dashboard' && !botRunning && (
                <select
                  value={selectedStrategy}
                  onChange={(e) => setSelectedStrategy(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface-50)',
                    color: 'var(--text-main)',
                    fontSize: '14px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="All">All Strategies</option>
                  {strategies.map((s, idx) => (
                    <option key={idx} value={s.name}>{s.name}</option>
                  ))}
                </select>
              )}
              
              {botRunning ? (
                <motion.button
                  className="btn btn-danger"
                  onClick={onStop}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  ⏹ Stop
                </motion.button>
              ) : (
                <motion.button
                  className="btn btn-primary"
                  onClick={onStart}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  ▶ Start Bot
                </motion.button>
              )}
            </div>
            <div className="equity-display">
              <span className="equity-label">Equity</span>
              <span className="equity-value">{formatCurrency(equity)}</span>
            </div>
          </div>
        </header>

        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  )
}
