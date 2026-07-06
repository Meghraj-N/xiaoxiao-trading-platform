"""
trade_log.py — every trade AND every skipped decision cycle gets logged.

Per the honesty invariant from this conversation: silently dropping a
cycle where data was missing/stale would understate how often the system
couldn't act, which biases any later performance read. So both real
trades and skips are written to disk.
"""
import csv
import os
from datetime import datetime, timezone

TRADES_CSV = "trades.csv"
LOG_TXT = "log.txt"

_TRADE_FIELDS = [
    "timestamp_utc", "event", "symbol", "side", "size",
    "price", "fee_and_gst", "pnl", "balance_after", "note",
]


def _ensure_header():
    if not os.path.exists(TRADES_CSV):
        with open(TRADES_CSV, "w", newline="") as f:
            csv.DictWriter(f, fieldnames=_TRADE_FIELDS).writeheader()


def log_trade(event: str, symbol: str = "", side: str = "", size: float = 0.0,
              price: float = 0.0, fee_and_gst: float = 0.0, pnl: float = 0.0,
              balance_after: float = 0.0, note: str = ""):
    _ensure_header()
    row = {
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "event": event,
        "symbol": symbol,
        "side": side,
        "size": size,
        "price": price,
        "fee_and_gst": fee_and_gst,
        "pnl": pnl,
        "balance_after": balance_after,
        "note": note,
    }
    with open(TRADES_CSV, "a", newline="") as f:
        csv.DictWriter(f, fieldnames=_TRADE_FIELDS).writerow(row)


def log_line(message: str):
    ts = datetime.now(timezone.utc).isoformat()
    line = f"[{ts}] {message}"
    print(line)
    with open(LOG_TXT, "a") as f:
        f.write(line + "\n")
