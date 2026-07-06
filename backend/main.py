"""
Xiaoxiao Trading Bot — Main Entry Point
────────────────────────────────────────
Starts everything: data feed, strategies, paper trader,
risk manager, API server, and the main trading loop.

Run: python main.py

The bot fetches real live prices from Delta Exchange,
runs strategies on them, and paper trades with $3.
Every fill, fee, and P&L is honest.
"""

import asyncio
import logging
from logging.handlers import TimedRotatingFileHandler
import os
import sys
import time
from datetime import datetime, timezone

import pandas as pd
import uvicorn

import config
from db.models import (
    init_db, save_trade, save_equity_snapshot,
    TradeRecord, EquitySnapshot, get_trades, get_equity_curve,
)
from engine.data_feed import DataFeed
from engine.paper_trader import PaperTrader
from engine.position_sizer import PositionSizer
from engine.risk_manager import RiskManager
from engine.reset_loop import ResetLoop
from engine.backtester import Backtester
from engine.ai_optimizer import AIOptimizer
from engine.strategies.ema_cross import EMACrossStrategy
from engine.strategies.rsi_revert import RSIRevertStrategy
from engine.strategies.boll_break import BollingerBreakoutStrategy
from api.server import app, set_engine_state, broadcast

# ── Logging ──
os.makedirs("logs", exist_ok=True)
logging.basicConfig(
    level=getattr(config, "LOG_LEVEL", "INFO"),
    format=config.LOG_FORMAT,
    handlers=[
        logging.StreamHandler(sys.stdout),
        TimedRotatingFileHandler(
            "logs/bot.log", 
            when="midnight", 
            interval=1, 
            backupCount=30, 
            encoding="utf-8"
        ),
    ],
)
logger = logging.getLogger("xiaoxiao.main")


def ohlcv_to_dataframe(raw: list[list]) -> pd.DataFrame:
    """Convert CCXT OHLCV list-of-lists to a DataFrame that strategies expect."""
    if not raw:
        return pd.DataFrame(columns=["timestamp", "open", "high", "low", "close", "volume"])
    df = pd.DataFrame(raw, columns=["timestamp", "open", "high", "low", "close", "volume"])
    df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")
    return df


async def trading_loop(state: dict):
    """
    Main trading loop.
    - Every 5 seconds: fetch prices, check stops, broadcast updates
    - Every hour (on the hour): run strategies, generate signals, size & execute
    """
    data_feed: DataFeed = state["data_feed"]
    paper_trader: PaperTrader = state["paper_trader"]
    position_sizer: PositionSizer = state["position_sizer"]
    risk_manager: RiskManager = state["risk_manager"]
    reset_loop_inst: ResetLoop = state["reset_loop"]
    strategies = state["strategies"]

    logger.info("=" * 60)
    logger.info("XIAOXIAO TRADING BOT v1.0 — HONEST AI TRADING")
    logger.info(f"Exchange: Delta Exchange ({'TESTNET' if config.USE_TESTNET else 'LIVE'})")
    logger.info(f"Starting Capital: ${config.STARTING_CAPITAL:.2f}")
    logger.info(f"Trading Pairs: {config.TRADING_PAIRS}")
    logger.info(f"Leverage: {config.DEFAULT_LEVERAGE}x")
    logger.info(f"Fees: {config.MAKER_FEE:.2%} maker / {config.TAKER_FEE:.2%} taker (verified)")
    logger.info(f"Slippage: {config.SLIPPAGE:.2%} per side")
    logger.info(f"Position Sizing: {config.KELLY_FRACTION}× Kelly (max {config.MAX_RISK_PCT:.0%} risk)")
    logger.info("=" * 60)

    price_interval = 1        # Loop interval for stop-loss and equity checks
    strategy_interval = 3600  # Run strategies every hour for 1h timeframe
    equity_snapshot_interval = 60

    last_strategy_run = 0.0
    last_equity_snapshot = 0.0

    while True:
        try:
            if not state.get("running", False):
                await asyncio.sleep(1)
                continue

            now_dt = datetime.now(timezone.utc)
            now = time.time()

            # Dynamically update starting capital if changed in settings
            if paper_trader.initial_balance != config.STARTING_CAPITAL:
                paper_trader.update_starting_capital(config.STARTING_CAPITAL)


            # ── 3:20 PM Auto Square-Off Rule (LevelUpSam Guide) ──
            if now_dt.hour == 15 and now_dt.minute >= 20 and now_dt.minute <= 25:
                for pos_id in list(paper_trader.open_positions.keys()):
                    pos = paper_trader.open_positions[pos_id]
                    current_price = state["current_prices"].get(pos.symbol)
                    if current_price:
                        logger.info(f"⏰ 3:20 PM Auto Square-Off triggered for {pos.symbol}")
                        trade_rec = await paper_trader.close_position(pos_id, current_price, "3:20_square_off")
                        if trade_rec:
                            risk_manager.record_loss(trade_rec.pnl_net)
                            risk_manager.update_positions(len(paper_trader.open_positions))
                            trade_dict = {
                                "timestamp": trade_rec.timestamp,
                                "symbol": trade_rec.symbol,
                                "side": trade_rec.side,
                                "entry_price": trade_rec.entry_price,
                                "exit_price": trade_rec.exit_price,
                                "quantity": trade_rec.quantity,
                                "leverage": trade_rec.leverage,
                                "fees": trade_rec.fees,
                                "pnl": trade_rec.pnl_net,
                                "strategy": trade_rec.strategy_name,
                                "exit_reason": trade_rec.exit_reason,
                            }
                            asyncio.create_task(db_client.log_trade(trade_dict))
                            await broadcast({"type": "trade_executed", "trade": trade_dict, "equity": paper_trader.get_equity(state["current_prices"])})

            # ── Check stops on open positions ──
            if state["current_prices"]:
                closed_trades = await paper_trader.check_stops(state["current_prices"])
                for trade_rec in closed_trades:
                    # Update risk manager
                    risk_manager.record_loss(trade_rec.pnl_net)
                    risk_manager.update_positions(len(paper_trader.open_positions))

                    # Update reset loop
                    equity = paper_trader.get_equity(state["current_prices"])
                    drawdown = risk_manager.track_equity(equity)
                    reset_loop_inst.record_trade(trade_rec.strategy_name, trade_rec.pnl_net)

                    # Broadcast trade
                    trade_dict = {
                        "timestamp": trade_rec.timestamp,
                        "symbol": trade_rec.symbol,
                        "side": trade_rec.side,
                        "entry_price": trade_rec.entry_price,
                        "exit_price": trade_rec.exit_price,
                        "quantity": trade_rec.quantity,
                        "leverage": trade_rec.leverage,
                        "fees": trade_rec.fees,
                        "pnl": trade_rec.pnl_net,
                        "strategy": trade_rec.strategy_name,
                        "exit_reason": trade_rec.exit_reason,
                    }
                    asyncio.create_task(db_client.log_trade(trade_dict))
                    await broadcast({
                        "type": "trade_executed",
                        "trade": trade_dict,
                        "equity": equity,
                    })

                    logger.info(
                        f"CLOSED: {trade_rec.side} {trade_rec.symbol} "
                        f"P&L: ${trade_rec.pnl_net:.6f} ({trade_rec.exit_reason})"
                    )

            # ── Equity snapshot ──
            if now - last_equity_snapshot >= equity_snapshot_interval:
                equity = paper_trader.get_equity(state["current_prices"])
                drawdown = risk_manager.track_equity(equity)

                snap = EquitySnapshot(
                    timestamp=now, equity=equity, drawdown_pct=drawdown
                )
                try:
                    await save_equity_snapshot(snap)
                except Exception as e:
                    logger.error(f"Failed to save equity snapshot: {e}")

                await broadcast({
                    "type": "equity_update",
                    "equity": equity,
                    "drawdown": drawdown,
                })
                last_equity_snapshot = now

            # ── Run strategies (every hour) ──
            if now - last_strategy_run >= strategy_interval:
                last_strategy_run = now

                # Check risk gates
                equity = paper_trader.get_equity(state["current_prices"])
                risk_manager.track_equity(equity)
                risk_manager.update_positions(len(paper_trader.open_positions))
                risk_status = risk_manager.is_trading_allowed()

                if not risk_status.trading_allowed:
                    logger.warning(f"RISK BLOCK: {risk_status.pause_reason}")
                    await broadcast({
                        "type": "risk_update",
                        "risk_pct": risk_status.drawdown_pct / config.MAX_DRAWDOWN_PCT,
                        "drawdown": risk_status.drawdown_pct,
                        "reason": risk_status.pause_reason,
                    })
                    await asyncio.sleep(price_interval)
                    continue

                active_strategy_name = state.get("active_strategy", "All")

                # Run each strategy on each symbol
                for strategy in strategies:
                    if active_strategy_name != "All" and strategy.name != active_strategy_name:
                        continue
                        
                    if reset_loop_inst.is_strategy_disabled(strategy.name):
                        logger.info(f"Skipping {strategy.name} — disabled by reset loop")
                        continue

                    for symbol in config.TRADING_PAIRS:
                        # Skip if already have position in this symbol
                        has_position = any(
                            p.symbol == symbol
                            for p in paper_trader.open_positions.values()
                        )
                        if has_position:
                            continue

                        try:
                            # Fetch candles and convert to DataFrame
                            raw_ohlcv = await data_feed.fetch_ohlcv(
                                symbol, config.TIMEFRAME, limit=100
                            )
                            df = ohlcv_to_dataframe(raw_ohlcv)

                            if len(df) < 50:
                                continue

                            # Generate signal
                            sig = strategy.generate_signal(df)

                            if sig.direction in ('long', 'short'):
                                # ── Mandatory Stop Loss Rule (LevelUpSam Guide) ──
                                if not sig.stop_loss:
                                    logger.warning(
                                        f"Signal Rejected: {strategy.name} → {sig.direction.upper()} {symbol} "
                                        f"| Mandatory Stop Loss Rule violated! No stop_loss provided."
                                    )
                                    continue
                                
                                # Default take profit if missing
                                if not sig.take_profit:
                                    if sig.direction == 'long':
                                        sig.take_profit = df.iloc[-1]['close'] * 1.05
                                    else:
                                        sig.take_profit = df.iloc[-1]['close'] * 0.95

                                logger.info(
                                    f"Signal: {strategy.name} → {sig.direction.upper()} {symbol} "
                                    f"| SL={sig.stop_loss:.2f} TP={sig.take_profit:.2f} "
                                    f"| {sig.reason}"
                                )

                                # Get reset multiplier
                                drawdown = risk_manager.track_equity(
                                    paper_trader.get_equity(state["current_prices"])
                                )
                                reset_mult = reset_loop_inst.check_for_reset(
                                    strategy.name, drawdown
                                )
                                if reset_mult <= 0:
                                    continue

                                # Size position
                                balance = paper_trader.get_equity(state["current_prices"])
                                trade_count = len(paper_trader.trade_history)

                                # Compute win/loss stats from history
                                wins = [t for t in paper_trader.trade_history if t.pnl_net > 0]
                                losses = [t for t in paper_trader.trade_history if t.pnl_net <= 0]
                                wr = len(wins) / trade_count if trade_count > 0 else 0
                                aw = sum(t.pnl_net for t in wins) / len(wins) if wins else 0
                                al = abs(sum(t.pnl_net for t in losses) / len(losses)) if losses else 0

                                entry_price = state["current_prices"].get(
                                    symbol, float(df.iloc[-1]["close"])
                                )

                                size = position_sizer.calculate_position_size(
                                    balance=balance,
                                    entry_price=entry_price,
                                    stop_loss=sig.stop_loss,
                                    leverage=config.DEFAULT_LEVERAGE,
                                    trade_count=trade_count,
                                    win_rate=wr, avg_win=aw, avg_loss=al,
                                    reset_multiplier=reset_mult,
                                )

                                if size.quantity <= 0:
                                    logger.info(f"Position size is 0 — skipping")
                                    continue

                                # Execute paper trade
                                pos = await paper_trader.open_position(
                                    symbol=symbol,
                                    side=sig.direction,
                                    quantity=size.quantity,
                                    price=entry_price,
                                    leverage=config.DEFAULT_LEVERAGE,
                                    strategy_name=strategy.name,
                                    stop_loss=sig.stop_loss,
                                    take_profit=sig.take_profit,
                                    kelly_fraction_used=size.kelly_fraction,
                                )

                                if pos:
                                    risk_manager.update_positions(
                                        len(paper_trader.open_positions)
                                    )
                                    trade_dict = {
                                        "timestamp": pos.timestamp,
                                        "symbol": pos.symbol,
                                        "side": pos.side,
                                        "entry_price": pos.entry_price,
                                        "quantity": pos.quantity,
                                        "strategy": pos.strategy_name,
                                    }
                                    asyncio.create_task(db_client.log_trade(trade_dict))
                                    await broadcast({
                                        "type": "trade_opened",
                                        "symbol": symbol,
                                        "side": sig.direction,
                                        "price": entry_price,
                                        "strategy": strategy.name,
                                    })

                        except Exception as e:
                            logger.error(
                                f"Strategy error ({strategy.name} / {symbol}): {e}",
                                exc_info=True
                            )

            await asyncio.sleep(price_interval)

        except asyncio.CancelledError:
            logger.info("Trading loop cancelled.")
            break
        except Exception as e:
            logger.error(f"Trading loop error: {e}", exc_info=True)
            await asyncio.sleep(5)


class Database:
    """Thin wrapper so API server has a consistent interface."""
    def __init__(self, path: str):
        self.path = path

    async def init_db(self):
        await init_db()

    async def save_trade(self, trade):
        await save_trade(trade)

    async def save_equity_snapshot(self, equity, drawdown):
        snap = EquitySnapshot(timestamp=time.time(), equity=equity, drawdown_pct=drawdown)
        await save_equity_snapshot(snap)

    async def get_trades(self, limit=100, offset=0):
        return await get_trades(limit=limit, offset=offset)

    async def get_equity_curve(self, limit=500):
        return await get_equity_curve(limit=limit)


async def main():
    """Initialize everything and start."""
    logger.info("Initializing Xiaoxiao Trading Bot...")

    # Database
    db = Database(config.DB_PATH)
    await db.init_db()

    # Engine components — DataFeed needs explicit init
    data_feed = DataFeed()
    await data_feed.initialize()

    from engine.broker_plugins.delta_exchange_plugin import DeltaExchangePlugin
    from engine.websocket_manager import WebSocketManager

    delta_plugin = DeltaExchangePlugin()
    await delta_plugin.initialize()
    ws_manager = WebSocketManager(delta_plugin)

    paper_trader = PaperTrader(starting_balance=config.STARTING_CAPITAL)
    position_sizer = PositionSizer()
    risk_manager = RiskManager(starting_equity=config.STARTING_CAPITAL)
    reset_loop_inst = ResetLoop()
    backtester = Backtester(data_feed)

    # AI Engine (NVIDIA NIM)
    from engine.ai_engine import AIEngine
    ai_engine = AIEngine()

    # AI Optimizer (Asynchronous Background Optimizer)
    ai_optimizer = AIOptimizer(mode="auto")

    # Strategy Manager
    from engine.strategy_manager import StrategyManager
    strategy_mgr = StrategyManager()

    # Built-in strategies
    strategies = [
        EMACrossStrategy(),
        RSIRevertStrategy(),
        BollingerBreakoutStrategy(),
    ]

    # Load custom strategies from disk
    custom = strategy_mgr.load_custom_strategies()
    if custom:
        strategies.extend(custom)
        logger.info(f"Loaded {len(custom)} custom strategies")

    # Shared state
    state = {
        "data_feed": data_feed,
        "paper_trader": paper_trader,
        "position_sizer": position_sizer,
        "risk_manager": risk_manager,
        "reset_loop": reset_loop_inst,
        "backtester": backtester,
        "strategies": strategies,
        "db": db,
        "ai_engine": ai_engine,
        "ai_optimizer": ai_optimizer,
        "strategy_manager": strategy_mgr,
        "running": False,
        "start_time": None,
        "current_prices": {},
        "ws_connected": True,
    }

    # WebSocket tick callback
    async def on_tick(symbol: str, price: float):
        state["current_prices"][symbol] = price
        
        # Construct a pseudo-candle for the UI chart
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
            "candle": candle_obj,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

    await ws_manager.start(config.TRADING_PAIRS, on_tick)

    # Share state with API
    set_engine_state(state)

    # Start API server
    api_config = uvicorn.Config(
        app, host=config.API_HOST, port=config.API_PORT,
        log_level="info", access_log=False,
    )
    api_server = uvicorn.Server(api_config)

    logger.info(f"Starting API server on http://{config.API_HOST}:{config.API_PORT}")
    logger.info(f"Dashboard: http://localhost:{config.API_PORT}")
    logger.info(f"AI Engine: {'READY' if ai_engine.available else 'DISABLED (set NVIDIA_API_KEY)'}")
    logger.info(f"Strategies: {len(strategies)} loaded ({len(custom)} custom)")
    logger.info("Press Ctrl+C to stop.")

    # Run API server, trading loop, and optimizer concurrently
    trading_task = asyncio.create_task(trading_loop(state))
    optimizer_task = asyncio.create_task(ai_optimizer.run_loop(state))

    try:
        await api_server.serve()
    except (KeyboardInterrupt, asyncio.CancelledError):
        pass
    finally:
        trading_task.cancel()
        optimizer_task.cancel()
        try:
            await trading_task
            await optimizer_task
        except asyncio.CancelledError:
            pass
        await ws_manager.stop()
        await data_feed.close()
        logger.info("Xiaoxiao shut down cleanly. Goodbye. 🧡")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nShutdown complete.")
