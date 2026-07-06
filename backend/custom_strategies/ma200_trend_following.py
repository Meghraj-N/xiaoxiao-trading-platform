import pandas as pd
from engine.strategies.base import BaseStrategy, Signal

class MA200TrendFollowing(BaseStrategy):
    """
    200-MA Trend Following (Rayner Teo)
    - Uses a 200-period Moving Average on the chart.
    - If price is above the 200 MA, looks only for long setups (buying) on a short-term dip.
    - If below, looks only for short setups (selling) on a short-term rally.
    """

    @property
    def name(self) -> str:
        return "200-MA Trend Following"

    def calculate_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        df["sma_200"] = df["close"].rolling(window=200).mean()
        # Fast indicator for entry triggers (RSI)
        delta = df["close"].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        df["rsi_14"] = 100 - (100 / (1 + rs))
        return df

    def generate_signal(self, df: pd.DataFrame) -> Signal:
        if len(df) < 200:
            return Signal("flat")
            
        current = df.iloc[-1]
        prev = df.iloc[-2]
        
        if pd.isna(current["sma_200"]) or pd.isna(current["rsi_14"]):
            return Signal("flat")

        # Long conditions
        above_200 = current["close"] > current["sma_200"]
        # Trigger: Oversold RSI crosses up (buying the dip in an uptrend)
        rsi_oversold_cross = (prev["rsi_14"] < 40) and (current["rsi_14"] >= 40)
        
        if above_200 and rsi_oversold_cross:
            sl = current["low"] * 0.98  # 2% stop loss
            return Signal(
                direction="long",
                confidence=0.75,
                stop_loss=sl,
                take_profit=current["close"] * 1.04,  # 1:2 RR
                reason="Price above 200 MA, RSI pulled back and crossed up."
            )
            
        # Short conditions
        below_200 = current["close"] < current["sma_200"]
        # Trigger: Overbought RSI crosses down (selling the rally in a downtrend)
        rsi_overbought_cross = (prev["rsi_14"] > 60) and (current["rsi_14"] <= 60)
        
        if below_200 and rsi_overbought_cross:
            sl = current["high"] * 1.02  # 2% stop loss
            return Signal(
                direction="short",
                confidence=0.75,
                stop_loss=sl,
                take_profit=current["close"] * 0.96,  # 1:2 RR
                reason="Price below 200 MA, RSI rallied and crossed down."
            )

        return Signal("flat")
