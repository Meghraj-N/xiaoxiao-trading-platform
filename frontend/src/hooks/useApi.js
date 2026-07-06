import { useState, useCallback } from 'react'

const BASE = '/api'

async function request(path, options = {}) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(err || `HTTP ${res.status}`)
    }
    return await res.json()
  } catch (err) {
    console.error(`[API] ${options.method || 'GET'} ${path} failed:`, err)
    throw err
  }
}

export function useApi() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const wrap = useCallback(async (fn) => {
    setLoading(true)
    setError(null)
    try {
      const result = await fn()
      return result
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  /* Read endpoints — match FastAPI server routes */
  const fetchStatus = useCallback(
    () => wrap(() => request('/status')),
    [wrap]
  )
  const fetchTrades = useCallback(
    (limit = 50, offset = 0) =>
      wrap(() => request(`/trades?limit=${limit}&offset=${offset}`)),
    [wrap]
  )
  const fetchEquity = useCallback(
    () => wrap(() => request('/equity')),
    [wrap]
  )
  const fetchStrategies = useCallback(
    () => wrap(() => request('/strategies')),
    [wrap]
  )
  const fetchRisk = useCallback(
    () => wrap(() => request('/risk')),
    [wrap]
  )
  const fetchSettings = useCallback(
    () => wrap(() => request('/settings')),
    [wrap]
  )

  /* Action endpoints — match FastAPI server routes */
  const startBot = useCallback(
    (payload) => wrap(() => request('/control/start', { method: 'POST', body: JSON.stringify(payload) })),
    [wrap]
  )
  const stopBot = useCallback(
    () => wrap(() => request('/control/stop', { method: 'POST' })),
    [wrap]
  )
  const runBacktest = useCallback(
    (strategyName, symbol = 'BTC/USDT') =>
      wrap(() => request(`/backtest/${strategyName}?symbol=${encodeURIComponent(symbol)}`, { method: 'POST' })),
    [wrap]
  )

  const saveSettings = useCallback(
    (settings) => wrap(() => request('/settings', { method: 'POST', body: JSON.stringify(settings) })),
    [wrap]
  )

  return {
    loading, error,
    fetchStatus, fetchTrades, fetchEquity, fetchStrategies, fetchRisk, fetchSettings,
    startBot, stopBot, runBacktest, saveSettings,
  }
}
