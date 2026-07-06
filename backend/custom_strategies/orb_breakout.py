from datetime import datetime
import pandas as pd
from engine.strategies.base import BaseStrategy, Signal

class ORBStrategy(BaseStrategy):
    """
    Opening Range Breakout (ORB)
    LevelUpSam Guide - Strategy C
    """
    
    @property
    def name(self) -> str:
        return "ORB Breakout"
    
    def __init__(self):
        super().__init__()
        self.opening_range_high = None
        self.opening_range_low = None
        self.range_size = 0.0
        self.range_start_hour = 0
        self.range_end_minute = 15

    def generate_signal(self, df: pd.DataFrame) -> Signal:
        if df.empty or len(df) < 2:
            return Signal(direction="flat")
            
        latest = df.iloc[-1]
        
        try:
            ts_sec = latest.name.timestamp() if isinstance(latest.name, pd.Timestamp) else (latest['timestamp'].timestamp() if 'timestamp' in latest else 0)
            dt = datetime.utcfromtimestamp(ts_sec)
            
            if dt.hour == self.range_start_hour and dt.minute <= self.range_end_minute:
                if self.opening_range_high is None or latest['high'] > self.opening_range_high:
                    self.opening_range_high = latest['high']
                if self.opening_range_low is None or latest['low'] < self.opening_range_low:
                    self.opening_range_low = latest['low']
                return Signal(direction="flat")
            elif dt.hour == 0 and dt.minute == 0:
                self.opening_range_high = latest['high']
                self.opening_range_low = latest['low']
                
            if self.opening_range_high and self.opening_range_low:
                self.range_size = self.opening_range_high - self.opening_range_low
                
                if self.range_size > 0:
                    if latest['close'] > self.opening_range_high:
                        return Signal(
                            direction="long",
                            confidence=1.0,
                            stop_loss=latest['close'] - (0.5 * self.range_size),
                            take_profit=latest['close'] + (1.5 * self.range_size),
                            reason="Price broke above Opening Range"
                        )
                    elif latest['close'] < self.opening_range_low:
                        return Signal(
                            direction="short",
                            confidence=1.0,
                            stop_loss=latest['close'] + (0.5 * self.range_size),
                            take_profit=latest['close'] - (1.5 * self.range_size),
                            reason="Price broke below Opening Range"
                        )
                        
        except Exception as e:
            pass
            
        return Signal(direction="flat")
