"""
RSI Mean Reversion Strategy
────────────────────────────
RSI(14) oversold/overbought with volume confirmation.
- Long: RSI < 30 and turning up, volume > 1.5× avg
- Short: RSI > 70 and turning down, volume > 1.5× avg
- Stop: swing low/high of last 10 bars + ATR buffer
- TP: RSI reaching 50 (mean)
"""

import pandas as pd
import numpy as np
from .base import BaseStrategy, Signal

import logging
logger = logging.getLogger("xiaoxiao.strategy.rsi_revert")


class RSIRevertStrategy(BaseStrategy):
    name = "RSI Revert"

    def __init__(self, rsi_period: int = 14, oversold: float = 30.0, overbought: float = 70.0,
                 vol_mult: float = 1.5, vol_period: int = 20, swing_lookback: int = 10,
                 atr_period: int = 14):
        self.rsi_period = rsi_period
        self.oversold = oversold
        self.overbought = overbought
        self.vol_mult = vol_mult
        self.vol_period = vol_period
        self.swing_lookback = swing_lookback
        self.atr_period = atr_period

    def _calc_rsi(self, series: pd.Series, period: int) -> pd.Series:
        delta = series.diff()
        gain = delta.where(delta > 0, 0.0).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0.0)).rolling(window=period).mean()
        rs = gain / loss.replace(0, np.nan)
        return 100 - (100 / (1 + rs))

    def calculate_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        df['rsi'] = self._calc_rsi(df['close'], self.rsi_period)
        df['rsi_prev'] = df['rsi'].shift(1)
        df['vol_avg'] = df['volume'].rolling(window=self.vol_period).mean()
        df['vol_confirmed'] = df['volume'] > (self.vol_mult * df['vol_avg'])

        # ATR
        high_low = df['high'] - df['low']
        high_close = (df['high'] - df['close'].shift()).abs()
        low_close = (df['low'] - df['close'].shift()).abs()
        true_range = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
        df['atr'] = true_range.rolling(window=self.atr_period).mean()

        # Swing highs/lows
        df['swing_low'] = df['low'].rolling(window=self.swing_lookback).min()
        df['swing_high'] = df['high'].rolling(window=self.swing_lookback).max()

        return df

    def generate_signal(self, df: pd.DataFrame) -> Signal:
        df = self.calculate_indicators(df)

        if len(df) < max(self.rsi_period, self.vol_period) + 5:
            return Signal(direction='flat', confidence=0.0, reason='Not enough data')

        last = df.iloc[-1]
        rsi = last['rsi']
        rsi_prev = last['rsi_prev']
        atr = last['atr']
        close = last['close']

        if pd.isna(rsi) or pd.isna(atr) or atr <= 0:
            return Signal(direction='flat', confidence=0.0, reason='Indicators unavailable')

        # LONG: RSI < 30, turning up, volume confirmed
        if rsi < self.oversold and rsi > rsi_prev and last['vol_confirmed']:
            stop_loss = last['swing_low'] - atr * 0.5
            # TP when RSI should reach 50 — estimate price move
            rsi_distance_to_mean = 50 - rsi
            price_per_rsi = atr / 10  # rough estimate
            take_profit = close + rsi_distance_to_mean * price_per_rsi

            confidence = min(1.0, (self.oversold - rsi) / 20)
            logger.info(f"LONG signal: RSI={rsi:.1f} (turning up), vol confirmed, SL={stop_loss:.2f}")
            return Signal(
                direction='long', confidence=confidence,
                stop_loss=stop_loss, take_profit=take_profit,
                reason=f"RSI {rsi:.1f} oversold & turning up, volume {last['volume']:.0f} > avg"
            )

        # SHORT: RSI > 70, turning down, volume confirmed
        if rsi > self.overbought and rsi < rsi_prev and last['vol_confirmed']:
            stop_loss = last['swing_high'] + atr * 0.5
            rsi_distance_to_mean = rsi - 50
            price_per_rsi = atr / 10
            take_profit = close - rsi_distance_to_mean * price_per_rsi

            confidence = min(1.0, (rsi - self.overbought) / 20)
            logger.info(f"SHORT signal: RSI={rsi:.1f} (turning down), vol confirmed, SL={stop_loss:.2f}")
            return Signal(
                direction='short', confidence=confidence,
                stop_loss=stop_loss, take_profit=take_profit,
                reason=f"RSI {rsi:.1f} overbought & turning down, volume {last['volume']:.0f} > avg"
            )

        return Signal(direction='flat', confidence=0.0, reason=f'RSI={rsi:.1f}, no signal')
