"""
Fractional Kelly Criterion Position Sizer
──────────────────────────────────────────
Formula: f* = W - (1-W)/R  then  position_risk = KELLY_FRACTION * f*
Where W = win rate, R = avg_win / avg_loss

Uses Half-Kelly (0.5 × f*) by default — retains ~75% of growth
potential while halving volatility.

Source: kraken.com, avatrade.com — verified June 2026
"""

import logging
from dataclasses import dataclass
import config

logger = logging.getLogger("xiaoxiao.position_sizer")


@dataclass
class SizeResult:
    quantity: float
    risk_amount: float
    kelly_fraction: float
    margin_required: float
    reason: str


class PositionSizer:
    def __init__(self):
        self.kelly_fraction = config.KELLY_FRACTION
        self.min_risk = config.MIN_RISK_PCT
        self.max_risk = config.MAX_RISK_PCT
        self.min_trades = config.KELLY_MIN_TRADES

    def calculate_kelly(self, win_rate: float, avg_win: float, avg_loss: float) -> float:
        """
        Full Kelly: f* = W - (1-W)/R
        Returns the raw Kelly fraction (can be negative if no edge).
        """
        if avg_loss <= 0 or win_rate <= 0:
            return 0.0

        r = avg_win / avg_loss  # win/loss ratio
        f_star = win_rate - (1 - win_rate) / r

        # Apply fractional Kelly
        fraction = self.kelly_fraction * f_star

        # Clamp to bounds
        if fraction <= 0:
            logger.warning(f"Kelly is negative ({f_star:.4f}) — no edge detected. "
                           f"Using minimum risk {self.min_risk:.2%}")
            return self.min_risk

        fraction = max(self.min_risk, min(self.max_risk, fraction))

        logger.info(f"Kelly: W={win_rate:.2%}, R={r:.2f}, f*={f_star:.4f}, "
                    f"half-kelly={fraction:.4f}")
        return fraction

    def calculate_position_size(
        self,
        balance: float,
        entry_price: float,
        stop_loss: float,
        leverage: int,
        trade_count: int,
        win_rate: float = 0.0,
        avg_win: float = 0.0,
        avg_loss: float = 0.0,
        reset_multiplier: float = 1.0,
    ) -> SizeResult:
        """
        Calculate position size based on Kelly criterion or default risk.
        
        HONESTY: If not enough trades for Kelly, uses fixed 1% risk.
        Never risks more than MAX_RISK_PCT per trade.
        """
        # Determine risk fraction
        if trade_count >= self.min_trades and avg_loss > 0:
            kelly = self.calculate_kelly(win_rate, avg_win, avg_loss)
            reason = f"Kelly ({self.kelly_fraction}× f*)"
        else:
            kelly = self.min_risk
            reason = f"Fixed {self.min_risk:.0%} (need {self.min_trades - trade_count} more trades for Kelly)"

        # Apply reset multiplier if in reset mode
        kelly *= reset_multiplier
        if reset_multiplier < 1.0:
            reason += f" × {reset_multiplier:.0%} reset"

        # Risk amount in USD
        risk_amount = balance * kelly

        # Position size from risk and stop distance
        price_distance = abs(entry_price - stop_loss)
        if price_distance <= 0:
            return SizeResult(0, 0, kelly, 0, "Stop loss too close to entry")

        # quantity such that (quantity × price_distance) = risk_amount
        quantity = risk_amount / price_distance

        # Margin check: margin = (quantity × entry_price) / leverage
        margin_required = (quantity * entry_price) / leverage

        # If margin exceeds balance, reduce quantity
        max_margin = balance * 0.9  # Keep 10% reserve
        if margin_required > max_margin:
            quantity = (max_margin * leverage) / entry_price
            margin_required = max_margin
            reason += " (margin-capped)"

        logger.info(f"Size: qty={quantity:.6f}, risk=${risk_amount:.4f}, "
                    f"margin=${margin_required:.4f}, kelly={kelly:.4f}")

        return SizeResult(
            quantity=quantity,
            risk_amount=risk_amount,
            kelly_fraction=kelly,
            margin_required=margin_required,
            reason=reason,
        )
