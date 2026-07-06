from abc import ABC, abstractmethod
from typing import Callable, Any, Coroutine

class BaseBrokerPlugin(ABC):
    """
    Abstract base class for all broker plugins.
    Ensures a standardized interface for fetching data and placing orders
    across any broker (Delta Exchange, Zerodha, Binance, etc.)
    """
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Name of the broker"""
        ...
        
    @abstractmethod
    async def initialize(self) -> None:
        """Initialize connections and API clients"""
        ...
        
    @abstractmethod
    async def close(self) -> None:
        """Close connections gracefully"""
        ...

    # --- REST Data Methods ---
    
    @abstractmethod
    async def fetch_ohlcv(self, symbol: str, timeframe: str, limit: int) -> list[list]:
        """Fetch historical OHLCV candles [timestamp, open, high, low, close, volume]"""
        ...
        
    # --- WebSocket Methods ---
    
    @abstractmethod
    async def start_websocket(self, symbols: list[str], on_tick: Callable[[str, float], Coroutine[Any, Any, None]]) -> None:
        """
        Start listening to real-time WebSockets for given symbols.
        `on_tick` is a callback function that is called with (symbol, price) whenever a trade occurs.
        """
        ...

    @abstractmethod
    async def stop_websocket(self) -> None:
        """Stop the WebSocket connection"""
        ...
