"""
Risk Manager — Drawdown Guard & Daily Loss Limit
─────────────────────────────────────────────────
Protects the $3 account from total ruin.
- Pauses trading if drawdown exceeds 15%
- Stops trading for the day if daily loss exceeds 3%
- Limits max open positions to 2
"""

import logging
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, field
import config

logger = logging.getLogger("xiaoxiao.risk_manager")


@dataclass
class RiskStatus:
    trading_allowed: bool
    drawdown_pct: float
    daily_loss_pct: float
    open_positions: int
    max_positions: int
    peak_equity: float
    pause_reason: str = ""
    pause_until: datetime | None = None


class RiskManager:
    def __init__(self, starting_equity: float = config.STARTING_CAPITAL):
        self.peak_equity = starting_equity
        self.current_equity = starting_equity
        self.daily_losses: list[float] = []
        self.daily_reset_date: str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        self.pause_until: datetime | None = None
        self.open_position_count = 0

    def track_equity(self, equity: float) -> float:
        """Update equity tracking. Returns current drawdown percentage."""
        self.current_equity = equity
        if equity > self.peak_equity:
            self.peak_equity = equity

        drawdown = (self.peak_equity - equity) / self.peak_equity if self.peak_equity > 0 else 0
        return drawdown

    def record_loss(self, loss_amount: float):
        """Record a realized loss for daily tracking."""
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        if today != self.daily_reset_date:
            self.daily_losses = []
            self.daily_reset_date = today

        if loss_amount < 0:
            self.daily_losses.append(abs(loss_amount))

    def get_daily_loss_pct(self) -> float:
        """Total daily losses as percentage of peak equity."""
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        if today != self.daily_reset_date:
            return 0.0
        total_loss = sum(self.daily_losses)
        return total_loss / self.peak_equity if self.peak_equity > 0 else 0.0

    def update_positions(self, count: int):
        """Update the current open position count."""
        self.open_position_count = count

    def is_trading_allowed(self) -> RiskStatus:
        """
        Check all risk gates. Returns detailed status.
        HONESTY: When trading is blocked, we say exactly why.
        """
        drawdown = self.track_equity(self.current_equity)
        daily_loss = self.get_daily_loss_pct()
        now = datetime.now(timezone.utc)

        # Check pause timer
        if self.pause_until and now < self.pause_until:
            remaining = (self.pause_until - now).total_seconds() / 60
            return RiskStatus(
                trading_allowed=False, drawdown_pct=drawdown,
                daily_loss_pct=daily_loss, open_positions=self.open_position_count,
                max_positions=config.MAX_OPEN_POSITIONS,
                peak_equity=self.peak_equity,
                pause_reason=f"Drawdown pause — {remaining:.0f} min remaining",
                pause_until=self.pause_until,
            )

        # Check max drawdown
        if drawdown >= config.MAX_DRAWDOWN_PCT:
            self.pause_until = now + timedelta(hours=1)
            logger.warning(f"RISK: Drawdown {drawdown:.2%} >= {config.MAX_DRAWDOWN_PCT:.0%}. "
                           f"Pausing for 1 hour.")
            return RiskStatus(
                trading_allowed=False, drawdown_pct=drawdown,
                daily_loss_pct=daily_loss, open_positions=self.open_position_count,
                max_positions=config.MAX_OPEN_POSITIONS,
                peak_equity=self.peak_equity,
                pause_reason=f"Drawdown {drawdown:.2%} hit {config.MAX_DRAWDOWN_PCT:.0%} limit",
                pause_until=self.pause_until,
            )

        # Check daily loss limit
        if daily_loss >= config.DAILY_LOSS_LIMIT_PCT:
            logger.warning(f"RISK: Daily loss {daily_loss:.2%} >= {config.DAILY_LOSS_LIMIT_PCT:.0%}. "
                           f"No more trades today.")
            return RiskStatus(
                trading_allowed=False, drawdown_pct=drawdown,
                daily_loss_pct=daily_loss, open_positions=self.open_position_count,
                max_positions=config.MAX_OPEN_POSITIONS,
                peak_equity=self.peak_equity,
                pause_reason=f"Daily loss limit {config.DAILY_LOSS_LIMIT_PCT:.0%} reached",
            )

        # Check max positions
        if self.open_position_count >= config.MAX_OPEN_POSITIONS:
            return RiskStatus(
                trading_allowed=False, drawdown_pct=drawdown,
                daily_loss_pct=daily_loss, open_positions=self.open_position_count,
                max_positions=config.MAX_OPEN_POSITIONS,
                peak_equity=self.peak_equity,
                pause_reason=f"Max positions ({config.MAX_OPEN_POSITIONS}) reached",
            )

        # All clear
        return RiskStatus(
            trading_allowed=True, drawdown_pct=drawdown,
            daily_loss_pct=daily_loss, open_positions=self.open_position_count,
            max_positions=config.MAX_OPEN_POSITIONS,
            peak_equity=self.peak_equity,
        )

    def get_risk_dict(self) -> dict:
        """Return risk status as a JSON-friendly dict for the API."""
        status = self.is_trading_allowed()
        return {
            "trading_allowed": status.trading_allowed,
            "drawdown_pct": round(status.drawdown_pct, 4),
            "daily_loss_pct": round(status.daily_loss_pct, 4),
            "open_positions": status.open_positions,
            "max_positions": status.max_positions,
            "peak_equity": round(status.peak_equity, 4),
            "pause_reason": status.pause_reason,
        }
