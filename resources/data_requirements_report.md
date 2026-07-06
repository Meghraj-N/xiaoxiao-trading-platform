# Data Requirements and Formatting Report

To successfully implement the AI-Trader and FreqAI machine learning architectures, historical and live data must be strictly formatted and feature-engineered. This report outlines the data requirements, schema, and sources.

## 1. Core Data Format (OHLCV)

The foundational data file format for backtesting and ML ingestion is time-series OHLCV (Open, High, Low, Close, Volume) data. 

**Recommended File Format:** `.csv` or `.parquet` (Parquet is preferred for ML workloads due to compression and speed).

### Schema:
| Timestamp (UTC) | Open | High | Low | Close | Volume |
|-----------------|------|------|-----|-------|--------|
| 2023-01-01 09:15:00 | 18000.50 | 18050.00 | 17980.20 | 18020.10 | 1500400 |

## 2. Feature Engineering (FreqAI Style)

Raw OHLCV data is insufficient for advanced ML models (like XGBoost or PyTorch). The data file must be expanded via a feature engineering pipeline to include:

*   **Momentum Indicators:** RSI (14), MACD, Stochastic Oscillator.
*   **Trend Indicators:** 20 EMA, 50 SMA, 200 SMA (Rayner Teo & Adam Khoo strategies).
*   **Volatility Indicators:** Average True Range (ATR), Bollinger Bands width.
*   **Volume Profiles:** VWAP (Volume Weighted Average Price), On-Balance Volume (OBV).
*   **Lagged Features:** The `Close` price of the previous $N$ periods (e.g., `Close_t-1`, `Close_t-2`) to give the ML model a sense of sequence.

## 3. Fundamental Data File (JSON/CSV)

For the long-term investing module (Pranjal Kamra / Rachana Ranade), a separate cross-sectional data file is required containing quarterly/annual metrics.

### Schema:
| Ticker | Sector | P/E Ratio | ROCE (%) | Debt/Equity | YoY Rev Growth (%) | FCF (Cr) |
|--------|--------|-----------|----------|-------------|--------------------|----------|
| RELIANCE | Energy | 25.4 | 12.5 | 0.42 | 15.2 | 12000 |
| TCS | IT | 28.1 | 45.2 | 0.01 | 12.4 | 35000 |

## 4. Alternative Data (Sentiment / LLM Context)

For the `AI-Trader` LLM orchestration, text data is required. This is typically stored as JSON arrays containing news headlines or Twitter sentiment scores.

### Schema:
```json
[
  {
    "timestamp": "2023-10-25T08:30:00Z",
    "asset": "BTC",
    "headline": "SEC Approves Spot Bitcoin ETF",
    "sentiment_score": 0.95
  }
]
```

## 5. Recommended Data Sources

*   **Indian Equities (OHLCV):** 
    *   *Free:* Yahoo Finance (yfinance library) for daily data.
    *   *Paid (Intraday):* Truedata.in, Kite Connect (Zerodha), Upstox API.
*   **Indian Fundamentals:** 
    *   Screener.in (via web scraping or premium export), Trendlyne.
*   **Crypto (OHLCV):** 
    *   Binance API, ccxt (free, high quality down to 1-minute resolution).
*   **News/Sentiment:** 
    *   Alpha Vantage News API, Finnhub, or NewsAPI.
