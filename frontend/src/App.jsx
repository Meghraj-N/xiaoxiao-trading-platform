import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Layout from './components/Layout'
import StatsPanel from './components/StatsPanel'
import PriceChart from './components/PriceChart'
import EquityCurve from './components/EquityCurve'
import TradeTable from './components/TradeTable'
import StrategyCard from './components/StrategyCard'
import RiskGauge from './components/RiskGauge'
import StatusBadge from './components/StatusBadge'
import AILab from './components/AILab'
import StrategyBuilder from './components/StrategyBuilder'
import OptionsDashboard from './components/OptionsDashboard'
import SettingsPanel from './components/SettingsPanel'
import EquityChart from './components/charts/EquityChart'
import { useWebSocket } from './hooks/useWebSocket'
import { useApi } from './hooks/useApi'
import { formatCurrency, formatPnl } from './utils/formatters'
import './index.css'

const PAGES = {
  dashboard: 'Dashboard',
  strategies: 'Strategies',
  backtest: 'Backtest',
  settings: 'Settings'
}

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [botRunning, setBotRunning] = useState(false)
  const [selectedStrategy, setSelectedStrategy] = useState('All')

  const { prices, trades: wsTrades, equity, status, isConnected } = useWebSocket()
  const api = useApi()

  const [trades, setTrades] = useState([])
  const [strategies, setStrategies] = useState([])
  const [risk, setRisk] = useState({})
  const [equityCurve, setEquityCurve] = useState([])
  const [currentEquity, setCurrentEquity] = useState(3.00)

  // Sync WS updates
  useEffect(() => {
    if (equity) setCurrentEquity(equity)
  }, [equity])

  useEffect(() => {
    if (status?.running !== undefined) setBotRunning(status.running)
  }, [status])

  useEffect(() => {
    if (wsTrades?.length) {
      setTrades(prev => [...wsTrades, ...prev].slice(0, 100))
    }
  }, [wsTrades])

  // Initial data fetch
  useEffect(() => {
    async function load() {
      try {
        const s = await api.fetchStatus()
        if (s) {
          setCurrentEquity(s.equity || 3)
          setBotRunning(s.running || false)
          setRisk(s.risk || {})
        }
        const t = await api.fetchTrades()
        if (t?.trades) setTrades(t.trades)
        const e = await api.fetchEquity()
        if (e?.equity_curve) setEquityCurve(e.equity_curve)
        const st = await api.fetchStrategies()
        if (st?.strategies) setStrategies(st.strategies)
      } catch (e) { /* backend not running yet */ }
    }
    load()
  }, [])

  const handleStart = async () => {
    try {
      await api.startBot({ strategy: selectedStrategy })
      setBotRunning(true)
    } catch (e) { console.error('Start failed:', e) }
  }

  const handleStop = async () => {
    try {
      await api.stopBot()
      setBotRunning(false)
    } catch (e) { console.error('Stop failed:', e) }
  }

  const pnl = currentEquity - 3.0

  return (
    <Layout
      page={page}
      onPageChange={setPage}
      isConnected={isConnected}
      equity={currentEquity}
      botRunning={botRunning}
      onStart={handleStart}
      onStop={handleStop}
      strategies={strategies}
      selectedStrategy={selectedStrategy}
      setSelectedStrategy={setSelectedStrategy}
    >
      <AnimatePresence mode="wait">
        {page === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {/* Disclaimer */}
            <div className="disclaimer">
              <span>⚠️</span>
              <p>
                <strong>Honest Disclaimer:</strong> This bot trades real live prices with simulated $3 capital.
                Every fee (0.05% taker) and slippage (0.05%) is real. No fills, prices, or profits are ever faked.
              </p>
            </div>

            {/* Stats */}
            <StatsPanel equity={currentEquity} pnl={pnl} trades={trades} />

            {/* Charts Row */}
            <div className="grid-2">
              <div className="card">
                <div className="card-header">
                  <h3>📈 Live Price</h3>
                </div>
                <div className="card-body">
                  <PriceChart prices={prices} />
                </div>
              </div>
              <div className="card">
                <div className="card-header">
                  <h3>💰 Equity Curve</h3>
                </div>
                <div className="card-body">
                  <EquityCurve data={equityCurve} currentEquity={currentEquity} />
                </div>
              </div>
            </div>

            {/* Risk + Trades */}
            <div className="dashboard-grid">
              <div className="card" style={{ gridColumn: 'span 2' }}>
                <div className="card-header">
                  <h3>💰 Account Equity</h3>
                  <h2 className={pnl >= 0 ? 'text-success' : 'text-danger'} style={{ margin: 0 }}>
                    ${currentEquity.toFixed(2)} <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Start: ${starting_capital.toFixed(2)} | PnL: ${pnl.toFixed(2)}</span>
                  </h2>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                  <EquityChart data={[{ time: Math.floor(Date.now() / 1000), value: currentEquity }]} />
                </div>
              </div>
              <div className="card">
                <div className="card-header"><h3>🛡️ Risk Status</h3></div>
                <div className="card-body">
                  <RiskGauge risk={risk} />
                </div>
              </div>
              <div className="card">
                <div className="card-header"><h3>📋 Open Positions</h3></div>
                <div className="card-body">
                  <p className="empty-state-text">
                    {botRunning ? 'Watching for signals...' : 'Start the bot to begin trading.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Trade History */}
            <div className="card">
              <div className="card-header"><h3>📜 Trade History</h3></div>
              <div className="card-body">
                <TradeTable trades={trades} />
              </div>
            </div>
          </motion.div>
        )}

        {page === 'strategies' && (
          <motion.div
            key="strategies"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
          >
            <StrategyBuilder />
          </motion.div>
        )}

        {page === 'ai_lab' && (
          <motion.div
            key="ai_lab"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
          >
            <AILab />
          </motion.div>
        )}

        {page === 'options_analytics' && (
          <motion.div
            key="options_analytics"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            style={{ width: '100%', height: '100%' }}
          >
            <OptionsDashboard />
          </motion.div>
        )}

        {page === 'backtest' && (
          <motion.div
            key="backtest"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
          >
            <div className="card">
              <div className="card-header">
                <h3>🧪 Walk-Forward Backtester</h3>
              </div>
              <div className="card-body">
                <p className="empty-state-text">
                  Select a strategy and run a backtest from the API.
                  Uses 6 months of historical data. 70/30 walk-forward split. Real fees & slippage.
                </p>
                <p className="gate-info">
                  <strong>Pass Gate:</strong> PF &gt; 1.2 | Sharpe &gt; 0.5 | Max DD &lt; 20% | 30+ trades
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {page === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
          >
            <SettingsPanel />
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  )
}
