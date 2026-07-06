import { motion } from 'motion/react'

const statusConfig = {
  running:      { color: 'var(--success)',  label: 'Running',      dot: 'status-dot--green' },
  connected:    { color: 'var(--success)',  label: 'Connected',    dot: 'status-dot--green' },
  paused:       { color: 'var(--warning)',  label: 'Paused',       dot: 'status-dot--yellow' },
  reconnecting: { color: 'var(--warning)',  label: 'Reconnecting', dot: 'status-dot--yellow' },
  stopped:      { color: 'var(--danger)',   label: 'Stopped',      dot: 'status-dot--red' },
  error:        { color: 'var(--danger)',   label: 'Error',        dot: 'status-dot--red' },
  connecting:   { color: 'var(--warning)',  label: 'Connecting',   dot: 'status-dot--yellow' },
}

export default function StatusBadge({ status = 'connecting', size = 'md' }) {
  const cfg = statusConfig[status] || statusConfig.connecting

  return (
    <motion.div
      className={`status-badge status-badge--${size}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <span className={`status-dot ${cfg.dot}`} />
      <span className="status-label">{cfg.label}</span>
    </motion.div>
  )
}
