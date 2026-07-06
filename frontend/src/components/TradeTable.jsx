import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { formatCurrency, formatPnl, formatDate } from '../utils/formatters'

const PAGE_SIZE = 12

export default function TradeTable({ trades = [] }) {
  const [page, setPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(trades.length / PAGE_SIZE))

  const paginatedTrades = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return trades.slice(start, start + PAGE_SIZE)
  }, [trades, page])

  if (trades.length === 0) {
    return (
      <div className="chart-container">
        <div className="chart-container__header">
          <div>
            <div className="chart-container__title">Trade History</div>
            <div className="chart-container__subtitle">Recent trade executions</div>
          </div>
        </div>
        <div className="empty-state">
          <div className="empty-state__icon">📭</div>
          <div className="empty-state__title">No trades yet</div>
          <div className="empty-state__desc">
            When the bot executes trades, they'll appear here with full details and P&L tracking.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="chart-container">
      <div className="chart-container__header">
        <div>
          <div className="chart-container__title">Trade History</div>
          <div className="chart-container__subtitle">
            {trades.length} total trade{trades.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Symbol</th>
              <th>Side</th>
              <th>Entry</th>
              <th>Exit</th>
              <th>Qty</th>
              <th>Fees</th>
              <th>P&L</th>
              <th>Strategy</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {paginatedTrades.map((trade, i) => (
                <motion.tr
                  key={trade.id || `${trade.timestamp}-${i}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                >
                  <td>{formatDate(trade.timestamp)}</td>
                  <td style={{ fontWeight: 600 }}>{trade.symbol || '—'}</td>
                  <td>
                    <span
                      className={
                        trade.side === 'buy' || trade.side === 'long'
                          ? 'badge badge-success'
                          : 'badge badge-danger'
                      }
                    >
                      {(trade.side || '—').toUpperCase()}
                    </span>
                  </td>
                  <td>{formatCurrency(trade.entry_price)}</td>
                  <td>{trade.exit_price ? formatCurrency(trade.exit_price) : '—'}</td>
                  <td>{trade.quantity != null ? Number(trade.quantity).toFixed(4) : '—'}</td>
                  <td className="text-muted">
                    {trade.fees != null ? formatCurrency(trade.fees) : '—'}
                  </td>
                  <td className={trade.pnl >= 0 ? 'td-positive' : 'td-negative'}>
                    {trade.pnl != null ? formatPnl(trade.pnl) : '—'}
                  </td>
                  <td>
                    <span className="badge badge-primary">
                      {trade.strategy || '—'}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination__btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            ‹
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => {
              if (totalPages <= 7) return true
              if (p === 1 || p === totalPages) return true
              return Math.abs(p - page) <= 1
            })
            .map((p, idx, arr) => {
              const items = []
              if (idx > 0 && p - arr[idx - 1] > 1) {
                items.push(
                  <span key={`dots-${p}`} className="pagination__btn" style={{ cursor: 'default' }}>
                    …
                  </span>
                )
              }
              items.push(
                <button
                  key={p}
                  className={`pagination__btn ${p === page ? 'pagination__btn--active' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              )
              return items
            })}
          <button
            className="pagination__btn"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            ›
          </button>
        </div>
      )}
    </div>
  )
}
