import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import GreeksChart from './charts/GreeksChart'
import OptionChain from './charts/OptionChain'

export default function OptionsDashboard() {
  const [activeTab, setActiveTab] = useState('chain')

  const tabs = [
    { id: 'chain', label: 'Option Chain' },
    { id: 'greeks', label: 'Greeks Chart' },
    { id: 'oi', label: 'OI Tracker' },
    { id: 'maxpain', label: 'Max Pain' },
  ]

  return (
    <div className="options-dashboard" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
      <div className="card">
        <div className="card-header" style={{ paddingBottom: '0', borderBottom: 'none' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '0.75rem 1rem',
                  fontSize: '1rem',
                  fontWeight: activeTab === tab.id ? '600' : '400',
                  color: activeTab === tab.id ? '#D97706' : '#6b7280',
                  borderBottom: activeTab === tab.id ? '2px solid #D97706' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          {activeTab === 'chain' && (
            <motion.div
              key="chain"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              style={{ height: '100%' }}
            >
              <div className="card" style={{ height: '100%' }}>
                <div className="card-header">
                  <h3>🔗 Live Option Chain</h3>
                </div>
                <div className="card-body" style={{ height: 'calc(100% - 60px)', overflow: 'auto' }}>
                  <OptionChain />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'greeks' && (
            <motion.div
              key="greeks"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              style={{ height: '100%' }}
            >
              <div className="card" style={{ height: '100%' }}>
                <div className="card-header">
                  <h3>📈 Option Greeks Chart (ATM)</h3>
                </div>
                <div className="card-body" style={{ height: '500px' }}>
                  <GreeksChart />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'oi' && (
            <motion.div
              key="oi"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="card">
                <div className="card-header">
                  <h3>📊 Open Interest Tracker</h3>
                </div>
                <div className="card-body">
                  <p className="empty-state-text">OI Tracker visualization loading...</p>
                </div>
              </div>
            </motion.div>
          )}
          
          {activeTab === 'maxpain' && (
            <motion.div
              key="maxpain"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="card">
                <div className="card-header">
                  <h3>🎯 Max Pain</h3>
                </div>
                <div className="card-body">
                  <p className="empty-state-text">Max pain visualization loading...</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
