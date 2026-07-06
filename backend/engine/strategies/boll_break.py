"""
Bollinger Band Breakout Strategy
─────────────────────────────────
Price closes beyond BB(20, 2σ) with expanding bandwidth.
- Long: close > upper band + bandwidth expanding
- Short: close < lower band + bandwidth expanding
- Stop: middle band (SMA 20)
- TP: 1.5× distance from entry to middle band
"""

import pandas as pd
import numpy as np
from .base import BaseStrategy, Signal

import logging
logger = logging.getLogger("xiaoxiao.strategy.boll_break")


class BollingerBreakoutStrategy(BaseStrategy):
    name = "Boll Break"

    def __init__(self, bb_period: int = 20, bb_std: float = 2.0, bw_period: int = 20,
                 tp_mult: float = 1.5):
        self.bb_period = bb_period
        self.bb_std = bb_std
        self.bw_period = bw_period
        self.tp_mult = tp_mult

    def calculate_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        df['bb_mid'] = df['close'].rolling(window=self.bb_period).mean()
        df['bb_std'] = df['close'].rolling(window=self.bb_period).std()
        df['bb_upper'] = df['bb_mid'] + self.bb_std * df['bb_std']
        df['bb_lower'] = df['bb_mid'] - self.bb_std * df['bb_std']

        # Bandwidth = (upper - lower) / mid
        df['bandwidth'] = (df['bb_upper'] - df['bb_lower']) / df['bb_mid'].replace(0, np.nan)
        df['bandwidth_avg'] = df['bandwidth'].rolling(window=self.bw_period).mean()
        df['bandwidth_expanding'] = df['bandwidth'] > df['bandwidth_avg']

        return df

    def generate_signal(self, df: pd.DataFrame) -> Signal:
        df = self.calculate_indicators(df)

        if len(df) < self.bb_period + self.bw_period + 2:
            return Signal(direction='flat', confidence=0.0, reason='Not enough data')

        last = df.iloc[-1]
        close = last['close']
        upper = last['bb_upper']
        lower = last['bb_lower']
        mid = last['bb_mid']

        if pd.isna(upper) or pd.isna(lower) or pd.isna(mid):
            return Signal(direction='flat', confidence=0.0, reason='BB unavailable')

        # LONG: close > upper band + bandwidth expanding
        if close > upper and last['bandwidth_expanding']:
            stop_loss = mid  # middle band
            entry_to_mid = close - mid
            take_profit = close + entry_to_mid * self.tp_mult

            confidence = min(1.0, (close - upper) / last['bb_std'] * 0.3) if last['bb_std'] > 0 else 0.5
            logger.info(f"LONG signal: close={close:.2f} > upper BB={upper:.2f}, "
                        f"bandwidth expanding, SL={stop_loss:.2f}, TP={take_profit:.2f}")
            return Signal(
                direction='long', confidence=confidence,
                stop_loss=stop_loss, take_profit=take_profit,
                reason=f"Close ${close:.2f} broke above upper BB ${upper:.2f}, bandwidth expanding"
            )

        # SHORT: close < lower band + bandwidth expanding
        if close < lower and last['bandwidth_expanding']:
            stop_loss = mid
            entry_to_mid = mid - close
            take_profit = close - entry_to_mid * self.tp_mult

            confidence = min(1.0, (lower - close) / last['bb_std'] * 0.3) if last['bb_std'] > 0 else 0.5
            logger.info(f"SHORT signal: close={close:.2f} < lower BB={lower:.2f}, "
                        f"bandwidth expanding, SL={stop_loss:.2f}, TP={take_profit:.2f}")
            return Signal(
                direction='short', confidence=confidence,
                stop_loss=stop_loss, take_profit=take_profit,
                reason=f"Close ${close:.2f} broke below lower BB ${lower:.2f}, bandwidth expanding"
            )

        return Signal(direction='flat', confidence=0.0, reason='Price within bands')
