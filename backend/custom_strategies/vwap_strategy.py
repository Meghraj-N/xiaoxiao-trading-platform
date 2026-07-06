import pandas as pd
from engine.strategies.base import BaseStrategy, Signal
import numpy as np

class VWAPStrategy(BaseStrategy):
    """
    VWAP Strategy
    LevelUpSam Guide - Strategy D
    """
    
    @property
    def name(self) -> str:
        return "VWAP Strategy"
        
    def generate_signal(self, df: pd.DataFrame) -> Signal:
        if df.empty or len(df) < 24:
            return Signal(direction="flat")
            
        try:
            # Calculate 24-period Rolling VWAP (approx 1 day on 1h timeframe)
            df_vwap = df.copy()
            df_vwap['typical_price'] = (df_vwap['high'] + df_vwap['low'] + df_vwap['close']) / 3
            df_vwap['vol_x_tp'] = df_vwap['volume'] * df_vwap['typical_price']
            
            period = 24
            df['vwap'] = df_vwap['vol_x_tp'].rolling(window=period).sum() / df_vwap['volume'].rolling(window=period).sum()
            
            if 'vwap' not in df.columns or pd.isna(df['vwap'].iloc[-1]):
                return Signal(direction="flat")
                
            latest = df.iloc[-1]
            previous = df.iloc[-2]
            
            current_vwap = latest['vwap']
                    
            # Check for entry condition
            if previous['close'] < previous['vwap'] and latest['close'] > current_vwap:
                return Signal(
                    direction="long",
                    confidence=1.0,
                    stop_loss=latest['close'] * (1 - 0.003),  # 0.3% stop loss
                    take_profit=current_vwap * 1.005,         # VWAP + 0.5% target
                    reason="Price crossed above VWAP"
                )
                
        except Exception as e:
            pass
            
        return Signal(direction="flat")
