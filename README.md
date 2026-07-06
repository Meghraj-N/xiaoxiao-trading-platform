# 🧡 Xiaoxiao — Honest AI Trading Bot

> Real live prices. Fake money. Real fees. No lies.

Xiaoxiao is a cryptocurrency trading bot that trades **real live prices with simulated money** on Delta Exchange. Every trade is honest — real fees, real slippage, truthful stops on every loss.

## What It Does

- **Fetches real-time prices** from Delta Exchange via CCXT
- **Paper trades** with $3 starting capital using futures (5x leverage)
- **Applies real fees** (0.02% maker / 0.05% taker) and slippage (0.05%)
- **Runs 3 simple strategies**: EMA Crossover, RSI Mean Reversion, Bollinger Breakout
- **Backtests honestly** with walk-forward validation — only runs strategies that pass
- **Sizes positions** using Fractional Kelly Criterion (half-Kelly)
- **Guards against ruin**: drawdown limits, daily loss caps, reset-and-learn cycles
- **Shows everything** in a premium live dashboard (Vite + React + Motion)

## Honest Disclaimer

⚠️ **This bot does not guarantee profit.** The strategies are simple, well-known approaches. The backtester will show you their real performance — which may be mediocre or negative after fees. $3 is an extremely small account; this is a learning tool, not a path to riches.

## Quick Start

### Backend (Python)
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your Delta Exchange testnet API keys
python main.py
```

### Frontend (React)
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 to see the dashboard.

### Get Delta Exchange Testnet Keys
1. Go to https://testnet.delta.exchange/
2. Create a free testnet account
3. Navigate to API Management
4. Create API key with Read + Trading permissions
5. Copy key and secret to your `.env` file

## Architecture

```
xiaoxiao/
├── backend/           # Python trading engine
│   ├── engine/        # Core: data feed, paper trader, strategies
│   ├── api/           # FastAPI REST + WebSocket server
│   ├── db/            # SQLite trade storage
│   ├── config.py      # All settings
│   └── main.py        # Entry point
├── frontend/          # Vite + React dashboard
│   └── src/           # Components, hooks, styles
└── README.md          # You are here
```

## Verified Sources

| Fact | Value | Source |
|------|-------|--------|
| Delta Futures Maker Fee | 0.02% | [delta.exchange](https://www.delta.exchange/) |
| Delta Futures Taker Fee | 0.05% | [delta.exchange](https://www.delta.exchange/) |
| Kelly Formula | f* = W - (1-W)/R | [kraken.com](https://www.kraken.com) |
| CCXT Version | 4.5.x | [github.com/ccxt/ccxt](https://github.com/ccxt/ccxt) |

## License

MIT — use at your own risk. This is not financial advice.
