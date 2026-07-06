import pandas as pd
from engine.strategies.base import BaseStrategy, Signal

class TrendRetracement(BaseStrategy):
    """
    Trend Retracement System (Adam Khoo)
    - Confirms uptrend using 50 SMA and 20 EMA.
    - Waits for a pullback (retracement) into the "value zone" (between 20 EMA and 50 SMA).
    - Enters when price shows a bullish sign (close > open) in this zone.
    """

    @property
    def name(self) -> str:
        return "Trend Retracement"

    def calculate_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        df["sma_50"] = df["close"].rolling(window=50).mean()
        df["ema_20"] = df["close"].ewm(span=20, adjust=False).mean()
        return df

    def generate_signal(self, df: pd.DataFrame) -> Signal:
        if len(df) < 50:
            return Signal("flat")
            
        current = df.iloc[-1]
        prev = df.iloc[-2]
        
        # Check if indicators are NaN
        if pd.isna(current["sma_50"]) or pd.isna(current["ema_20"]):
            return Signal("flat")

        # LONG setup
        # Trend is up: EMA 20 > SMA 50
        uptrend = current["ema_20"] > current["sma_50"]
        
        # Pullback into value zone: Low price is below EMA 20, but Close is above SMA 50
        in_value_zone_long = (current["low"] <= current["ema_20"]) and (current["close"] >= current["sma_50"])
        
        # Bullish reversal: green candle (close > open) and closing higher than previous close
        bullish_rev = (current["close"] > current["open"]) and (current["close"] > prev["close"])
        
        if uptrend and in_value_zone_long and bullish_rev:
            # Stop loss just below the 50 SMA
            sl = current["sma_50"] * 0.99
            return Signal(
                direction="long",
                confidence=0.8,
                stop_loss=sl,
                take_profit=current["close"] + 2 * (current["close"] - sl),  # 1:2 RR
                reason="Price pulled back to value zone in an uptrend with a bullish reversal."
            )
            
        # SHORT setup
        # Trend is down: EMA 20 < SMA 50
        downtrend = current["ema_20"] < current["sma_50"]
        
        # Pullback into value zone: High price is above EMA 20, but Close is below SMA 50
        in_value_zone_short = (current["high"] >= current["ema_20"]) and (current["close"] <= current["sma_50"])
        
        # Bearish reversal: red candle (close < open) and closing lower than previous close
        bearish_rev = (current["close"] < current["open"]) and (current["close"] < prev["close"])
        
        if downtrend and in_value_zone_short and bearish_rev:
            # Stop loss just above the 50 SMA
            sl = current["sma_50"] * 1.01
            return Signal(
                direction="short",
                confidence=0.8,
                stop_loss=sl,
                take_profit=current["close"] - 2 * (sl - current["close"]), # 1:2 RR
                reason="Price pulled back to value zone in a downtrend with a bearish reversal."
            )
            
        return Signal("flat")
