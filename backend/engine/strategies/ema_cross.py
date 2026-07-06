"""
EMA Crossover Strategy
──────────────────────
Fast EMA(9) crossing Slow EMA(21).
- Long: fast crosses above slow, close > both EMAs
- Short: fast crosses below slow, close < both EMAs
- Stop: 1.5 × ATR(14) from entry
- TP: 2:1 risk-reward

This is a trend-following strategy. Honest note: simple EMA
crossovers are well-known and often produce mediocre results
after fees in ranging markets.
"""

import pandas as pd
import numpy as np
from .base import BaseStrategy, Signal

import logging
logger = logging.getLogger("xiaoxiao.strategy.ema_cross")


class EMACrossStrategy(BaseStrategy):
    name = "EMA Cross"

    def __init__(self, fast_period: int = 9, slow_period: int = 21, atr_period: int = 14,
                 atr_sl_mult: float = 1.5, rr_ratio: float = 2.0):
        self.fast_period = fast_period
        self.slow_period = slow_period
        self.atr_period = atr_period
        self.atr_sl_mult = atr_sl_mult
        self.rr_ratio = rr_ratio

    def calculate_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        df['ema_fast'] = df['close'].ewm(span=self.fast_period, adjust=False).mean()
        df['ema_slow'] = df['close'].ewm(span=self.slow_period, adjust=False).mean()

        # ATR calculation
        high_low = df['high'] - df['low']
        high_close = (df['high'] - df['close'].shift()).abs()
        low_close = (df['low'] - df['close'].shift()).abs()
        true_range = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
        df['atr'] = true_range.rolling(window=self.atr_period).mean()

        # Crossover detection
        df['ema_diff'] = df['ema_fast'] - df['ema_slow']
        df['ema_diff_prev'] = df['ema_diff'].shift(1)
        df['cross_up'] = (df['ema_diff'] > 0) & (df['ema_diff_prev'] <= 0)
        df['cross_down'] = (df['ema_diff'] < 0) & (df['ema_diff_prev'] >= 0)

        return df

    def generate_signal(self, df: pd.DataFrame) -> Signal:
        df = self.calculate_indicators(df)

        if len(df) < self.slow_period + 2:
            return Signal(direction='flat', confidence=0.0, reason='Not enough data')

        last = df.iloc[-1]
        atr = last['atr']

        if pd.isna(atr) or atr <= 0:
            return Signal(direction='flat', confidence=0.0, reason='ATR unavailable')

        close = last['close']

        # LONG: fast crosses above slow AND close is above both EMAs
        if last['cross_up'] and close > last['ema_fast'] and close > last['ema_slow']:
            sl_distance = self.atr_sl_mult * atr
            stop_loss = close - sl_distance
            take_profit = close + sl_distance * self.rr_ratio
            confidence = min(1.0, abs(last['ema_diff']) / atr * 0.5)

            logger.info(f"LONG signal: close={close:.2f}, EMA9={last['ema_fast']:.2f}, "
                        f"EMA21={last['ema_slow']:.2f}, SL={stop_loss:.2f}, TP={take_profit:.2f}")
            return Signal(
                direction='long', confidence=confidence,
                stop_loss=stop_loss, take_profit=take_profit,
                reason=f"EMA9 crossed above EMA21, close ${close:.2f} > both EMAs"
            )

        # SHORT: fast crosses below slow AND close is below both EMAs
        if last['cross_down'] and close < last['ema_fast'] and close < last['ema_slow']:
            sl_distance = self.atr_sl_mult * atr
            stop_loss = close + sl_distance
            take_profit = close - sl_distance * self.rr_ratio
            confidence = min(1.0, abs(last['ema_diff']) / atr * 0.5)

            logger.info(f"SHORT signal: close={close:.2f}, EMA9={last['ema_fast']:.2f}, "
                        f"EMA21={last['ema_slow']:.2f}, SL={stop_loss:.2f}, TP={take_profit:.2f}")
            return Signal(
                direction='short', confidence=confidence,
                stop_loss=stop_loss, take_profit=take_profit,
                reason=f"EMA9 crossed below EMA21, close ${close:.2f} < both EMAs"
            )

        return Signal(direction='flat', confidence=0.0, reason='No crossover')
