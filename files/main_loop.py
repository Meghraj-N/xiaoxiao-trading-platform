"""
main_loop.py — polls live market data on an interval and drives the
paper engine through the placeholder decide() function.

decide() ALWAYS returns "HOLD" in Phase 1. Phase 2 replaces the body of
this single function with real strategy logic — nothing else in this
file should need to change when that happens.
"""
import time
import pandas as pd

from market_data import get_snapshot
from paper_engine import PaperEngine
from trade_log import log_trade, log_line

SYMBOL = "BTCUSD"  # CONFIRM this matches an actual live Delta product symbol
POLL_SECONDS = 60
STARTING_BALANCE = 100_000.0  # paper INR/USD units — arbitrary for Phase 1


def decide(candle_history: "pd.DataFrame | None") -> str:
    """Phase 1 placeholder — always HOLD. Phase 2 replaces this body only."""
    return "HOLD"


def run(iterations: int | None = None):
    engine = PaperEngine(starting_balance=STARTING_BALANCE)
    log_line(f"Starting paper engine with balance {STARTING_BALANCE}")

    count = 0
    while iterations is None or count < iterations:
        try:
            snapshot = get_snapshot(SYMBOL)
        except Exception as exc:
            # Honest failure: log it as skipped, do NOT fabricate a price.
            log_trade(event="SKIPPED_NO_DATA", note=str(exc))
            log_line(f"Skipped cycle — data fetch failed: {exc}")
            time.sleep(POLL_SECONDS)
            count += 1
            continue

        signal = decide(None)  # Phase 2 will pass real candle history in
        log_line(f"{snapshot.symbol} last={snapshot.last_price} "
                  f"bid={snapshot.best_bid} ask={snapshot.best_ask} signal={signal}")

        if signal == "HOLD":
            log_trade(event="HOLD", symbol=snapshot.symbol,
                       price=snapshot.last_price, balance_after=engine.balance)
        # BUY/SELL handling intentionally not implemented — Phase 2.

        time.sleep(POLL_SECONDS)
        count += 1


if __name__ == "__main__":
    run()
