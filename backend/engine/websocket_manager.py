import asyncio
import logging
from typing import Callable, Coroutine, Any

from engine.broker_plugins.base_broker import BaseBrokerPlugin

logger = logging.getLogger(__name__)

class WebSocketManager:
    """
    Manages WebSocket connections across one or more brokers.
    Normalizes feeds into a single `on_tick` callback for the trading engine.
    """
    def __init__(self, broker: BaseBrokerPlugin):
        self.broker = broker
        self.task = None
        self._running = False
        
    async def _run_loop(self, symbols: list[str], on_tick: Callable[[str, float], Coroutine[Any, Any, None]]):
        while self._running:
            try:
                logger.info(f"Connecting WebSocket for {self.broker.name}")
                await self.broker.start_websocket(symbols, on_tick)
            except Exception as e:
                logger.error(f"WebSocket dropped ({e}). Reconnecting in 3s...")
                await asyncio.sleep(3)

    async def start(self, symbols: list[str], on_tick: Callable[[str, float], Coroutine[Any, Any, None]]):
        """Start the WebSocket in the background with auto-reconnect."""
        self._running = True
        logger.info(f"Starting WebSocketManager for {self.broker.name}...")
        self.task = asyncio.create_task(self._run_loop(symbols, on_tick))
        
    async def stop(self):
        """Stop the WebSocket Manager."""
        self._running = False
        if self.broker:
            await self.broker.stop_websocket()
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
        logger.info(f"WebSocketManager for {self.broker.name} stopped.")

