import { motion, useSpring, useTransform } from 'motion/react'
import { useEffect, useMemo } from 'react'

function getRiskColor(pct) {
  if (pct < 40) return 'var(--success)'
  if (pct < 70) return 'var(--warning)'
  return 'var(--danger)'
}

export default function RiskGauge({ value = 0, size = 160, strokeWidth = 12 }) {
  const clamped = Math.max(0, Math.min(100, value))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  const springValue = useSpring(0, { stiffness: 60, damping: 15 })

  useEffect(() => {
    springValue.set(clamped)
  }, [clamped, springValue])

  const offset = useTransform(
    springValue,
    (v) => circumference - (v / 100) * circumference
  )

  const color = useMemo(() => getRiskColor(clamped), [clamped])

  return (
    <motion.div
      className="risk-gauge"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="risk-gauge__svg"
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: offset }}
        />
        {/* Center text — rotated back to normal */}
        <g transform={`rotate(90, ${size / 2}, ${size / 2})`}>
          <text
            x={size / 2}
            y={size / 2 - 8}
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--text-primary)"
            fontFamily="Inter, sans-serif"
            fontWeight="800"
            fontSize={size * 0.18}
          >
            {Math.round(clamped)}%
          </text>
          <text
            x={size / 2}
            y={size / 2 + 16}
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--text-secondary)"
            fontFamily="Inter, sans-serif"
            fontWeight="600"
            fontSize={size * 0.075}
          >
            RISK EXPOSURE
          </text>
        </g>
      </svg>
    </motion.div>
  )
}
