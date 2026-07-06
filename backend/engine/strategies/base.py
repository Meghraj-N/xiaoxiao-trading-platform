"""
Xiaoxiao Trading Bot — Abstract Strategy Base

Every strategy must inherit from BaseStrategy and implement
`generate_signal()`.  This ensures a consistent interface for the
trading loop and backtester.
"""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field

import pandas as pd

logger = logging.getLogger(__name__)


@dataclass
class Signal:
    """
    A trading signal produced by a strategy.

    Attributes:
        direction:  'long', 'short', or 'flat' (no trade)
        confidence: 0.0 – 1.0 how confident the strategy is
        stop_loss:  absolute price for stop-loss
        take_profit: absolute price for take-profit
        reason:     human-readable explanation for logging/debug
    """

    direction: str  # 'long', 'short', 'flat'
    confidence: float = 0.0
    stop_loss: float | None = None
    take_profit: float | None = None
    reason: str = ""

    @property
    def is_trade(self) -> bool:
        """Returns True if this signal calls for entering a position."""
        return self.direction in ("long", "short")

    def __repr__(self) -> str:
        return (
            f"Signal({self.direction}, conf={self.confidence:.2f}, "
            f"SL={self.stop_loss}, TP={self.take_profit}, reason='{self.reason}')"
        )


class BaseStrategy(ABC):
    """
    Abstract base for all trading strategies.

    Subclasses must implement:
    - `name` property
    - `generate_signal(df)` method

    The `calculate_indicators(df)` hook is optional — override it to
    add custom columns to the DataFrame before signal generation.
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """Unique identifier for this strategy."""
        ...

    @abstractmethod
    def generate_signal(self, df: pd.DataFrame) -> Signal:
        """
        Analyze the DataFrame and produce a trading signal.

        Args:
            df: OHLCV DataFrame with columns [timestamp, open, high, low, close, volume]
                plus any indicators added by `calculate_indicators()`.

        Returns:
            A Signal instance.  Return Signal('flat') when there's no trade.
        """
        ...

    def calculate_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Add technical indicators to the DataFrame.

        Override this in subclasses.  The default implementation returns
        the DataFrame unchanged.

        Args:
            df: Raw OHLCV DataFrame.

        Returns:
            DataFrame with indicator columns added.
        """
        return df

    def is_valid_signal(
        self,
        signal: Signal,
        current_positions: list[dict],
    ) -> bool:
        """
        Filter out duplicate or conflicting signals.

        Rules:
        1. Don't open a long if we already have a long on the same symbol.
        2. Don't open a short if we already have a short on the same symbol.
        3. Signal confidence must be > 0.

        Args:
            signal: The candidate signal.
            current_positions: List of position dicts with 'side' and 'strategy_name'.

        Returns:
            True if the signal should be acted on.
        """
        if not signal.is_trade:
            return False

        if signal.confidence <= 0:
            logger.debug("Signal rejected — zero confidence")
            return False

        # Check for duplicate positions from this strategy
        for pos in current_positions:
            if pos.get("strategy_name") == self.name and pos.get("side") == signal.direction:
                logger.debug(
                    "Signal rejected — already have a %s position from %s",
                    signal.direction, self.name,
                )
                return False

        return True

    def __repr__(self) -> str:
        return f"<Strategy: {self.name}>"
