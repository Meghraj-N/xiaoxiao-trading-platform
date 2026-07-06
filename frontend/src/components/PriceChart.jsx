import { useEffect, useRef } from 'react'

export default function PriceChart({ prices }) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)
  const seriesRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return

    // Dynamic import since lightweight-charts is a browser lib
    async function initChart() {
      try {
        const LWC = await import('lightweight-charts')
        if (chartRef.current) return // already initialized

        const chart = LWC.createChart(containerRef.current, {
          width: containerRef.current.clientWidth,
          height: 320,
          layout: {
            background: { color: '#FFFFFF' },
            textColor: '#6B6B80',
            fontFamily: 'Inter, sans-serif',
          },
          grid: {
            vertLines: { color: '#FFF0E6' },
            horzLines: { color: '#FFF0E6' },
          },
          crosshair: { mode: LWC.CrosshairMode.Normal },
          rightPriceScale: { borderColor: '#FFE0CC' },
          timeScale: { borderColor: '#FFE0CC', timeVisible: true },
        })

        const series = chart.addCandlestickSeries({
          upColor: '#10B981',
          downColor: '#EF4444',
          borderUpColor: '#10B981',
          borderDownColor: '#EF4444',
          wickUpColor: '#10B981',
          wickDownColor: '#EF4444',
        })

        // Generate some demo candle data
        const now = Math.floor(Date.now() / 1000)
        const candles = []
        let price = 68000
        for (let i = 200; i >= 0; i--) {
          const t = now - i * 3600
          const o = price + (Math.random() - 0.48) * 300
          const c = o + (Math.random() - 0.48) * 400
          const h = Math.max(o, c) + Math.random() * 200
          const l = Math.min(o, c) - Math.random() * 200
          candles.push({ time: t, open: o, high: h, low: l, close: c })
          price = c
        }
        series.setData(candles)

        chartRef.current = chart
        seriesRef.current = series

        // Resize observer
        const ro = new ResizeObserver(() => {
          chart.applyOptions({ width: containerRef.current.clientWidth })
        })
        ro.observe(containerRef.current)
        return () => ro.disconnect()
      } catch (e) {
        console.warn('Chart init failed:', e)
      }
    }
    initChart()
  }, [])

  // Update with live prices
  useEffect(() => {
    if (seriesRef.current && prices?.['BTC/USDT']) {
      const p = prices['BTC/USDT']
      seriesRef.current.update({
        time: Math.floor(Date.now() / 1000),
        open: p - Math.random() * 50,
        high: p + Math.random() * 80,
        low: p - Math.random() * 80,
        close: p,
      })
    }
  }, [prices])

  return <div ref={containerRef} style={{ height: 320 }} />
}
