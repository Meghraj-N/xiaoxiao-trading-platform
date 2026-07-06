import pandas as pd
import numpy as np

class FeatureGenerator:
    """
    Dependency-free ML/AI feature generator using pandas/numpy.
    Takes a raw OHLCV DataFrame and attaches standardized indicators suitable for ML models.
    """
    
    @staticmethod
    def generate_features(df: pd.DataFrame, drop_nan: bool = True) -> pd.DataFrame:
        """
        Calculates all standard features and appends them to the dataframe.
        Expects columns: ['timestamp', 'open', 'high', 'low', 'close', 'volume']
        """
        # Make a copy so we don't alter the original directly if not intended
        df = df.copy()
        
        # 1. Momentum & Returns
        df['ret_1'] = df['close'].pct_change(1)
        df['ret_3'] = df['close'].pct_change(3)
        df['ret_5'] = df['close'].pct_change(5)
        
        # 2. Oscillators: RSI (14 period)
        delta = df['close'].diff()
        up = delta.clip(lower=0)
        down = -1 * delta.clip(upper=0)
        roll_up = up.ewm(com=14-1, adjust=False).mean()
        roll_down = down.ewm(com=14-1, adjust=False).mean()
        rs = roll_up / roll_down
        df['rsi_14'] = 100.0 - (100.0 / (1.0 + rs))
        
        # MACD (12, 26, 9)
        ema12 = df['close'].ewm(span=12, adjust=False).mean()
        ema26 = df['close'].ewm(span=26, adjust=False).mean()
        df['macd_line'] = ema12 - ema26
        df['macd_signal'] = df['macd_line'].ewm(span=9, adjust=False).mean()
        df['macd_hist'] = df['macd_line'] - df['macd_signal']
        
        # 3. Volatility: Bollinger Bands (20 period, 2 std)
        sma20 = df['close'].rolling(window=20).mean()
        std20 = df['close'].rolling(window=20).std(ddof=0)
        df['bb_upper'] = sma20 + (std20 * 2)
        df['bb_lower'] = sma20 - (std20 * 2)
        
        # Bollinger Band Width (normalized to price)
        df['bb_width'] = (df['bb_upper'] - df['bb_lower']) / sma20
        # %B - where the price is in relation to the bands
        # Avoid division by zero when std20 is 0
        df['bb_pb'] = np.where(std20 > 0, (df['close'] - df['bb_lower']) / (df['bb_upper'] - df['bb_lower']), 0)
        
        # ATR (Average True Range) - 14 period
        high_low = df['high'] - df['low']
        high_close = np.abs(df['high'] - df['close'].shift())
        low_close = np.abs(df['low'] - df['close'].shift())
        true_range = np.maximum(high_low, np.maximum(high_close, low_close))
        df['atr_14'] = true_range.rolling(window=14).mean()
        
        # 4. Trend: Distance from 50-SMA
        sma50 = df['close'].rolling(window=50).mean()
        df['dist_sma50'] = (df['close'] - sma50) / sma50
        
        if drop_nan:
            df.dropna(inplace=True)
            
        return df
        
    @staticmethod
    def normalize(df: pd.DataFrame, feature_columns: list[str]) -> pd.DataFrame:
        """
        Normalizes the specified columns using z-score standardization (mean=0, std=1).
        Useful when feeding data into neural networks or linear models.
        """
        df_norm = df.copy()
        for col in feature_columns:
            if col in df_norm.columns:
                mean = df_norm[col].mean()
                std = df_norm[col].std(ddof=0)
                if std > 0:
                    df_norm[f"{col}_norm"] = (df_norm[col] - mean) / std
                else:
                    df_norm[f"{col}_norm"] = 0.0
        return df_norm

