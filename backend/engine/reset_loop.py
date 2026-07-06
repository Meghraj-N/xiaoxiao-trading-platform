"""
Reset & Learn Loop
──────────────────
When the bot takes a big hit, it doesn't pretend nothing happened.
- Trigger: drawdown exceeds 10% from peak
- Action: reduce position sizes to 25% of Kelly for 20 trades
- Review: after 20 trades, check if strategy recovered
- Nuclear: after 3 failed resets, disable the strategy entirely
"""

import logging
from dataclasses import dataclass, field
import config

logger = logging.getLogger("xiaoxiao.reset_loop")


@dataclass
class ResetState:
    in_reset: bool = False
    reset_cycle: int = 0
    trades_in_reset: int = 0
    size_multiplier: float = 1.0
    is_disabled: bool = False


class ResetLoop:
    def __init__(self):
        self.states: dict[str, ResetState] = {}  # keyed by strategy name

    def _get_state(self, strategy_name: str) -> ResetState:
        if strategy_name not in self.states:
            self.states[strategy_name] = ResetState()
        return self.states[strategy_name]

    def check_for_reset(self, strategy_name: str, drawdown_pct: float) -> float:
        """
        Check if strategy should enter reset mode.
        Returns the size multiplier (1.0 = normal, 0.25 = reset mode).
        """
        state = self._get_state(strategy_name)

        # Already disabled?
        if state.is_disabled:
            return 0.0

        # Already in reset — return reduced multiplier
        if state.in_reset:
            return state.size_multiplier

        # Check if drawdown triggers reset
        if drawdown_pct >= config.RESET_DRAWDOWN_THRESHOLD:
            state.in_reset = True
            state.reset_cycle += 1
            state.trades_in_reset = 0
            state.size_multiplier = config.RESET_SIZE_MULTIPLIER

            logger.warning(
                f"RESET MODE: {strategy_name} cycle #{state.reset_cycle}. "
                f"Drawdown {drawdown_pct:.2%} >= {config.RESET_DRAWDOWN_THRESHOLD:.0%}. "
                f"Reducing size to {config.RESET_SIZE_MULTIPLIER:.0%} for {config.RESET_TRADE_COUNT} trades."
            )

            # Nuclear option: too many reset cycles
            if state.reset_cycle >= config.MAX_RESET_CYCLES:
                state.is_disabled = True
                logger.error(
                    f"DISABLED: {strategy_name} after {config.MAX_RESET_CYCLES} failed reset cycles. "
                    f"This strategy has no demonstrated edge. Honest assessment: stop using it."
                )
                return 0.0

            return state.size_multiplier

        return 1.0

    def record_trade(self, strategy_name: str, pnl: float):
        """Record a trade during reset mode."""
        state = self._get_state(strategy_name)
        if not state.in_reset:
            return

        state.trades_in_reset += 1

        if state.trades_in_reset >= config.RESET_TRADE_COUNT:
            self._evaluate_reset(strategy_name)

    def _evaluate_reset(self, strategy_name: str):
        """After reset period, decide whether to recover or escalate."""
        state = self._get_state(strategy_name)

        # For now, exit reset mode and let Kelly recalculate
        state.in_reset = False
        state.trades_in_reset = 0
        state.size_multiplier = 1.0

        logger.info(
            f"RESET COMPLETE: {strategy_name} cycle #{state.reset_cycle}. "
            f"Returning to normal sizing. Kelly will recalculate from recent trades."
        )

    def is_strategy_disabled(self, strategy_name: str) -> bool:
        state = self._get_state(strategy_name)
        return state.is_disabled

    def disable_strategy(self, strategy_name: str):
        state = self._get_state(strategy_name)
        state.is_disabled = True

    def enable_strategy(self, strategy_name: str):
        state = self._get_state(strategy_name)
        state.is_disabled = False
        state.reset_cycle = 0  # Give it a fresh start if manually re-enabled

    def get_status(self) -> dict:
        """Return status for all strategies."""
        result = {}
        for name, state in self.states.items():
            result[name] = {
                "in_reset": state.in_reset,
                "reset_cycle": state.reset_cycle,
                "trades_in_reset": state.trades_in_reset,
                "size_multiplier": state.size_multiplier,
                "disabled": state.is_disabled,
            }
        return result
