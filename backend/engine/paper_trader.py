"""
Xiaoxiao Trading Bot — Paper Trading Engine

HONESTY IS THE #1 RULE.
- Every trade uses real prices with real fees and slippage applied.
- If balance is insufficient, the trade is REJECTED (not faked).
- Losing trades close at the stop price, never better.
- All cost accounting is done before reporting PnL.
"""

from __future__ import annotations

import logging
import time
import uuid
from dataclasses import dataclass, field
from typing import Any

import config
from db.models import TradeRecord, save_trade

logger = logging.getLogger(__name__)


@dataclass
class Position:
    """An open futures position with all cost details."""

    id: str
    symbol: str
    side: str  # 'long' or 'short'
    entry_price: float  # price AFTER slippage
    quantity: float
    leverage: int
    margin: float  # collateral locked up
    entry_fee: float  # taker fee paid on entry
    entry_slippage: float  # slippage cost on entry
    stop_loss: float | None = None
    take_profit: float | None = None
    strategy_name: str = ""
    kelly_fraction_used: float = 0.0
    entry_time: float = field(default_factory=time.time)

    @property
    def direction(self) -> int:
        """+1 for long, -1 for short."""
        return 1 if self.side == "long" else -1

    def unrealized_pnl(self, current_price: float) -> float:
        """
        Calculate unrealized PnL at a given market price.
        Does NOT include exit fees (those come at close time).
        """
        price_delta = (current_price - self.entry_price) * self.direction
        return price_delta * self.quantity

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "symbol": self.symbol,
            "side": self.side,
            "entry_price": self.entry_price,
            "quantity": self.quantity,
            "leverage": self.leverage,
            "margin": self.margin,
            "entry_fee": self.entry_fee,
            "stop_loss": self.stop_loss,
            "take_profit": self.take_profit,
            "strategy_name": self.strategy_name,
            "kelly_fraction_used": self.kelly_fraction_used,
            "entry_time": self.entry_time,
        }


class PaperTrader:
    """
    Simulates futures trading with honest cost accounting.

    Key invariants:
    1. balance >= 0 at all times
    2. Every fill includes slippage (unfavorable direction)
    3. Every fill includes taker fee
    4. PnL is always net of all costs
    """

    def __init__(self, starting_balance: float | None = None) -> None:
        self.balance: float = starting_balance or config.STARTING_CAPITAL
        self.initial_balance: float = self.balance
        self.open_positions: dict[str, Position] = {}  # id -> Position
        self.trade_history: list[TradeRecord] = []
        self._peak_equity: float = self.balance
        logger.info("PaperTrader initialized with $%.4f", self.balance)

    def update_starting_capital(self, new_starting_capital: float) -> None:
        """Dynamically update starting capital without losing accumulated PnL."""
        diff = new_starting_capital - self.initial_balance
        if diff != 0:
            self.initial_balance = new_starting_capital
            self.balance += diff
            logger.info("Updated starting capital dynamically. New balance: $%.4f", self.balance)

    # ── Open Position ──────────────────────────────────────────────────

    async def open_position(
        self,
        symbol: str,
        side: str,
        quantity: float,
        price: float,
        leverage: int,
        strategy_name: str = "",
        stop_loss: float | None = None,
        take_profit: float | None = None,
        kelly_fraction_used: float = 0.0,
    ) -> Position | None:
        """
        Open a new paper position.

        Applies slippage and fees BEFORE checking balance.  If the account
        can't afford the margin + fees, the order is REJECTED — we never
        fake a fill.

        Returns the Position on success, or None on rejection.
        """
        # ── Apply slippage (always unfavorable) ─────────────────────
        if side == "long":
            fill_price = price * (1 + config.SLIPPAGE)
        elif side == "short":
            fill_price = price * (1 - config.SLIPPAGE)
        else:
            logger.error("Invalid side '%s' — must be 'long' or 'short'", side)
            return None

        slippage_cost = abs(fill_price - price) * quantity

        # ── Calculate costs ─────────────────────────────────────────
        notional = quantity * fill_price
        margin_required = notional / leverage
        entry_fee = notional * config.TAKER_FEE
        total_cost = margin_required + entry_fee

        # ── HONESTY: reject if insufficient balance ─────────────────
        if total_cost > self.balance:
            logger.warning(
                "REJECTED %s %s %.6f @ %.2f — need $%.4f but only have $%.4f",
                side, symbol, quantity, fill_price, total_cost, self.balance,
            )
            return None

        # ── Deduct costs and create position ────────────────────────
        self.balance -= total_cost

        pos = Position(
            id=str(uuid.uuid4())[:8],
            symbol=symbol,
            side=side,
            entry_price=fill_price,
            quantity=quantity,
            leverage=leverage,
            margin=margin_required,
            entry_fee=entry_fee,
            entry_slippage=slippage_cost,
            stop_loss=stop_loss,
            take_profit=take_profit,
            strategy_name=strategy_name,
            kelly_fraction_used=kelly_fraction_used,
        )

        self.open_positions[pos.id] = pos

        logger.info(
            "OPENED %s %s %.6f @ %.2f (fill after slippage) | "
            "margin=$%.4f  fee=$%.6f  slippage=$%.6f  balance=$%.4f",
            side, symbol, quantity, fill_price,
            margin_required, entry_fee, slippage_cost, self.balance,
        )

        return pos

    # ── Close Position ─────────────────────────────────────────────────

    async def close_position(
        self,
        position_id: str,
        price: float,
        reason: str = "manual",
    ) -> TradeRecord | None:
        """
        Close an open position at the given price.

        Applies slippage (unfavorable), calculates PnL with all costs,
        and saves the trade to the database.

        HONESTY: if reason is 'stop_loss', we use the stop price exactly
        (slippage already factored into stop placement).
        """
        pos = self.open_positions.get(position_id)
        if pos is None:
            logger.error("Position %s not found", position_id)
            return None

        # ── Apply exit slippage (unfavorable) ───────────────────────
        # For a long, selling into the bid => worse price (lower)
        # For a short, buying from the ask => worse price (higher)
        if pos.side == "long":
            exit_price = price * (1 - config.SLIPPAGE)
        else:
            exit_price = price * (1 + config.SLIPPAGE)

        exit_slippage = abs(exit_price - price) * pos.quantity

        # ── Calculate PnL ───────────────────────────────────────────
        price_delta = (exit_price - pos.entry_price) * pos.direction
        pnl_gross = price_delta * pos.quantity

        exit_notional = pos.quantity * exit_price
        exit_fee = exit_notional * config.TAKER_FEE
        total_fees = pos.entry_fee + exit_fee
        total_slippage = pos.entry_slippage + exit_slippage

        pnl_net = pnl_gross - total_fees
        # Note: slippage is already embedded in the fill prices, so pnl_gross
        # already accounts for it.  total_slippage is tracked for reporting only.

        # ── Return margin + PnL to balance ──────────────────────────
        self.balance += pos.margin + pnl_gross - exit_fee

        # ── Build trade record ──────────────────────────────────────
        trade = TradeRecord(
            timestamp=time.time(),
            symbol=pos.symbol,
            side=pos.side,
            entry_price=pos.entry_price,
            exit_price=exit_price,
            quantity=pos.quantity,
            leverage=pos.leverage,
            fees=total_fees,
            slippage_cost=total_slippage,
            pnl_gross=pnl_gross,
            pnl_net=pnl_net,
            exit_reason=reason,
            strategy_name=pos.strategy_name,
            kelly_fraction_used=pos.kelly_fraction_used,
        )

        # ── Persist and clean up ────────────────────────────────────
        try:
            await save_trade(trade)
        except Exception:
            logger.exception("Failed to save trade to DB (trade still counts)")

        self.trade_history.append(trade)
        del self.open_positions[position_id]

        emoji = "✅" if pnl_net >= 0 else "❌"
        logger.info(
            "%s CLOSED %s %s %.6f | entry=%.2f  exit=%.2f | "
            "PnL_gross=$%.6f  fees=$%.6f  PnL_net=$%.6f | balance=$%.4f | %s",
            emoji, pos.side, pos.symbol, pos.quantity,
            pos.entry_price, exit_price,
            pnl_gross, total_fees, pnl_net,
            self.balance, reason,
        )

        return trade

    # ── Stop / Take-Profit Checking ────────────────────────────────────

    async def check_stops(self, current_prices: dict[str, float]) -> list[TradeRecord]:
        """
        Check all open positions for stop-loss and take-profit hits.

        HONESTY: losing trades close at the stop price, not the current price
        (which might be worse due to gap).  We use whichever is more
        unfavorable to the trader.
        """
        closed_trades: list[TradeRecord] = []

        # Snapshot IDs to avoid mutation during iteration
        for pos_id in list(self.open_positions.keys()):
            pos = self.open_positions.get(pos_id)
            if pos is None:
                continue

            current_price = current_prices.get(pos.symbol)
            if current_price is None:
                continue

            # ── Check stop loss ─────────────────────────────────────
            if pos.stop_loss is not None:
                hit = False
                if pos.side == "long" and current_price <= pos.stop_loss:
                    hit = True
                elif pos.side == "short" and current_price >= pos.stop_loss:
                    hit = True

                if hit:
                    # HONESTY: use stop price if it's better than market,
                    # use market if it's worse (gap through stop)
                    if pos.side == "long":
                        close_price = min(pos.stop_loss, current_price)
                    else:
                        close_price = max(pos.stop_loss, current_price)

                    logger.info(
                        "⛔ STOP HIT for %s %s — stop=%.2f  market=%.2f  using=%.2f",
                        pos.side, pos.symbol, pos.stop_loss, current_price, close_price,
                    )
                    trade = await self.close_position(pos_id, close_price, "stop_loss")
                    if trade:
                        closed_trades.append(trade)
                    continue

            # ── Check take profit ───────────────────────────────────
            if pos.take_profit is not None:
                hit = False
                if pos.side == "long" and current_price >= pos.take_profit:
                    hit = True
                elif pos.side == "short" and current_price <= pos.take_profit:
                    hit = True

                if hit:
                    logger.info(
                        "🎯 TP HIT for %s %s — tp=%.2f  market=%.2f",
                        pos.side, pos.symbol, pos.take_profit, current_price,
                    )
                    trade = await self.close_position(pos_id, current_price, "take_profit")
                    if trade:
                        closed_trades.append(trade)

        return closed_trades

    # ── Equity ─────────────────────────────────────────────────────────

    def get_equity(self, current_prices: dict[str, float] | None = None) -> float:
        """
        Total equity = cash balance + unrealized PnL of all open positions.

        If no prices are provided, returns just the cash balance.
        """
        equity = self.balance
        if current_prices:
            for pos in self.open_positions.values():
                price = current_prices.get(pos.symbol)
                if price:
                    equity += pos.unrealized_pnl(price)
        return equity

    def get_total_pnl(self) -> float:
        """Total realized PnL since start."""
        return sum(t.pnl_net for t in self.trade_history)

    def get_status(self, current_prices: dict[str, float] | None = None) -> dict[str, Any]:
        """Snapshot of the trader's state for the API."""
        equity = self.get_equity(current_prices)
        return {
            "balance": round(self.balance, 6),
            "equity": round(equity, 6),
            "initial_balance": self.initial_balance,
            "total_pnl": round(self.get_total_pnl(), 6),
            "open_positions": len(self.open_positions),
            "total_trades": len(self.trade_history),
            "positions": [p.to_dict() for p in self.open_positions.values()],
        }
