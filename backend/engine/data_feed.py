"""
Xiaoxiao Trading Bot — Live Data Feed

Connects to Delta Exchange via CCXT for price data.
Uses polling (not websockets) for simplicity and reliability.
Every price fetch is logged so we can audit the data trail.
"""

from __future__ import annotations

import asyncio
import logging
import time
from typing import Any, Callable, Coroutine

import ccxt.async_support as ccxt

import config

logger = logging.getLogger(__name__)


class DataFeed:
    """
    Async price data provider backed by Delta Exchange through CCXT.

    All methods retry on transient network errors up to `max_retries` times
    with exponential backoff.  We never silently swallow an error — if we
    can't get data after retries, we raise so the caller can decide.
    """

    def __init__(self, max_retries: int = 3, retry_delay: float = 2.0) -> None:
        self._exchange: ccxt.Exchange | None = None
        self._max_retries = max_retries
        self._retry_delay = retry_delay
        self._streaming = False
        self._stream_task: asyncio.Task | None = None

    # ── Lifecycle ──────────────────────────────────────────────────────

    async def initialize(self) -> None:
        """Create the CCXT exchange instance and load markets."""
        exchange_config: dict[str, Any] = {
            "enableRateLimit": True,
        }

        # Add API keys if available (needed for private endpoints)
        if config.DELTA_API_KEY and config.DELTA_API_SECRET:
            exchange_config["apiKey"] = config.DELTA_API_KEY
            exchange_config["secret"] = config.DELTA_API_SECRET

        if config.USE_TESTNET:
            exchange_config["sandbox"] = True
            logger.info("Using Delta Exchange TESTNET")

        try:
            # Try to create a Delta Exchange instance
            exchange_class = getattr(ccxt, config.EXCHANGE_ID, None)
            if exchange_class is None:
                # Fallback: some ccxt versions use 'delta' or other names
                logger.warning(
                    "Exchange '%s' not found in ccxt, trying 'delta'",
                    config.EXCHANGE_ID,
                )
                exchange_class = getattr(ccxt, "delta", None)

            if exchange_class is None:
                raise RuntimeError(
                    f"Neither '{config.EXCHANGE_ID}' nor 'delta' found in ccxt. "
                    f"Available exchanges: {', '.join(ccxt.exchanges[:10])}..."
                )

            self._exchange = exchange_class(exchange_config)
            try:
                await self._exchange.load_markets()
                logger.info(
                    "DataFeed initialized — %d markets loaded from %s",
                    len(self._exchange.markets),
                    self._exchange.id,
                )
            except Exception as e:
                logger.warning("DataFeed CCXT failed to load markets: %s", e)
        except Exception:
            logger.exception("Failed to initialize DataFeed")
            raise

    async def close(self) -> None:
        """Clean up the exchange connection."""
        self.stop_price_stream()
        if self._exchange:
            await self._exchange.close()
            self._exchange = None
            logger.info("DataFeed closed")

    @property
    def exchange(self) -> ccxt.Exchange:
        if self._exchange is None:
            raise RuntimeError("DataFeed not initialized — call initialize() first")
        return self._exchange

    # ── Retry Wrapper ──────────────────────────────────────────────────

    async def _with_retry(self, coro_factory: Callable[[], Coroutine], label: str) -> Any:
        """
        Execute an async operation with retries and exponential backoff.
        `coro_factory` is a zero-arg callable that returns a fresh coroutine
        each time (so we can retry without reusing an exhausted awaitable).
        """
        last_err: Exception | None = None
        for attempt in range(1, self._max_retries + 1):
            try:
                return await coro_factory()
            except (ccxt.NetworkError, ccxt.ExchangeNotAvailable, ccxt.RequestTimeout) as exc:
                last_err = exc
                wait = self._retry_delay * (2 ** (attempt - 1))
                logger.warning(
                    "%s attempt %d/%d failed (%s), retrying in %.1fs",
                    label, attempt, self._max_retries, exc, wait,
                )
                await asyncio.sleep(wait)
            except ccxt.ExchangeError as exc:
                # Exchange errors (bad symbol, auth fail) won't fix on retry
                logger.error("%s exchange error (no retry): %s", label, exc)
                raise

        # All retries exhausted
        logger.error("%s failed after %d retries", label, self._max_retries)
        raise last_err  # type: ignore[misc]

    # ── Public Data Methods ────────────────────────────────────────────

    async def fetch_ohlcv(
        self,
        symbol: str,
        timeframe: str = "1h",
        limit: int = 200,
    ) -> list[list[float]]:
        """
        Fetch historical OHLCV candles.

        Returns list of [timestamp, open, high, low, close, volume].
        Each price is a real number from the exchange — no fabrication.
        """
        result = await self._with_retry(
            lambda: self.exchange.fetch_ohlcv(symbol, timeframe, limit=limit),
            f"fetch_ohlcv({symbol}, {timeframe})",
        )
        logger.info(
            "Fetched %d candles for %s/%s — latest close: %.2f",
            len(result), symbol, timeframe,
            result[-1][4] if result else 0.0,
        )
        return result

    async def fetch_ticker(self, symbol: str) -> dict[str, Any]:
        """
        Fetch current ticker data (last price, bid, ask, volume).

        The returned dict follows CCXT's unified ticker format.
        """
        ticker = await self._with_retry(
            lambda: self.exchange.fetch_ticker(symbol),
            f"fetch_ticker({symbol})",
        )
        logger.info(
            "Ticker %s — last: %.2f  bid: %.2f  ask: %.2f",
            symbol,
            ticker.get("last", 0),
            ticker.get("bid", 0),
            ticker.get("ask", 0),
        )
        return ticker

    async def fetch_order_book(self, symbol: str, limit: int = 10) -> dict[str, Any]:
        """
        Fetch the order book for slippage estimation.

        Returns {'bids': [[price, amount], ...], 'asks': [[price, amount], ...]}.
        We use top-of-book to model realistic fill prices.
        """
        book = await self._with_retry(
            lambda: self.exchange.fetch_order_book(symbol, limit),
            f"fetch_order_book({symbol})",
        )
        best_bid = book["bids"][0][0] if book.get("bids") else None
        best_ask = book["asks"][0][0] if book.get("asks") else None
        logger.debug(
            "Order book %s — best bid: %s  best ask: %s  spread: %s",
            symbol, best_bid, best_ask,
            f"{best_ask - best_bid:.2f}" if best_bid and best_ask else "N/A",
        )
        return book

    async def fetch_current_prices(self, symbols: list[str] | None = None) -> dict[str, float]:
        """
        Fetch last prices for multiple symbols concurrently.

        Returns {symbol: price} dict.  If a symbol fails, it's excluded
        from the result (not silently set to 0).
        """
        targets = symbols or config.TRADING_PAIRS
        prices: dict[str, float] = {}

        tasks = {sym: self.fetch_ticker(sym) for sym in targets}
        results = await asyncio.gather(*tasks.values(), return_exceptions=True)

        for sym, result in zip(targets, results):
            if isinstance(result, Exception):
                logger.error("Failed to fetch price for %s: %s", sym, result)
            elif result and result.get("last"):
                prices[sym] = float(result["last"])

        return prices

    # ── Price Streaming (Poll-Based) ───────────────────────────────────

    async def start_price_stream(
        self,
        symbols: list[str] | None = None,
        callback: Callable[[dict[str, float]], Coroutine] | None = None,
        interval: float = 5.0,
    ) -> None:
        """
        Start polling prices every `interval` seconds.

        This is simpler and more reliable than WebSocket streaming for our
        use case.  The callback receives a {symbol: price} dict.
        """
        if self._streaming:
            logger.warning("Price stream already running")
            return

        targets = symbols or config.TRADING_PAIRS
        self._streaming = True
        logger.info("Starting price stream for %s (every %.1fs)", targets, interval)

        async def _poll_loop() -> None:
            while self._streaming:
                try:
                    prices = await self.fetch_current_prices(targets)
                    if callback and prices:
                        await callback(prices)
                except Exception:
                    logger.exception("Price stream poll error")
                await asyncio.sleep(interval)

        self._stream_task = asyncio.create_task(_poll_loop())

    def stop_price_stream(self) -> None:
        """Stop the price polling loop."""
        if self._streaming:
            self._streaming = False
            if self._stream_task and not self._stream_task.done():
                self._stream_task.cancel()
            logger.info("Price stream stopped")
