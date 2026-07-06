import { motion } from 'motion/react'

export default function BacktestCard({ result, compact = false }) {
  if (!result) return null

  const r = result
  const passed = r.passed || false
  const winRate = (r.win_rate || 0) * 100
  const pf = r.profit_factor || 0
  const sharpe = r.sharpe_ratio || r.sharpe || 0
  const maxDD = (r.max_drawdown || 0) * 100
  const totalReturn = (r.total_return || 0) * 100

  const metrics = [
    { label: 'Trades', value: r.total_trades || 0 },
    { label: 'Win Rate', value: `${winRate.toFixed(1)}%`, good: winRate > 50 },
    { label: 'Profit Factor', value: pf.toFixed(2), good: pf > 1.2 },
    { label: 'Sharpe', value: sharpe.toFixed(2), good: sharpe > 0.5 },
    { label: 'Max DD', value: `${maxDD.toFixed(1)}%`, good: maxDD < 20 },
    { label: 'Return', value: `${totalReturn >= 0 ? '+' : ''}${totalReturn.toFixed(1)}%`, good: totalReturn > 0 },
  ]

  if (compact) {
    return (
      <div className={`backtest-compact ${passed ? 'pass' : 'fail'}`}>
        <div className="bc-header">
          <span className={`gate-icon ${passed ? 'pass' : 'fail'}`}>
            {passed ? '✅' : '❌'}
          </span>
          <span className="bc-label">{passed ? 'PASSED' : 'FAILED'}</span>
        </div>
        <div className="bc-metrics">
          {metrics.map(m => (
            <span key={m.label} className={`bc-metric ${m.good ? 'good' : 'bad'}`}>
              {m.label}: <strong>{m.value}</strong>
            </span>
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className={`card backtest-card ${passed ? 'pass' : 'fail'}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -3 }}
    >
      <div className="card-header">
        <div className="backtest-title">
          <span className={`gate-icon-lg ${passed ? 'pass' : 'fail'}`}>
            {passed ? '✅' : '❌'}
          </span>
          <div>
            <h3>{r.strategy_name || r.strategy || 'Unknown'}</h3>
            <span className="backtest-meta">
              {r.symbol || 'BTC/USDT'} · {r.timeframe || '1h'} ·
              {r.run_at ? new Date(r.run_at * 1000).toLocaleDateString() : ''}
            </span>
          </div>
        </div>
        <span className={`gate-verdict ${passed ? 'pass' : 'fail'}`}>
          {passed ? 'GATE PASSED' : 'GATE FAILED'}
        </span>
      </div>
      <div className="card-body">
        <div className="backtest-metrics-grid">
          {metrics.map(m => (
            <div key={m.label} className={`backtest-metric ${m.good ? 'good' : 'bad'}`}>
              <span className="metric-label">{m.label}</span>
              <span className="metric-value">{m.value}</span>
            </div>
          ))}
        </div>

        {/* Gate Details */}
        {r.gate_details && (
          <div className="gate-details">
            <h4>Gate Checks</h4>
            <div className="gate-checks">
              {Object.entries(r.gate_details).map(([k, v]) => (
                <span key={k} className={`gate-check ${v ? 'pass' : 'fail'}`}>
                  {v ? '✅' : '❌'} {k.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        )}

        {r.note && (
          <div className="backtest-note">
            <strong>Honest Note:</strong> {r.note}
          </div>
        )}
      </div>
    </motion.div>
  )
}
