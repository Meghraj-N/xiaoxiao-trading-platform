import { motion } from 'motion/react'
import { formatCurrency, formatPercent, formatPnl } from '../utils/formatters'

const STATS = [
  { key: 'equity', label: 'CURRENT EQUITY', format: formatCurrency },
  { key: 'pnl', label: 'TOTAL P&L', format: formatPnl, colored: true },
  { key: 'winRate', label: 'WIN RATE', format: v => formatPercent(v) },
  { key: 'trades', label: 'TOTAL TRADES', format: v => v.toString() },
  { key: 'drawdown', label: 'MAX DRAWDOWN', format: v => formatPercent(v) },
  { key: 'sharpe', label: 'SHARPE RATIO', format: v => v ? v.toFixed(2) : '—' },
]

export default function StatsPanel({ equity = 3, pnl = 0, trades = [] }) {
  const wins = trades.filter(t => (t.pnl || t.pnl_net || 0) > 0).length
  const winRate = trades.length > 0 ? wins / trades.length : 0

  const values = {
    equity,
    pnl,
    winRate,
    trades: trades.length,
    drawdown: 0,
    sharpe: null,
  }

  return (
    <div className="stats-grid">
      {STATS.map((stat, i) => {
        const val = values[stat.key]
        const isPos = stat.colored ? val >= 0 : true

        return (
          <motion.div
            key={stat.key}
            className="stat-card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, type: 'spring', stiffness: 300 }}
            whileHover={{ y: -3, boxShadow: '0 12px 40px rgba(255,140,66,0.15)' }}
          >
            <div className="stat-label">{stat.label}</div>
            <motion.div
              className={`stat-value ${stat.colored ? (isPos ? 'positive' : 'negative') : ''}`}
              key={val}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              {stat.format(val)}
            </motion.div>
          </motion.div>
        )
      })}
    </div>
  )
}
