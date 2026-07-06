import { useState, useEffect } from 'react'

export default function OptionChain() {
  const [chainData, setChainData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchChain = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/options/chain')
        const data = await response.json()
        setChainData(data.chain || [])
        setLoading(false)
      } catch (err) {
        console.error('Failed to fetch option chain:', err)
        setLoading(false)
      }
    }
    
    fetchChain()
    const interval = setInterval(fetchChain, 5000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return <div className="loading-state">Loading live option chain...</div>

  return (
    <table className="trade-table">
      <thead>
        <tr>
          <th colSpan="3" style={{ textAlign: 'center', backgroundColor: '#e8f5e9', color: '#2e7d32' }}>CALLS</th>
          <th style={{ textAlign: 'center', backgroundColor: '#f3f4f6' }}>STRIKE</th>
          <th colSpan="3" style={{ textAlign: 'center', backgroundColor: '#ffebee', color: '#c62828' }}>PUTS</th>
        </tr>
        <tr>
          <th>Bid</th>
          <th>Ask</th>
          <th>Vol</th>
          <th style={{ backgroundColor: '#f3f4f6' }}>Price</th>
          <th>Bid</th>
          <th>Ask</th>
          <th>Vol</th>
        </tr>
      </thead>
      <tbody>
        {chainData.map((row, i) => (
          <tr key={i}>
            <td style={{ color: '#2e7d32' }}>{row.callBid}</td>
            <td style={{ color: '#2e7d32' }}>{row.callAsk}</td>
            <td>{row.callVol}</td>
            <td style={{ fontWeight: 'bold', backgroundColor: '#f9fafb', textAlign: 'center' }}>{row.strike}</td>
            <td style={{ color: '#c62828' }}>{row.putBid}</td>
            <td style={{ color: '#c62828' }}>{row.putAsk}</td>
            <td>{row.putVol}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
