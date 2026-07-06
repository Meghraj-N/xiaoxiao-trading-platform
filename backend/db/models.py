"""
Xiaoxiao Trading Bot — Database Models & Access Layer

Uses aiosqlite for async SQLite access.  Every write is atomic so we
never end up with a half-written trade record if the bot crashes.
"""

from __future__ import annotations

import logging
import time
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from typing import Any

import aiosqlite
from supabase import create_client, Client

from config import DB_PATH
import config

logger = logging.getLogger(__name__)

supabase_client: Client | None = None
if config.SUPABASE_URL and config.SUPABASE_KEY:
    try:
        supabase_client = create_client(config.SUPABASE_URL, config.SUPABASE_KEY)
        logger.info("Supabase client initialized.")
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")

# ── Schema DDL ─────────────────────────────────────────────────────────────

_SCHEMA = """
CREATE TABLE IF NOT EXISTS trades (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp           REAL    NOT NULL,
    symbol              TEXT    NOT NULL,
    side                TEXT    NOT NULL,
    entry_price         REAL    NOT NULL,
    exit_price          REAL    NOT NULL,
    quantity            REAL    NOT NULL,
    leverage            INTEGER NOT NULL,
    fees                REAL    NOT NULL,
    slippage_cost       REAL    NOT NULL,
    pnl_gross           REAL    NOT NULL,
    pnl_net             REAL    NOT NULL,
    exit_reason         TEXT    NOT NULL,
    strategy_name       TEXT    NOT NULL,
    kelly_fraction_used REAL    NOT NULL
);

CREATE TABLE IF NOT EXISTS equity_snapshots (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp     REAL    NOT NULL,
    equity        REAL    NOT NULL,
    drawdown_pct  REAL    NOT NULL
);

CREATE TABLE IF NOT EXISTS strategy_stats (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    strategy_name TEXT    NOT NULL UNIQUE,
    total_trades  INTEGER NOT NULL DEFAULT 0,
    wins          INTEGER NOT NULL DEFAULT 0,
    losses        INTEGER NOT NULL DEFAULT 0,
    win_rate      REAL    NOT NULL DEFAULT 0.0,
    avg_win       REAL    NOT NULL DEFAULT 0.0,
    avg_loss      REAL    NOT NULL DEFAULT 0.0,
    profit_factor REAL    NOT NULL DEFAULT 0.0,
    sharpe_ratio  REAL    NOT NULL DEFAULT 0.0,
    max_drawdown  REAL    NOT NULL DEFAULT 0.0,
    is_active     INTEGER NOT NULL DEFAULT 1,
    last_updated  REAL    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_trades_timestamp ON trades(timestamp);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_strategy ON trades(strategy_name);
CREATE INDEX IF NOT EXISTS idx_equity_timestamp ON equity_snapshots(timestamp);

CREATE TABLE IF NOT EXISTS custom_strategies (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT    NOT NULL UNIQUE,
    description     TEXT    NOT NULL DEFAULT '',
    code            TEXT    NOT NULL,
    ai_model_used   TEXT    NOT NULL DEFAULT '',
    backtest_passed INTEGER NOT NULL DEFAULT 0,
    is_active       INTEGER NOT NULL DEFAULT 1,
    created_at      REAL    NOT NULL,
    updated_at      REAL    NOT NULL
);

CREATE TABLE IF NOT EXISTS backtest_results (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    strategy_name   TEXT    NOT NULL,
    symbol          TEXT    NOT NULL,
    timeframe       TEXT    NOT NULL DEFAULT '1h',
    total_trades    INTEGER NOT NULL DEFAULT 0,
    wins            INTEGER NOT NULL DEFAULT 0,
    losses          INTEGER NOT NULL DEFAULT 0,
    win_rate        REAL    NOT NULL DEFAULT 0.0,
    profit_factor   REAL    NOT NULL DEFAULT 0.0,
    sharpe_ratio    REAL    NOT NULL DEFAULT 0.0,
    max_drawdown    REAL    NOT NULL DEFAULT 0.0,
    total_return    REAL    NOT NULL DEFAULT 0.0,
    passed          INTEGER NOT NULL DEFAULT 0,
    note            TEXT    NOT NULL DEFAULT '',
    run_at          REAL    NOT NULL
);

CREATE TABLE IF NOT EXISTS saved_strategies (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT    NOT NULL UNIQUE,
    symbol          TEXT    NOT NULL,
    legs_json       TEXT    NOT NULL,
    created_at      REAL    NOT NULL,
    updated_at      REAL    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_backtest_strategy ON backtest_results(strategy_name);
"""



# ── Data Classes ───────────────────────────────────────────────────────────

@dataclass
class TradeRecord:
    """A completed (closed) trade with all cost accounting baked in."""
    timestamp: float
    symbol: str
    side: str             # 'long' or 'short'
    entry_price: float
    exit_price: float
    quantity: float
    leverage: int
    fees: float           # total fees (entry + exit)
    slippage_cost: float  # total slippage (entry + exit)
    pnl_gross: float      # before fees/slippage
    pnl_net: float        # after everything — this is the honest number
    exit_reason: str      # 'stop_loss', 'take_profit', 'signal', 'manual'
    strategy_name: str
    kelly_fraction_used: float


@dataclass
class EquitySnapshot:
    """Point-in-time equity reading."""
    timestamp: float
    equity: float
    drawdown_pct: float


@dataclass
class StrategyStats:
    """Aggregate performance metrics for one strategy."""
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


# ── Database Functions ─────────────────────────────────────────────────────

async def init_db() -> None:
    """Create tables if they don't exist.  Safe to call multiple times."""
    logger.info("Initializing database at %s", DB_PATH)
    async with aiosqlite.connect(DB_PATH) as conn:
        conn.row_factory = aiosqlite.Row
        await conn.execute("PRAGMA journal_mode=WAL")
        await conn.execute("PRAGMA foreign_keys=ON")
        await conn.executescript(_SCHEMA)
        await conn.commit()
    logger.info("Database initialized successfully")


async def save_trade(trade: TradeRecord) -> int:
    """Insert a completed trade.  Returns the row id."""
    sql = """
        INSERT INTO trades
            (timestamp, symbol, side, entry_price, exit_price, quantity,
             leverage, fees, slippage_cost, pnl_gross, pnl_net,
             exit_reason, strategy_name, kelly_fraction_used)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """
    d = asdict(trade)
    values = (
        d["timestamp"], d["symbol"], d["side"], d["entry_price"],
        d["exit_price"], d["quantity"], d["leverage"], d["fees"],
        d["slippage_cost"], d["pnl_gross"], d["pnl_net"],
        d["exit_reason"], d["strategy_name"], d["kelly_fraction_used"],
    )
    async with aiosqlite.connect(DB_PATH) as conn:
        conn.row_factory = aiosqlite.Row
        cursor = await conn.execute(sql, values)
        await conn.commit()
        row_id = cursor.lastrowid
    logger.info(
        "Saved trade #%d: %s %s %s PnL_net=%.4f",
        row_id, trade.side, trade.symbol, trade.exit_reason, trade.pnl_net,
    )
    
    if supabase_client:
        try:
            supabase_client.table("trades").insert(d).execute()
        except Exception as e:
            logger.error(f"Failed to sync trade to Supabase: {e}")

    return row_id  # type: ignore[return-value]


async def save_equity_snapshot(snap: EquitySnapshot) -> None:
    """Record an equity data point."""
    sql = "INSERT INTO equity_snapshots (timestamp, equity, drawdown_pct) VALUES (?, ?, ?)"
    async with aiosqlite.connect(DB_PATH) as conn:
        await conn.execute(sql, (snap.timestamp, snap.equity, snap.drawdown_pct))
        await conn.commit()
        
    if supabase_client:
        try:
            supabase_client.table("equity_snapshots").insert({
                "timestamp": snap.timestamp,
                "equity": snap.equity,
                "drawdown_pct": snap.drawdown_pct
            }).execute()
        except Exception as e:
            logger.error(f"Failed to sync equity snapshot to Supabase: {e}")


async def get_trades(
    limit: int = 100,
    offset: int = 0,
    symbol: str | None = None,
    strategy: str | None = None,
) -> list[dict[str, Any]]:
    """Fetch trade history with optional filters."""
    conditions: list[str] = []
    params: list[Any] = []

    if symbol:
        conditions.append("symbol = ?")
        params.append(symbol)
    if strategy:
        conditions.append("strategy_name = ?")
        params.append(strategy)

    where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    sql = f"SELECT * FROM trades {where} ORDER BY timestamp DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    async with aiosqlite.connect(DB_PATH) as conn:
        conn.row_factory = aiosqlite.Row
        cursor = await conn.execute(sql, params)
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]


async def get_equity_curve(
    since: float | None = None,
    limit: int = 1000,
) -> list[dict[str, Any]]:
    """Get equity snapshots, optionally filtered by timestamp."""
    if since is not None:
        sql = "SELECT * FROM equity_snapshots WHERE timestamp >= ? ORDER BY timestamp LIMIT ?"
        params: tuple = (since, limit)
    else:
        sql = "SELECT * FROM equity_snapshots ORDER BY timestamp LIMIT ?"
        params = (limit,)

    async with aiosqlite.connect(DB_PATH) as conn:
        conn.row_factory = aiosqlite.Row
        cursor = await conn.execute(sql, params)
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]


async def save_strategy_stats(stats: StrategyStats) -> None:
    """Upsert strategy statistics."""
    sql = """
        INSERT INTO strategy_stats
            (strategy_name, total_trades, wins, losses, win_rate, avg_win,
             avg_loss, profit_factor, sharpe_ratio, max_drawdown, is_active,
             last_updated)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(strategy_name) DO UPDATE SET
            total_trades  = excluded.total_trades,
            wins          = excluded.wins,
            losses        = excluded.losses,
            win_rate      = excluded.win_rate,
            avg_win       = excluded.avg_win,
            avg_loss      = excluded.avg_loss,
            profit_factor = excluded.profit_factor,
            sharpe_ratio  = excluded.sharpe_ratio,
            max_drawdown  = excluded.max_drawdown,
            is_active     = excluded.is_active,
            last_updated  = excluded.last_updated
    """
    async with aiosqlite.connect(DB_PATH) as conn:
        await conn.execute(sql, (
            stats.strategy_name, stats.total_trades, stats.wins, stats.losses,
            stats.win_rate, stats.avg_win, stats.avg_loss, stats.profit_factor,
            stats.sharpe_ratio, stats.max_drawdown, int(stats.is_active),
            stats.last_updated,
        ))
        await conn.commit()
    logger.debug("Saved stats for strategy '%s'", stats.strategy_name)


async def get_strategy_stats() -> list[dict[str, Any]]:
    """Get all strategy stats."""
    async with aiosqlite.connect(DB_PATH) as conn:
        conn.row_factory = aiosqlite.Row
        cursor = await conn.execute("SELECT * FROM strategy_stats ORDER BY strategy_name")
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]


async def get_todays_trades() -> list[dict[str, Any]]:
    """Get all trades from today (UTC).  Used by risk manager for daily loss calc."""
    now = datetime.now(timezone.utc)
    start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0).timestamp()
    sql = "SELECT * FROM trades WHERE timestamp >= ? ORDER BY timestamp"
    async with aiosqlite.connect(DB_PATH) as conn:
        conn.row_factory = aiosqlite.Row
        cursor = await conn.execute(sql, (start_of_day,))
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]


# ── Custom Strategies CRUD ─────────────────────────────────────────────────

async def save_custom_strategy(
    name: str, description: str, code: str,
    ai_model_used: str = "", is_active: bool = True,
) -> int:
    """Insert or update a custom strategy."""
    now = time.time()
    sql = """
        INSERT INTO custom_strategies (name, description, code, ai_model_used, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(name) DO UPDATE SET
            description = excluded.description,
            code = excluded.code,
            ai_model_used = excluded.ai_model_used,
            is_active = excluded.is_active,
            updated_at = excluded.updated_at
    """
    async with aiosqlite.connect(DB_PATH) as conn:
        cursor = await conn.execute(sql, (
            name, description, code, ai_model_used, int(is_active), now, now
        ))
        await conn.commit()
        return cursor.lastrowid or 0


async def get_custom_strategies() -> list[dict[str, Any]]:
    """Get all custom strategies."""
    async with aiosqlite.connect(DB_PATH) as conn:
        conn.row_factory = aiosqlite.Row
        cursor = await conn.execute(
            "SELECT * FROM custom_strategies ORDER BY created_at DESC"
        )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]


async def delete_custom_strategy(name: str) -> bool:
    """Delete a custom strategy by name."""
    async with aiosqlite.connect(DB_PATH) as conn:
        cursor = await conn.execute(
            "DELETE FROM custom_strategies WHERE name = ?", (name,)
        )
        await conn.commit()
        return cursor.rowcount > 0


async def update_strategy_backtest_status(name: str, passed: bool) -> None:
    """Update whether a strategy passed backtest."""
    async with aiosqlite.connect(DB_PATH) as conn:
        await conn.execute(
            "UPDATE custom_strategies SET backtest_passed = ?, updated_at = ? WHERE name = ?",
            (int(passed), time.time(), name)
        )
        await conn.commit()


# ── Backtest Results ───────────────────────────────────────────────────────

async def save_backtest_result(result: dict[str, Any]) -> int:
    """Save a backtest result."""
    sql = """
        INSERT INTO backtest_results
            (strategy_name, symbol, timeframe, total_trades, wins, losses,
             win_rate, profit_factor, sharpe_ratio, max_drawdown, total_return,
             passed, note, run_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """
    async with aiosqlite.connect(DB_PATH) as conn:
        cursor = await conn.execute(sql, (
            result.get("strategy_name", ""),
            result.get("symbol", "BTC/USDT"),
            result.get("timeframe", "1h"),
            result.get("total_trades", 0),
            result.get("wins", 0),
            result.get("losses", 0),
            result.get("win_rate", 0),
            result.get("profit_factor", 0),
            result.get("sharpe_ratio", 0),
            result.get("max_drawdown", 0),
            result.get("total_return", 0),
            int(result.get("passed", False)),
            result.get("note", ""),
            time.time(),
        ))
        await conn.commit()
        return cursor.lastrowid or 0


async def get_backtest_results(
    strategy_name: str | None = None, limit: int = 50
) -> list[dict[str, Any]]:
    """Get backtest results, optionally filtered by strategy name."""
    if strategy_name:
        sql = "SELECT * FROM backtest_results WHERE strategy_name = ? ORDER BY run_at DESC LIMIT ?"
        params: tuple = (strategy_name, limit)
    else:
        sql = "SELECT * FROM backtest_results ORDER BY run_at DESC LIMIT ?"
        params = (limit,)

    async with aiosqlite.connect(DB_PATH) as conn:
        conn.row_factory = aiosqlite.Row
        cursor = await conn.execute(sql, params)
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]

import json

async def save_strategy_portfolio(name: str, symbol: str, legs: list[dict[str, Any]]) -> int:
    now = time.time()
    sql = """
        INSERT INTO saved_strategies (name, symbol, legs_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(name) DO UPDATE SET
            legs_json = excluded.legs_json,
            updated_at = excluded.updated_at
    """
    async with aiosqlite.connect(DB_PATH) as conn:
        cursor = await conn.execute(sql, (name, symbol, json.dumps(legs), now, now))
        await conn.commit()
        return cursor.lastrowid or 0

async def get_saved_strategies() -> list[dict[str, Any]]:
    async with aiosqlite.connect(DB_PATH) as conn:
        conn.row_factory = aiosqlite.Row
        cursor = await conn.execute("SELECT * FROM saved_strategies ORDER BY updated_at DESC")
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]

async def delete_saved_strategy(name: str) -> bool:
    async with aiosqlite.connect(DB_PATH) as conn:
        cursor = await conn.execute("DELETE FROM saved_strategies WHERE name = ?", (name,))
        await conn.commit()
        return cursor.rowcount > 0
