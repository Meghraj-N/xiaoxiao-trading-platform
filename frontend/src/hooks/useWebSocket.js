import { useState, useEffect, useRef, useCallback } from 'react'

const WS_URL = `ws://${window.location.hostname}:8000/ws`
const MAX_RECONNECT_DELAY = 30000
const INITIAL_RECONNECT_DELAY = 1000

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false)
  const [prices, setPrices] = useState({})
  const [trades, setTrades] = useState([])
  const [equity, setEquity] = useState(null)
  const [status, setStatus] = useState(null)

  const wsRef = useRef(null)
  const reconnectDelay = useRef(INITIAL_RECONNECT_DELAY)
  const reconnectTimer = useRef(null)
  const mountedRef = useRef(true)

  const handleMessage = useCallback((event) => {
    try {
      const msg = JSON.parse(event.data)

      switch (msg.type) {
        case 'price_update':
          setPrices(prev => ({ ...prev, [msg.symbol]: msg.price }))
          break

        case 'trade_executed':
          setTrades(prev => [msg.trade, ...prev].slice(0, 200))
          setEquity(msg.equity)
          break

        case 'equity_update':
          setEquity(msg.equity)
          break

        case 'status_change':
          setStatus({ running: msg.running })
          break

        case 'risk_update':
          // handled separately
          break

        default:
          break
      }
    } catch {
      /* ignore malformed messages */
    }
  }, [])

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    try {
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        if (!mountedRef.current) return
        setIsConnected(true)
        reconnectDelay.current = INITIAL_RECONNECT_DELAY
      }

      ws.onmessage = handleMessage

      ws.onclose = () => {
        if (!mountedRef.current) return
        setIsConnected(false)
        reconnectTimer.current = setTimeout(() => {
          reconnectDelay.current = Math.min(
            reconnectDelay.current * 2,
            MAX_RECONNECT_DELAY
          )
          connect()
        }, reconnectDelay.current)
      }

      ws.onerror = () => {
        ws.close()
      }
    } catch {
      setIsConnected(false)
    }
  }, [handleMessage])

  useEffect(() => {
    mountedRef.current = true
    connect()

    return () => {
      mountedRef.current = false
      clearTimeout(reconnectTimer.current)
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.close()
      }
    }
  }, [connect])

  return { isConnected, prices, trades, equity, status }
}
