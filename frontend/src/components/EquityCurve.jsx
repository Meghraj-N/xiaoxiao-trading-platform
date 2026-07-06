import { useEffect, useRef } from 'react'

export default function EquityCurve({ data = [], currentEquity = 3 }) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)
  const seriesRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return

    async function initChart() {
      try {
        const LWC = await import('lightweight-charts')
        if (chartRef.current) return

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
          rightPriceScale: { borderColor: '#FFE0CC' },
          timeScale: { borderColor: '#FFE0CC', timeVisible: true },
        })

        const series = chart.addAreaSeries({
          lineColor: '#FF8C42',
          topColor: 'rgba(255, 140, 66, 0.3)',
          bottomColor: 'rgba(255, 140, 66, 0.02)',
          lineWidth: 2,
        })

        // Initial data
        const now = Math.floor(Date.now() / 1000)
        if (data.length > 0) {
          series.setData(data.map(d => ({
            time: Math.floor(d.timestamp),
            value: d.equity
          })))
        } else {
          series.setData([
            { time: now - 7200, value: 3.00 },
            { time: now - 3600, value: 3.00 },
            { time: now, value: currentEquity },
          ])
        }

        chartRef.current = chart
        seriesRef.current = series

        const ro = new ResizeObserver(() => {
          chart.applyOptions({ width: containerRef.current.clientWidth })
        })
        ro.observe(containerRef.current)
        return () => ro.disconnect()
      } catch (e) {
        console.warn('Equity chart init failed:', e)
      }
    }
    initChart()
  }, [])

  // Update with new equity
  useEffect(() => {
    if (seriesRef.current && currentEquity) {
      seriesRef.current.update({
        time: Math.floor(Date.now() / 1000),
        value: currentEquity,
      })
    }
  }, [currentEquity])

  return <div ref={containerRef} style={{ height: 320 }} />
}
