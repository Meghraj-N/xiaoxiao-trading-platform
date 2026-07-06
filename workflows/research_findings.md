# AI Trading Bot (Xiaoxiao) - Research Findings

This document synthesizes the research gathered from academic resources, YouTube channels, open-source repositories, and PDFs provided by the user.

## 1. Strategies & Risk Management (YouTubers & PDF Guide)
- **Macro & Fundamental Context (Kamra, Ranade, AssetYogi):**
  - Do not trade in a technical vacuum. Evaluate financial health, sector growth, interest rates, and CPI.
- **Price Action & Technicals (Rayner Teo, DaytradeWarrior):**
  - Utilize support/resistance, market structure, EMA Crossovers (9/21), RSI Reversals (bounce off 30), and Opening Range Breakout (ORB).
  - Use the CEST Framework: Conditions (trend/range), Entry (exact trigger), Stop (invalidation level), Target (take-profit zone).
- **Capital Preservation & Defense (Adam Khoo, ClayTrader):**
  - **1-2% Rule:** Never risk more than 1-2% of total equity on a single trade.
  - **Hard Stops:** Stop-loss must be ruthless and based on chart invalidation, not an arbitrary dollar amount. Never widen active stops.
  - **Positive Expectancy:** Strict R:R ratio (e.g., minimum 1:2 or 1:1.5).
  - **Daily Limits & Time:** Stop all trading if daily loss exceeds 2%. All positions squared off by 3:20 PM.
  - **Metrics:** Win Rate >45%, Max Drawdown <10%, Profit Factor >1.5, Sharpe >1.0.

## 2. Core Architectures (Open Source Repositories)
- **Freqtrade (FreqAI):** 
  - Threaded 3-layer architecture (Data, Strategy, Trade Execution) with self-adaptive model retraining to avoid blocking real-time execution.
- **QuantConnect / Lean:** 
  - Highly robust, event-driven engine handling slippage, data feeds, and portfolio construction accurately. Extensible for Python ML models.
- **HKUDS/AI-Trader:** 
  - Agent-native, utilizing LLMs through a toolchain (MCP). Separates concerns per agent (e.g., crypto vs. stocks).
- **Marketcalls/OpenAlgo:** 
  - Great client-server bridging for Indian brokerages. Uses MCP to connect LLMs for natural language trading commands.
- **Orchestra-Research/AI-research-SKILLs:** 
  - Two-loop architecture for autonomous research (inner loop: experiments, outer loop: synthesis). Applicable to the agentic decision-making layer of the trading bot.

## 3. Synthesized Architecture Conclusion
The bot must operate with a hybrid architecture:
1. **Fundamental / Macro Agent:** Evaluates the overarching trend and regime using news and macro data (inspired by Orchestra's two-loop methodology and AI-Trader).
2. **Technical Execution Layer:** Event-driven, threaded execution engine (inspired by Freqtrade/Lean) evaluating 9/21 EMAs, RSI, VWAP.
3. **Risk Management Guardrails:** Hardcoded rules (1% risk, R:R >= 1.5, daily loss limit) acting as a circuit breaker outside the LLM reasoning to ensure capital preservation.
4. **Integration:** Tools implemented as Python scripts in the `tools/` directory, managed by the WAT framework's workflow and agent structure.
