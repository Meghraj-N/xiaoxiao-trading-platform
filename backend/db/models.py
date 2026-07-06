"""
Xiaoxiao Trading Bot — Database Models & Access Layer (Supabase)

Uses supabase-py for remote database access.
"""

from __future__ import annotations

import logging
import time
import asyncio
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from typing import Any

from supabase import create_client, Client

from config import SUPABASE_URL, SUPABASE_KEY
import config

logger = logging.getLogger(__name__)

supabase_client: Client | None = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info("Supabase client initialized.")
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
else:
    logger.warning("SUPABASE_URL and SUPABASE_KEY not set. DB features will fail.")

# ── Data Classes ───────────────────────────────────────────────────────────

@dataclass
class TradeRecord:
    timestamp: float
    symbol: str
    side: str
    entry_price: float
    exit_price: float
    quantity: float
    leverage: int
    fees: float
    slippage_cost: float
    pnl_gross: float
    pnl_net: float
    exit_reason: str
    strategy_name: str
    kelly_fraction_used: float

@dataclass
class EquitySnapshot:
    timestamp: float
    equity: float
    drawdown_pct: float

@dataclass
class StrategyStats:
    strategy_name: str
    total_trades: int
    wins: int
    losses: int
    win_rate: float
    avg_win: float
    avg_loss: float
    profit_factor: float
    sharpe_ratio: float
    max_drawdown: float
    is_active: bool
    last_updated: float


# ── Helper for async Supabase ──────────────────────────────────────────────

async def _run_sb(func, *args, **kwargs):
    """Run synchronous supabase client methods in a thread pool."""
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, lambda: func(*args, **kwargs))

# ── Database Functions ─────────────────────────────────────────────────────

async def init_db() -> None:
    """Check Supabase connection."""
    logger.info("Initializing database via Supabase...")
    if not supabase_client:
        logger.error("No Supabase client available.")
        return
    # Could optionally verify connection here by fetching 1 row
    logger.info("Database initialized successfully")

async def save_trade(trade: TradeRecord) -> int:
    """Insert a completed trade."""
    d = asdict(trade)
    if not supabase_client: return 0
    try:
        res = await _run_sb(supabase_client.table("trades").insert(d).execute)
        data = res.data
        if data:
            row_id = data[0].get("id", 0)
            logger.info(f"Saved trade #{row_id}: {trade.side} {trade.symbol} PnL={trade.pnl_net:.4f}")
            return row_id
    except Exception as e:
        logger.error(f"Failed to sync trade to Supabase: {e}")
    return 0

async def save_equity_snapshot(snap: EquitySnapshot) -> None:
    """Record an equity data point."""
    if not supabase_client: return
    try:
        await _run_sb(supabase_client.table("equity_snapshots").insert({
            "timestamp": snap.timestamp,
            "equity": snap.equity,
            "drawdown_pct": snap.drawdown_pct
        }).execute)
    except Exception as e:
        logger.error(f"Failed to sync equity snapshot to Supabase: {e}")

async def get_trades(
    limit: int = 100,
    offset: int = 0,
    symbol: str | None = None,
    strategy: str | None = None,
) -> list[dict[str, Any]]:
    if not supabase_client: return []
    try:
        q = supabase_client.table("trades").select("*")
        if symbol:
            q = q.eq("symbol", symbol)
        if strategy:
            q = q.eq("strategy_name", strategy)
        q = q.order("timestamp", desc=True).limit(limit)
        q = q.range(offset, offset + limit - 1)
        res = await _run_sb(q.execute)
        return res.data or []
    except Exception as e:
        logger.error(f"Error fetching trades: {e}")
        return []

async def get_equity_curve(
    since: float | None = None,
    limit: int = 1000,
) -> list[dict[str, Any]]:
    if not supabase_client: return []
    try:
        q = supabase_client.table("equity_snapshots").select("*")
        if since is not None:
            q = q.gte("timestamp", since)
        q = q.order("timestamp", desc=False).limit(limit)
        res = await _run_sb(q.execute)
        return res.data or []
    except Exception as e:
        logger.error(f"Error fetching equity curve: {e}")
        return []

async def save_strategy_stats(stats: StrategyStats) -> None:
    if not supabase_client: return
    try:
        d = asdict(stats)
        d["is_active"] = int(d["is_active"])
        await _run_sb(supabase_client.table("strategy_stats").upsert(d, on_conflict="strategy_name").execute)
        logger.debug(f"Saved stats for strategy '{stats.strategy_name}'")
    except Exception as e:
        logger.error(f"Error saving strategy stats: {e}")

async def get_strategy_stats() -> list[dict[str, Any]]:
    if not supabase_client: return []
    try:
        res = await _run_sb(supabase_client.table("strategy_stats").select("*").order("strategy_name").execute)
        return res.data or []
    except Exception as e:
        logger.error(f"Error fetching strategy stats: {e}")
        return []

async def get_todays_trades() -> list[dict[str, Any]]:
    if not supabase_client: return []
    now = datetime.now(timezone.utc)
    start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0).timestamp()
    try:
        res = await _run_sb(supabase_client.table("trades").select("*").gte("timestamp", start_of_day).order("timestamp").execute)
        return res.data or []
    except Exception as e:
        logger.error(f"Error fetching today's trades: {e}")
        return []

# ── Custom Strategies CRUD ─────────────────────────────────────────────────

async def save_custom_strategy(
    name: str, description: str, code: str,
    ai_model_used: str = "", is_active: bool = True,
) -> int:
    if not supabase_client: return 0
    now = time.time()
    try:
        d = {
            "name": name,
            "description": description,
            "code": code,
            "ai_model_used": ai_model_used,
            "is_active": int(is_active),
            "created_at": now,
            "updated_at": now
        }
        res = await _run_sb(supabase_client.table("custom_strategies").upsert(d, on_conflict="name").execute)
        return res.data[0].get("id", 0) if res.data else 0
    except Exception as e:
        logger.error(f"Error saving custom strategy: {e}")
        return 0

async def get_custom_strategies() -> list[dict[str, Any]]:
    if not supabase_client: return []
    try:
        res = await _run_sb(supabase_client.table("custom_strategies").select("*").order("created_at", desc=True).execute)
        return res.data or []
    except Exception as e:
        logger.error(f"Error fetching custom strategies: {e}")
        return []

async def delete_custom_strategy(name: str) -> bool:
    if not supabase_client: return False
    try:
        res = await _run_sb(supabase_client.table("custom_strategies").delete().eq("name", name).execute)
        return len(res.data) > 0 if res.data else False
    except Exception as e:
        logger.error(f"Error deleting custom strategy: {e}")
        return False

async def update_strategy_backtest_status(name: str, passed: bool) -> None:
    if not supabase_client: return
    try:
        await _run_sb(supabase_client.table("custom_strategies").update({
            "backtest_passed": int(passed),
            "updated_at": time.time()
        }).eq("name", name).execute)
    except Exception as e:
        logger.error(f"Error updating strategy backtest status: {e}")

# ── Backtest Results ───────────────────────────────────────────────────────

async def save_backtest_result(result: dict[str, Any]) -> int:
    if not supabase_client: return 0
    try:
        d = {
            "strategy_name": result.get("strategy_name", ""),
            "symbol": result.get("symbol", "BTC/USDT"),
            "timeframe": result.get("timeframe", "1h"),
            "total_trades": result.get("total_trades", 0),
            "wins": result.get("wins", 0),
            "losses": result.get("losses", 0),
            "win_rate": result.get("win_rate", 0),
            "profit_factor": result.get("profit_factor", 0),
            "sharpe_ratio": result.get("sharpe_ratio", 0),
            "max_drawdown": result.get("max_drawdown", 0),
            "total_return": result.get("total_return", 0),
            "passed": int(result.get("passed", False)),
            "note": result.get("note", ""),
            "run_at": time.time()
        }
        res = await _run_sb(supabase_client.table("backtest_results").insert(d).execute)
        return res.data[0].get("id", 0) if res.data else 0
    except Exception as e:
        logger.error(f"Error saving backtest result: {e}")
        return 0

async def get_backtest_results(
    strategy_name: str | None = None, limit: int = 50
) -> list[dict[str, Any]]:
    if not supabase_client: return []
    try:
        q = supabase_client.table("backtest_results").select("*")
        if strategy_name:
            q = q.eq("strategy_name", strategy_name)
        q = q.order("run_at", desc=True).limit(limit)
        res = await _run_sb(q.execute)
        return res.data or []
    except Exception as e:
        logger.error(f"Error fetching backtest results: {e}")
        return []

import json

async def save_strategy_portfolio(name: str, symbol: str, legs: list[dict[str, Any]]) -> int:
    if not supabase_client: return 0
    now = time.time()
    try:
        d = {
            "name": name,
            "symbol": symbol,
            "legs_json": json.dumps(legs),
            "created_at": now,
            "updated_at": now
        }
        res = await _run_sb(supabase_client.table("saved_strategies").upsert(d, on_conflict="name").execute)
        return res.data[0].get("id", 0) if res.data else 0
    except Exception as e:
        logger.error(f"Error saving strategy portfolio: {e}")
        return 0

async def get_saved_strategies() -> list[dict[str, Any]]:
    if not supabase_client: return []
    try:
        res = await _run_sb(supabase_client.table("saved_strategies").select("*").order("updated_at", desc=True).execute)
        return res.data or []
    except Exception as e:
        logger.error(f"Error fetching saved strategies: {e}")
        return []

async def delete_saved_strategy(name: str) -> bool:
    if not supabase_client: return False
    try:
        res = await _run_sb(supabase_client.table("saved_strategies").delete().eq("name", name).execute)
        return len(res.data) > 0 if res.data else False
    except Exception as e:
        logger.error(f"Error deleting saved strategy: {e}")
        return False
