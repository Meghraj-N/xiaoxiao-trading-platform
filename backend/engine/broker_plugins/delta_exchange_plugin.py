import asyncio
import json
import logging
import websockets
from typing import Callable, Coroutine, Any
import ccxt.async_support as ccxt

from engine.broker_plugins.base_broker import BaseBrokerPlugin
import config

logger = logging.getLogger(__name__)

class DeltaExchangePlugin(BaseBrokerPlugin):
    """
    Delta Exchange implementation for REST and WebSocket connections.
    """
    
    @property
    def name(self) -> str:
        return "Delta Exchange"
        
    def __init__(self):
        self.exchange = ccxt.delta({
            'enableRateLimit': True,
        })
        if config.USE_TESTNET:
            self.exchange.set_sandbox_mode(True)
            self.ws_url = "wss://testnet-socket.delta.exchange"
        else:
            self.ws_url = "wss://socket.delta.exchange"
            
        self.ws = None
        self.running = False
        self.reconnect_delay = 5
        
    async def initialize(self) -> None:
        try:
            await self.exchange.load_markets()
            logger.info(f"{self.name} initialized via REST")
        except Exception as e:
            logger.warning(f"Could not load markets for {self.name} via REST: {e}")
        
    async def close(self) -> None:
        await self.stop_websocket()
        await self.exchange.close()

    async def fetch_ohlcv(self, symbol: str, timeframe: str, limit: int) -> list[list]:
        return await self.exchange.fetch_ohlcv(symbol, timeframe, limit=limit)
        
    async def start_websocket(self, symbols: list[str], on_tick: Callable[[str, float], Coroutine[Any, Any, None]]) -> None:
        self.running = True
        
        while self.running:
            try:
                logger.info(f"Connecting to {self.name} WebSocket at {self.ws_url}")
                async with websockets.connect(self.ws_url) as ws:
                    self.ws = ws
                    logger.info(f"Connected to {self.name} WebSocket")
                    
                    # Transform symbols for Delta WS (e.g. BTC/USDT -> BTCUSDT)
                    delta_symbols = [s.replace('/', '') for s in symbols]
                    
                    # Subscribe to ticker
                    sub_msg = {
                        "type": "subscribe",
                        "payload": {
                            "channels": [
                                {
                                    "name": "v2/ticker",
                                    "symbols": delta_symbols
                                }
                            ]
                        }
                    }
                    await ws.send(json.dumps(sub_msg))
                    
                    while self.running:
                        msg = await ws.recv()
                        data = json.loads(msg)
                        
                        if data.get('type') == 'v2/ticker':
                            symbol_raw = data.get('symbol', '')
                            # Map back to standard symbol (e.g. BTCUSDT -> BTC/USDT)
                            if symbol_raw.endswith('USDT'):
                                std_symbol = f"{symbol_raw[:-4]}/USDT"
                            else:
                                std_symbol = symbol_raw
                                
                            mark_price = data.get('mark_price')
                            if mark_price is not None:
                                await on_tick(std_symbol, float(mark_price))
                                
            except websockets.exceptions.ConnectionClosed:
                logger.warning(f"{self.name} WebSocket connection closed")
            except Exception as e:
                logger.error(f"{self.name} WebSocket error: {e}")
                
            if self.running:
                logger.info(f"Reconnecting in {self.reconnect_delay} seconds...")
                await asyncio.sleep(self.reconnect_delay)

    async def stop_websocket(self) -> None:
        self.running = False
        if self.ws:
            await self.ws.close()
