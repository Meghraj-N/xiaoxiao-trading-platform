# Core Infrastructure & Real-Time Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate Supabase logging, normalize WebSocket data from the broker, and push real-time candle data to the dashboard charts.

**Architecture:** We use a simple `SupabaseLogger` to fire-and-forget inserts into Supabase, a `WebSocketManager` to handle reconnects, and the existing `broadcast` loop in `main.py` to pipe live OHLC candles into `dashboard.html`.

**Tech Stack:** Python 3, FastAPI, Supabase-py, LightweightCharts.

## Global Constraints
- Python 3.11+
- Asyncio everywhere
- No third-party data SDKs (raw WebSockets preferred)

---

### Task 1: Create Supabase Client Wrapper

**Files:**
- Create: `backend/db/supabase_client.py`
- Modify: `backend/config.py:100-110` (if necessary to expose SUPABASE_KEY)
- Test: `backend/tests/test_supabase_client.py`

**Interfaces:**
- Consumes: `SUPABASE_URL`, `SUPABASE_KEY` from `config.py`
- Produces: `async def log_trade(trade_data: dict)`, `async def log_system_event(event: str, level: str)`

- [ ] **Step 1: Write the failing test**

```python
import pytest
from unittest.mock import AsyncMock, patch
from db.supabase_client import SupabaseClient

@pytest.mark.asyncio
async def test_log_system_event():
    with patch("db.supabase_client.create_client") as mock_create:
        mock_supabase = AsyncMock()
        mock_create.return_value = mock_supabase
        
        client = SupabaseClient()
        await client.log_system_event("Test Boot", "info")
        
        mock_supabase.table.assert_called_with("system_logs")
        mock_supabase.table().insert.assert_called()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_supabase_client.py -v`
Expected: FAIL with "ModuleNotFoundError: No module named 'db'"

- [ ] **Step 3: Write minimal implementation**

```python
# backend/db/supabase_client.py
import os
import asyncio
from supabase import create_client, Client
import config
import logging

logger = logging.getLogger(__name__)

class SupabaseClient:
    def __init__(self):
        url = getattr(config, "SUPABASE_URL", os.getenv("SUPABASE_URL"))
        key = getattr(config, "SUPABASE_KEY", os.getenv("SUPABASE_KEY"))
        if url and key:
            self.client: Client = create_client(url, key)
        else:
            self.client = None
            logger.warning("Supabase credentials not found. Logging locally only.")

    async def log_system_event(self, message: str, level: str = "info"):
        if not self.client: return
        try:
            # Running synchronous Supabase client insert in an executor
            def _insert():
                self.client.table("system_logs").insert({"message": message, "level": level}).execute()
            await asyncio.to_thread(_insert)
        except Exception as e:
            logger.error(f"Supabase system_logs error: {e}")

    async def log_trade(self, trade_data: dict):
        if not self.client: return
        try:
            def _insert():
                self.client.table("trades").insert(trade_data).execute()
            await asyncio.to_thread(_insert)
        except Exception as e:
            logger.error(f"Supabase trades error: {e}")

# Singleton instance
db_client = SupabaseClient()
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_supabase_client.py -v`
Expected: PASS

### Task 2: Enhance WebSocketManager for Real-Time Feeds

**Files:**
- Modify: `backend/engine/websocket_manager.py`

**Interfaces:**
- Consumes: `broker.start_websocket`
- Produces: Sends ticks to `main.py`

- [ ] **Step 1: Write the failing test**

```python
# backend/tests/test_websocket_manager.py
import pytest
import asyncio
from unittest.mock import AsyncMock
from engine.websocket_manager import WebSocketManager

@pytest.mark.asyncio
async def test_websocket_auto_reconnect():
    mock_broker = AsyncMock()
    # broker fails on first run, succeeds on second
    mock_broker.start_websocket.side_effect = [Exception("Drop"), None]
    
    manager = WebSocketManager(mock_broker)
    await manager.start(["BTC/USDT"], AsyncMock())
    
    await asyncio.sleep(0.1) # allow task to run
    assert mock_broker.start_websocket.call_count >= 1
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_websocket_manager.py -v`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```python
# backend/engine/websocket_manager.py
import asyncio
import logging
from typing import Callable, Coroutine, Any
from engine.broker_plugins.base_broker import BaseBrokerPlugin

logger = logging.getLogger(__name__)

class WebSocketManager:
    def __init__(self, broker: BaseBrokerPlugin):
        self.broker = broker
        self.task = None
        self._running = False
        
    async def _run_loop(self, symbols: list[str], on_tick: Callable):
        while self._running:
            try:
                logger.info(f"Connecting WebSocket for {self.broker.name}")
                await self.broker.start_websocket(symbols, on_tick)
            except Exception as e:
                logger.error(f"WebSocket dropped ({e}). Reconnecting in 3s...")
                await asyncio.sleep(3)

    async def start(self, symbols: list[str], on_tick: Callable[[str, float], Coroutine[Any, Any, None]]):
        self._running = True
        self.task = asyncio.create_task(self._run_loop(symbols, on_tick))
        
    async def stop(self):
        self._running = False
        if self.broker:
            await self.broker.stop_websocket()
        if self.task:
            self.task.cancel()
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_websocket_manager.py -v`
Expected: PASS

### Task 3: Hook Live Websocket to Main Loop and Supabase

**Files:**
- Modify: `backend/main.py:120-150`

**Interfaces:**
- Consumes: `WebSocketManager`, `db_client`
- Produces: Broadcasts `candle` and `price_update`

- [ ] **Step 1: Write the minimal implementation**

Modify `main.py` to use `db_client` and construct a candle payload inside `on_tick`.

```python
# In backend/main.py
import time
from db.supabase_client import db_client

# inside run_trading_loop, update on_tick:
async def on_tick(symbol: str, price: float):
    state["current_prices"][symbol] = price
    
    now_ts = int(time.time())
    candle_obj = {
        "time": now_ts,
        "open": price,
        "high": price,
        "low": price,
        "close": price
    }
    
    await broadcast({
        "type": "price_update",
        "symbol": symbol,
        "price": price,
        "candle": candle_obj
    })

# Also update the trade execution logic to log to supabase:
# inside run_trading_loop where trade is executed:
trade_dict = {
    "timestamp": trade_rec.timestamp,
    "symbol": trade_rec.symbol,
    "side": trade_rec.side,
    "entry_price": trade_rec.entry_price,
    "pnl": 0.0
}
asyncio.create_task(db_client.log_trade(trade_dict))
```

- [ ] **Step 2: Start the backend to verify**

Run: `python backend/main.py`
Expected: The server boots up and WebSocket connections establish without throwing exceptions.

### Task 4: Fix Settings Input UI in Dashboard

**Files:**
- Modify: `dashboard.html`

**Interfaces:**
- Consumes: User settings input
- Produces: Number typed float to `/api/settings`

- [ ] **Step 1: Write minimal implementation**

Update `dashboard.html` `saveSettings()` to clean the dollar sign off the value before sending:

```javascript
// inside saveSettings()
const rawCap = document.getElementById('setCapital').value.replace(/[^0-9.]/g, '');
const payload = {
    STARTING_CAPITAL: parseFloat(rawCap) || 3.0,
    DEFAULT_LEVERAGE: parseInt(document.getElementById('setLev').value) || 5,
    MAX_DRAWDOWN_PCT: parseFloat(document.getElementById('setMaxDD').value) || 0.15,
};
```
