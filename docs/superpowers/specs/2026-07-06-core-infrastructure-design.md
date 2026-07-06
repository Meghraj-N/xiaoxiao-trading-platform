# Core Infrastructure & Real-Time Data Design

## Goal
Establish a robust, real-time data foundation (Sub-Project 1) to support a massive enterprise-grade trading platform. This includes normalized WebSockets, live streaming quotes, and a zero-config caching layer backed by Supabase.

## Architecture

**Approach**: Direct Supabase + In-Memory Cache (Option A)
The system will run as a single-process Asyncio FastAPI backend. Real-time data and positions are held in an ultra-fast in-memory Python dictionary. Long-term persistence (trades, logs, system events) is written asynchronously to Supabase.

## Components

1. **Supabase Client (`backend/db/supabase_client.py`)**
   *   Initializes the `supabase-py` client using keys from `.env`.
   *   Exposes async helper methods to insert records into `trades` and `system_logs` tables.
   *   Includes a background retry queue: if the internet drops, writes are held in memory and pushed when connectivity returns.

2. **Normalized WebSocket Layer (`backend/engine/websocket_manager.py`)**
   *   Provides a `Common WebSocket Layer` that abstracts away the specific broker (Delta Exchange initially).
   *   **Auto-Reconnection**: If a feed drops, it automatically reconnects and resubscribes to the active `TRADING_PAIRS` without crashing the engine.
   *   Normalizes incoming data (trades, L2/L5 market depth) into standard `price_update` and `depth_update` events.

3. **Data Feed & Broadcast (`backend/main.py`)**
   *   Receives normalized ticks from `WebSocketManager`.
   *   Instantly updates the in-memory `state['current_prices']`.
   *   Constructs UI-friendly `candle` objects (OHLC format) on the fly and broadcasts them via the FastAPI local WebSocket to `dashboard.html` for real-time charting.

4. **Dashboard Real-Time UI (`dashboard.html`)**
   *   The frontend `ws.onmessage` handler natively parses the newly formatted `candle` payloads and feeds them into `LightweightCharts`.
   *   Ensures that setting changes (like Paper Trading capital) are instantly synced between the UI and backend memory.

## Error Handling
*   **WebSocket Disconnects**: Implements exponential backoff (e.g., 1s, 2s, 4s...) to prevent spamming the broker during an outage.
*   **Supabase Failures**: Non-blocking. If a database insert fails due to network latency, the trading loop is unaffected. 

## Testing Strategy
*   Start the bot and disconnect the internet momentarily to verify Auto-Reconnection.
*   Verify that `dashboard.html` charts tick smoothly without page refreshes.
*   Verify that starting/stopping the bot appears in the Supabase `system_logs` table.
