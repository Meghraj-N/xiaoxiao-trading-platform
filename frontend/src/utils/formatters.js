/**
 * Format a number as USD currency: $1,234.56
 */
export function formatCurrency(value) {
  if (value == null || isNaN(value)) return '$0.00'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Format a number as percentage: 12.34%
 */
export function formatPercent(value) {
  if (value == null || isNaN(value)) return '0.00%'
  return `${Number(value).toFixed(2)}%`
}

/**
 * Format an ISO timestamp or unix ms to readable date/time
 */
export function formatDate(timestamp) {
  if (!timestamp) return '—'
  const date = typeof timestamp === 'number'
    ? new Date(timestamp)
    : new Date(timestamp)
  if (isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date)
}

/**
 * Format P&L with sign and color hint: +$1.23 or -$0.45
 */
export function formatPnl(value) {
  if (value == null || isNaN(value)) return '$0.00'
  const abs = Math.abs(value)
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(abs)
  return value >= 0 ? `+${formatted}` : `-${formatted}`
}

/**
 * Shorten a trading pair symbol: BTC/USDT -> BTC
 */
export function shortenSymbol(symbol) {
  if (!symbol) return ''
  return symbol.split('/')[0]
}

/**
 * Format large numbers compactly: 1200 -> 1.2K
 */
export function formatCompact(value) {
  if (value == null || isNaN(value)) return '0'
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}
