import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useApi } from '../hooks/useApi'

const MODELS = [
  { id: 'llama-3.1-405b', name: 'Llama 3.1 405B', provider: 'Meta', badge: '🏆 Flagship' },
  { id: 'nemotron-340b', name: 'Nemotron 340B', provider: 'NVIDIA', badge: '⚡ Native' },
  { id: 'mixtral-8x22b', name: 'Mixtral 8x22B', provider: 'Mistral', badge: '🚀 Fast' },
  { id: 'gemma-2-27b', name: 'Gemma 2 27B', provider: 'Google', badge: '🪶 Light' },
]

export default function AILab() {
  const [selectedModel, setSelectedModel] = useState('llama-3.1-405b')
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Welcome to AI Lab! I\'m powered by NVIDIA NIM. I can analyze markets, suggest strategies, generate strategy code, and improve existing strategies.\n\nTry asking me to:\n• "Analyze BTC/USDT market"\n• "Suggest a new strategy"\n• "Generate a VWAP crossover strategy"\n• "What\'s a good entry for SOL?"' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const chatEndRef = useRef(null)
  const api = useApi()

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, model: selectedModel }),
      })
      const data = await res.json()

      if (data.error) {
        setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${data.error}`, isError: true }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ Connection error: ${e.message}`, isError: true }])
    }
    setLoading(false)
  }

  const analyzeMarket = async (symbol = 'BTC/USDT') => {
    setLoading(true)
    setMessages(prev => [...prev, { role: 'user', content: `Analyze ${symbol} market conditions` }])

    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, model: selectedModel }),
      })
      const data = await res.json()

      if (data.error) {
        setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${data.error}`, isError: true }])
      } else {
        setAnalysisResult(data.analysis)
        const a = data.analysis
        const content = a.parse_error
          ? a.raw_response
          : `📊 **${symbol} Market Analysis**\n\n` +
            `**Regime:** ${a.regime || 'N/A'}\n` +
            `**Bias:** ${a.bias || 'N/A'}\n` +
            `**Confidence:** ${((a.confidence || 0) * 100).toFixed(0)}%\n` +
            `**Volatility:** ${a.volatility || 'N/A'}\n` +
            `**Approach:** ${a.suggested_approach || 'N/A'}\n\n` +
            `${a.summary || ''}`
        setMessages(prev => [...prev, { role: 'assistant', content }])
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ ${e.message}`, isError: true }])
    }
    setLoading(false)
  }

  const generateStrategy = async () => {
    setLoading(true)
    const desc = input.trim() || 'A momentum-based strategy using RSI and MACD with volume confirmation'
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: `Generate strategy: "${desc}"` }])

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: desc, model: selectedModel }),
      })
      const data = await res.json()

      if (data.error) {
        setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${data.error}`, isError: true }])
      } else {
        const gen = data.generated
        const content = gen.parse_error
          ? gen.raw_response
          : `🤖 **Generated Strategy: ${gen.name || 'Custom'}**\n\n` +
            `${gen.description || ''}\n\n` +
            `**Indicators:** ${(gen.indicators_used || []).join(', ')}\n\n` +
            `\`\`\`python\n${(gen.code || '').slice(0, 500)}...\n\`\`\`\n\n` +
            `*Use "Save Strategy" to add this to your bot.*`
        setMessages(prev => [...prev, { role: 'assistant', content, generatedCode: gen }])
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ ${e.message}`, isError: true }])
    }
    setLoading(false)
  }

  const saveGeneratedStrategy = async (gen) => {
    if (!gen?.code || !gen?.name) return
    try {
      const res = await fetch('/api/custom-strategies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: gen.name,
          description: gen.description || '',
          code: gen.code,
          ai_model_used: selectedModel,
        }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.error
          ? `⚠️ Save failed: ${data.error}`
          : `✅ Strategy "${gen.name}" saved! Status: ${data.status}`
      }])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ ${e.message}`, isError: true }])
    }
  }

  return (
    <div className="ai-lab">
      {/* Model Selector */}
      <div className="model-selector">
        <span className="model-label">🧠 AI Model:</span>
        <div className="model-chips">
          {MODELS.map(m => (
            <motion.button
              key={m.id}
              className={`model-chip ${selectedModel === m.id ? 'active' : ''}`}
              onClick={() => setSelectedModel(m.id)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.96 }}
            >
              <span className="chip-badge">{m.badge}</span>
              <span className="chip-name">{m.name}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="ai-actions">
        {['BTC/USDT', 'ETH/USDT', 'SOL/USDT'].map(sym => (
          <motion.button
            key={sym}
            className="btn btn-secondary"
            onClick={() => analyzeMarket(sym)}
            disabled={loading}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            📊 Analyze {sym.split('/')[0]}
          </motion.button>
        ))}
        <motion.button
          className="btn btn-primary"
          onClick={generateStrategy}
          disabled={loading}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          🤖 Generate Strategy
        </motion.button>
      </div>

      {/* Chat */}
      <div className="ai-chat">
        <div className="chat-messages">
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                className={`chat-msg ${msg.role} ${msg.isError ? 'error' : ''}`}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              >
                <div className="msg-avatar">
                  {msg.role === 'user' ? '👤' : '🧡'}
                </div>
                <div className="msg-content">
                  <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>
                    {msg.content}
                  </pre>
                  {msg.generatedCode && (
                    <motion.button
                      className="btn btn-primary"
                      onClick={() => saveGeneratedStrategy(msg.generatedCode)}
                      whileHover={{ scale: 1.03 }}
                      style={{ marginTop: '12px' }}
                    >
                      💾 Save Strategy
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && (
            <motion.div
              className="chat-msg assistant"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="msg-avatar">🧡</div>
              <div className="msg-content typing">
                <span></span><span></span><span></span>
              </div>
            </motion.div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="chat-input-area">
          <input
            type="text"
            className="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Ask about markets, strategies, or trading concepts..."
            disabled={loading}
          />
          <motion.button
            className="btn btn-primary send-btn"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ➤
          </motion.button>
        </div>
      </div>
    </div>
  )
}
