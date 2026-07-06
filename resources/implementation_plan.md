# AI Trading Bot Implementation Plan

This plan outlines the architecture and development roadmap for a comprehensive AI-driven trading system. It integrates the robust quantitative infrastructure of systems like QuantConnect and Freqtrade with the autonomous AI capabilities of AI-Trader, while specifically targeting the Indian market (using OpenAlgo) and incorporating trading philosophies from leading experts.

## Goal Description

To build an autonomous, multi-strategy AI Trading Bot that bridges modern machine learning (ML) and Large Language Models (LLMs) with proven technical and fundamental trading strategies. The bot will support both the Indian Stock Market (equities/options) and global Cryptocurrency markets.

## Open Questions

> [!WARNING]
> **Broker Integration:** Which Indian broker (e.g., Zerodha, Angel One, Upstox) or Crypto exchange (e.g., Binance, Bybit) would you like to prioritize for the initial live execution integration?

> [!IMPORTANT]
> **Strategy Priority:** The plan includes both short-term technical analysis (Rayner Teo/Adam Khoo style) and long-term fundamental analysis (Pranjal Kamra/Rachana Ranade style). Which approach should we focus on building out first?

> [!NOTE]
> **Tech Stack Choice:** OpenAlgo (Python/Rust) is excellent for the Indian market, while Lean (C# with Python bindings) is enterprise-grade. Should we build a lightweight custom Python engine integrating `ccxt`/OpenAlgo, or adopt Lean as the core backtesting engine?

## Proposed Architecture

The system will be composed of four distinct layers:

### 1. Data Ingestion & Feature Engineering (The Senses)
- **Market Data:** OHLCV data from brokers and exchanges.
- **Alternative Data:** News feeds, Twitter, and financial reports for sentiment analysis.
- **Feature Generation (FreqAI inspired):** Automated generation of technical indicators (RSI, MACD, EMAs) and statistical features for ML models.

### 2. Strategy Engine (The Logic)
- **Technical Analysis (TA) Module:** 
  - Implements **Rayner Teo's** principles: Break & Retest, 200-MA Trend Following, and strict Risk Management (position sizing).
  - Implements **Adam Khoo's** principles: Trend Retracement System, Range Trading, and Support/Resistance breakouts.
- **Fundamental Analysis (FA) Module:** 
  - Inspired by **Pranjal Kamra, CA Rachana Ranade, and Asset Yogi**. 
  - Screens Indian equities based on value metrics (P/E, ROCE, Debt-to-Equity) for long-term portfolio allocation.
- **AI/ML Layer (AI-Trader & FreqAI inspired):**
  - **Predictive Models:** XGBoost/PyTorch models predicting short-term price movements based on TA features.
  - **LLM Agents:** Utilizing `AI-research-SKILLs` structures to deploy Claude/Gemini agents that read financial news and adjust the macro-strategy dynamically.

### 3. Execution & Routing (The Hands)
- **Indian Markets:** Integration via `OpenAlgo` to seamlessly connect with 30+ Indian brokers for zero-touch execution.
- **Crypto/US Markets:** Integration via `ccxt` or Webhooks (LevelUpSam style) connected to TradingView alerts.

### 4. Backtesting & Risk Management (The Shield)
- Using the `Lean` (QuantConnect) framework philosophy or a lightweight Python backtester (`backtrader` / `vectorbt`) to rigorously paper-trade all strategies before live deployment.
- Hardcoded risk limits: Max drawdown halts, max risk per trade (e.g., 1-2% of capital).

---

## Proposed Changes (Phase 1: Setup & Data)

### Core Framework

#### [NEW] `core/config.py`
Configuration management for API keys, broker selection, and global risk parameters.

#### [NEW] `data/data_fetcher.py`
Connects to historical data providers (e.g., Yahoo Finance, broker APIs) to download OHLCV data.

#### [NEW] `strategies/technical_strategies.py`
Implements Rayner Teo and Adam Khoo's baseline strategies (Trend Following, Pullbacks).

#### [NEW] `strategies/fundamental_screener.py`
Implements the Rachana Ranade/Pranjal Kamra long-term equity screener.

#### [NEW] `execution/broker_gateway.py`
A unified interface wrapping `OpenAlgo` for Indian brokers.

## Verification Plan

### Automated Tests
- Unit tests for feature generation (`pytest tests/test_features.py`).
- Backtesting the `technical_strategies.py` on 5 years of NIFTY 50 and BTC/USDT data to verify profitability and risk (Sharpe ratio, max drawdown).

### Manual Verification
- Deploy the bot in "Paper Trading" mode for 1 week.
- Verify that TradingView webhook signals (if used) correctly trigger the OpenAlgo execution endpoints without latency.
- Manually review the Fundamental Screener's top 10 stock picks against current market consensus.
