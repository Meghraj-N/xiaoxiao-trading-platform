import { useEffect, useRef } from 'react'
import { createChart } from 'lightweight-charts'

export default function EquityChart({ data }) {
  const chartContainerRef = useRef()
  const chartRef = useRef()
  const areaSeriesRef = useRef()

  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#ffffff' },
        textColor: '#333',
      },
      grid: {
        vertLines: { color: '#f3f4f6' },
        horzLines: { color: '#f3f4f6' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 300,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      }
    })
    chartRef.current = chart

    const areaSeries = chart.addAreaSeries({
      lineColor: '#2962FF',
      topColor: '#2962FF',
      bottomColor: 'rgba(41, 98, 255, 0.28)',
    })
    areaSeriesRef.current = areaSeries

    if (data && data.length > 0) {
      areaSeries.setData(data)
    } else {
      // Mock data if none exists yet to show empty state beautifully
      const now = Math.floor(Date.now() / 1000)
      areaSeries.setData([{ time: now - 3600, value: 3.0 }, { time: now, value: 3.0 }])
    }

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current.clientWidth })
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [])

  // Update chart when new data comes in
  useEffect(() => {
    if (areaSeriesRef.current && data && data.length > 0) {
      areaSeriesRef.current.setData(data)
    }
  }, [data])

  return <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
}
