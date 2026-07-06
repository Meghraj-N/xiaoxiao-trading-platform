import { useEffect, useRef, useState } from 'react'
import { createChart } from 'lightweight-charts'

export default function GreeksChart() {
  const chartContainerRef = useRef()
  const [data, setData] = useState([])

  useEffect(() => {
    // We will connect this to real Delta Exchange data via websockets later.
    // For now, let's create a placeholder lightweight chart instance.
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#ffffff' },
        textColor: '#333',
      },
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
    })

    const deltaSeries = chart.addLineSeries({ color: '#2962FF', title: 'Delta' })
    const gammaSeries = chart.addLineSeries({ color: '#FF6D00', title: 'Gamma' })

    // Placeholder data
    const sampleData = [
      { time: '2026-07-01', value: 0.45 },
      { time: '2026-07-02', value: 0.48 },
      { time: '2026-07-03', value: 0.52 },
      { time: '2026-07-04', value: 0.55 },
      { time: '2026-07-05', value: 0.51 },
    ]

    deltaSeries.setData(sampleData)

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current.clientWidth })
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [])

  return <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
}
