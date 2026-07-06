# ML/AI Feature Generator Design

## Overview
A lightweight, dependency-free (beyond pandas/numpy) module to generate quantitative features for ML/AI models from raw OHLCV market data.

## Architecture
- **Location**: `backend/engine/ml_features.py`
- **Class**: `FeatureGenerator`
- **Design Goal**: Stateless, purely functional transformations of pandas DataFrames.

## Components
1. **Momentum Features**:
   - N-period Returns (e.g. 1-candle, 3-candle returns)
2. **Oscillator Features**:
   - RSI (Relative Strength Index)
   - MACD (Moving Average Convergence Divergence)
3. **Volatility Features**:
   - ATR (Average True Range)
   - Bollinger Bands Width
   - %B (Position of price relative to bands)
4. **Trend Features**:
   - Distance from SMA/EMA (e.g. Price vs 50-SMA)

## Data Flow
- **Input**: DataFrame `df` with columns `['timestamp', 'open', 'high', 'low', 'close', 'volume']`
- **Processing**: Compute features using pandas/numpy vectorized functions.
- **Normalization**: Optional z-score normalization method for feeding directly into deep learning or tree-based ML models.
- **Output**: Enriched `df` with new columns for each calculated feature.

## Error Handling
- **NaN Handling**: Configurable `drop_nan=True` to remove leading rows that lack sufficient lookback data.
