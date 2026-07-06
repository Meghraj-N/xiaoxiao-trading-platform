import { motion } from 'motion/react'

const statusMap = {
  Active:  'badge-success',
  Paused:  'badge-warning',
  Failed:  'badge-danger',
  Stopped: 'badge-danger',
}

export default function StrategyCard({ strategy = {} }) {
  const {
    name = 'Untitled Strategy',
    status = 'Stopped',
    win_rate,
    profit_factor,
    trades_count,
    last_signal,
    backtest_passed,
  } = strategy

  return (
    <motion.div
      className="strategy-card"
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
    >
      <div className="strategy-card__header">
        <div className="strategy-card__name">{name}</div>
        <div className="flex items-center gap-sm">
          <span className={`badge ${statusMap[status] || 'badge-primary'}`}>
            {status}
          </span>
          {backtest_passed != null && (
            <span
              className={`badge ${
                backtest_passed ? 'badge-success' : 'badge-danger'
              }`}
            >
              {backtest_passed ? '✓ Passed' : '✗ Failed'}
            </span>
          )}
        </div>
      </div>

      <div className="strategy-card__metrics">
        <div className="strategy-card__metric">
          <div
            className="strategy-card__metric-value"
            style={{
              color:
                win_rate != null
                  ? win_rate >= 50
                    ? 'var(--success)'
                    : 'var(--danger)'
                  : 'var(--text-primary)',
            }}
          >
            {win_rate != null ? `${Number(win_rate).toFixed(1)}%` : '—'}
          </div>
          <div className="strategy-card__metric-label">Win Rate</div>
        </div>

        <div className="strategy-card__metric">
          <div
            className="strategy-card__metric-value"
            style={{
              color:
                profit_factor != null
                  ? profit_factor >= 1
                    ? 'var(--success)'
                    : 'var(--danger)'
                  : 'var(--text-primary)',
            }}
          >
            {profit_factor != null ? Number(profit_factor).toFixed(2) : '—'}
          </div>
          <div className="strategy-card__metric-label">Profit Factor</div>
        </div>

        <div className="strategy-card__metric">
          <div className="strategy-card__metric-value">
            {trades_count != null ? trades_count : '—'}
          </div>
          <div className="strategy-card__metric-label">Trades</div>
        </div>
      </div>

      {last_signal && (
        <div className="strategy-card__footer">
          <span>Last signal: <strong>{last_signal.type || '—'}</strong></span>
          <span className="text-muted text-xs">{last_signal.time || ''}</span>
        </div>
      )}
    </motion.div>
  )
}
