import pandas as pd
import numpy as np
from engine.strategies.base import BaseStrategy, Signal

class SupertrendStrategy(BaseStrategy):
    """
    Supertrend Strategy
    LevelUpSam Guide - Strategy E
    """
    
    @property
    def name(self) -> str:
        return "Supertrend Flipper"
        
    def __init__(self):
        super().__init__()
        self.period = 7
        self.multiplier = 3.0

    def generate_signal(self, df: pd.DataFrame) -> Signal:
        if df.empty or len(df) < self.period:
            return Signal(direction="flat")
            
        try:
            # Calculate ATR
            high_low = df['high'] - df['low']
            high_close = (df['high'] - df['close'].shift()).abs()
            low_close = (df['low'] - df['close'].shift()).abs()
            tr = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
            atr = tr.ewm(alpha=1/self.period, adjust=False).mean()
            
            hl2 = (df['high'] + df['low']) / 2
            
            final_upperband = hl2 + (self.multiplier * atr)
            final_lowerband = hl2 - (self.multiplier * atr)
            
            supertrend = [True] * len(df)
            
            # For simplicity using arrays to avoid loc performance hit
            close_arr = df['close'].values
            ub_arr = final_upperband.values
            lb_arr = final_lowerband.values
            
            for i in range(1, len(df.index)):
                if close_arr[i] > ub_arr[i-1]:
                    supertrend[i] = True
                elif close_arr[i] < lb_arr[i-1]:
                    supertrend[i] = False
                else:
                    supertrend[i] = supertrend[i-1]
                    
                    if supertrend[i] == True and lb_arr[i] < lb_arr[i-1]:
                        lb_arr[i] = lb_arr[i-1]
                    if supertrend[i] == False and ub_arr[i] > ub_arr[i-1]:
                        ub_arr[i] = ub_arr[i-1]
                        
            df['supertrend'] = supertrend
            df['lowerband'] = lb_arr
            df['upperband'] = ub_arr
            
            latest = df.iloc[-1]
            previous = df.iloc[-2]
            
            curr_dir = latest['supertrend']
            prev_dir = previous['supertrend']
            
            # Check for entry (flip to bullish)
            if prev_dir == False and curr_dir == True:
                return Signal(
                    direction="long",
                    confidence=1.0,
                    stop_loss=latest['lowerband'],  # Stop loss built into supertrend level
                    take_profit=latest['close'] * 1.10,
                    reason="Supertrend flipped to bullish"
                )
                
            # Check for entry (flip to bearish)
            if prev_dir == True and curr_dir == False:
                return Signal(
                    direction="short",
                    confidence=1.0,
                    stop_loss=latest['upperband'],
                    take_profit=latest['close'] * 0.90,
                    reason="Supertrend flipped to bearish"
                )
                
        except Exception as e:
            pass
            
        return Signal(direction="flat")
