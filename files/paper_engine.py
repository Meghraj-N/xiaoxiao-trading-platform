"""
paper_engine.py — simulated balance and positions, real fees, real fills.

HARD GUARD: FEE_RATE_TAKER / FEE_RATE_MAKER are intentionally None.
This is not a bug — it is a deliberate fail-loud placeholder because the
maker/taker fee percentage on Delta Exchange had CONFLICTING values across
sources checked in this session (one source: 0.02%/0.05%, another:
0.05%/0.075%). Confirm the real number at https://www.delta.exchange/fees
for your specific product type (perpetual futures fees differ from
options fees) and set the constants below before running this engine.
Running it unset raises an exception on the first trade attempt — on purpose.
"""
from dataclasses import dataclass, field
from typing import Optional

# --- UNRESOLVED — must be set by a human before trading, paper or otherwise ---
FEE_RATE_TAKER: Optional[float] = None  # e.g. 0.0005 for 0.05% — CONFIRM FIRST
FEE_RATE_MAKER: Optional[float] = None  # e.g. 0.0002 for 0.02% — CONFIRM FIRST
GST_RATE = 0.18  # 18% GST on trading fees — verified for India per third-party
                  # compliance review; re-confirm current rate periodically.

# Correction from earlier in this conversation: 1% TDS applies to SPOT crypto
# buys on Delta Exchange India, NOT to futures/options (derivatives are
# cash-settled in INR, no crypto changes hands). Source: Delta's own India
# user guide. This engine trades perpetuals, so NO TDS is deducted here.


def _require_fee_rates():
    if FEE_RATE_TAKER is None or FEE_RATE_MAKER is None:
        raise RuntimeError(
            "FEE_RATE_TAKER / FEE_RATE_MAKER are unset. Confirm the current "
            "rate at https://www.delta.exchange/fees for your product type "
            "and set them in paper_engine.py before trading — paper or live."
        )


@dataclass
class Position:
    symbol: str
    side: str  # "long" or "short"
    entry_price: float
    size: float
    entry_time: int
    fees_paid: float = 0.0


@dataclass
class PaperEngine:
    starting_balance: float
    balance: float = field(init=False)
    open_position: Optional[Position] = field(default=None, init=False)
    realized_pnl: float = field(default=0.0, init=False)

    def __post_init__(self):
        self.balance = self.starting_balance

    def _fee_and_gst(self, notional: float, is_taker: bool) -> float:
        _require_fee_rates()
        rate = FEE_RATE_TAKER if is_taker else FEE_RATE_MAKER
        fee = notional * rate
        gst = fee * GST_RATE
        return fee + gst

    def open(self, symbol: str, side: str, size: float, fill_price: float, timestamp: int) -> Position:
        """
        fill_price MUST be the real best-bid/best-ask from a live orderbook
        snapshot at decision time (see market_data.get_snapshot) — never the
        theoretical signal price. That is what makes slippage real instead
        of assumed away.
        """
        notional = size * fill_price
        cost = self._fee_and_gst(notional, is_taker=True)
        self.balance -= cost

        pos = Position(symbol=symbol, side=side, entry_price=fill_price,
                        size=size, entry_time=timestamp, fees_paid=cost)
        self.open_position = pos
        return pos

    def close(self, fill_price: float, timestamp: int) -> float:
        """
        Returns realized P&L for this close, net of entry+exit fees/GST.
        fill_price MUST again come from a real orderbook snapshot, not the
        stop-loss/target theoretical price — if the market gapped past the
        stop, this fill reflects that gap honestly.
        """
        if self.open_position is None:
            raise RuntimeError("close() called with no open position.")

        pos = self.open_position
        notional = pos.size * fill_price
        exit_cost = self._fee_and_gst(notional, is_taker=True)

        if pos.side == "long":
            gross_pnl = (fill_price - pos.entry_price) * pos.size
        else:  # short
            gross_pnl = (pos.entry_price - fill_price) * pos.size

        net_pnl = gross_pnl - exit_cost - pos.fees_paid
        self.balance += net_pnl
        self.realized_pnl += net_pnl
        self.open_position = None
        return net_pnl
