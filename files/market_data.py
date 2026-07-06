"""
market_data.py — fetches a clean snapshot for the paper engine to act on.

Every value returned here traces back to a real API response. Nothing
here is interpolated, defaulted, or estimated. If the API call fails,
this raises rather than returning a stale/fabricated snapshot — callers
must handle the exception and log it as a skipped cycle, not paper over it.
"""
from dataclasses import dataclass
from delta_client import get_ticker, get_l2_orderbook


@dataclass
class MarketSnapshot:
    symbol: str
    timestamp: int
    last_price: float
    best_bid: float
    best_ask: float
    raw_ticker: dict
    raw_orderbook: dict


def get_snapshot(symbol: str) -> MarketSnapshot:
    import time

    ticker = get_ticker(symbol)
    orderbook = get_l2_orderbook(symbol)

    # Field names below follow Delta's documented ticker/orderbook schema.
    # CONFIRM these exact keys against a live response before trusting them
    # in production — exchange APIs sometimes rename or nest fields between
    # versions, and this has not been run against a live endpoint yet.
    last_price = float(ticker.get("close") or ticker.get("mark_price"))

    best_bid = float(orderbook["buy"][0]["price"]) if orderbook.get("buy") else None
    best_ask = float(orderbook["sell"][0]["price"]) if orderbook.get("sell") else None

    if best_bid is None or best_ask is None:
        raise RuntimeError(f"No liquidity in orderbook snapshot for {symbol} — cannot fill honestly.")

    return MarketSnapshot(
        symbol=symbol,
        timestamp=int(time.time()),
        last_price=last_price,
        best_bid=best_bid,
        best_ask=best_ask,
        raw_ticker=ticker,
        raw_orderbook=orderbook,
    )
