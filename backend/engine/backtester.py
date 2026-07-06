"""
Walk-Forward Backtester
───────────────────────
Tests strategies on historical data with REAL fees and slippage.
70% in-sample, 30% out-of-sample. Reports honestly.

If a strategy doesn't pass the gate, it says so plainly.
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone

import numpy as np
import pandas as pd

import config
from engine.strategies.base import BaseStrategy, Signal

logger = logging.getLogger("xiaoxiao.backtester")


@dataclass
class BacktestTrade:
    entry_time: str
    exit_time: str
    symbol: str
    side: str
    entry_price: float
    exit_price: float
    quantity: float
    fees: float
    pnl_gross: float
    pnl_net: float
    exit_reason: str


@dataclass
class BacktestResult:
    strategy: str
    symbol: str
    total_trades: int
    wins: int
    losses: int
    win_rate: float
    avg_win: float
    avg_loss: float
    profit_factor: float
    sharpe_ratio: float
    max_drawdown: float
    total_return: float
    passed: bool
    gate_details: dict
    trades: list[BacktestTrade] = field(default_factory=list)
    note: str = ""


class Backtester:
    def __init__(self, data_feed):
        self.data_feed = data_feed

    async def run_backtest(
        self,
        strategy: BaseStrategy,
        symbol: str = "BTC/USDT",
        timeframe: str = "1h",
        lookback_days: int = 180,
        leverage: int = config.DEFAULT_LEVERAGE,
    ) -> BacktestResult:
        """
        Run walk-forward backtest.
        HONESTY: Every trade has real fees and slippage applied.
        """
        logger.info(f"Backtesting {strategy.name} on {symbol} ({lookback_days} days)...")

        # Calculate limit based on timeframe
        limit = lookback_days * 24  # default to hourly
        if timeframe.endswith("m"):
            limit = int(lookback_days * 24 * (60 / int(timeframe[:-1])))
        elif timeframe.endswith("h"):
            limit = int(lookback_days * 24 / int(timeframe[:-1]))
        elif timeframe.endswith("d"):
            limit = int(lookback_days / int(timeframe[:-1]))
        
        try:
            import ccxt.async_support as ccxt_async
            # Use binance for backtesting data, as it has comprehensive historical data for all timeframes
            exchange = ccxt_async.binance({'enableRateLimit': True})
            try:
                raw = await exchange.fetch_ohlcv(symbol, timeframe, limit=min(limit, 1000))
            finally:
                await exchange.close()
                
            # Convert CCXT list-of-lists to DataFrame
            if not raw:
                df = pd.DataFrame(columns=["timestamp", "open", "high", "low", "close", "volume"])
            else:
                df = pd.DataFrame(raw, columns=["timestamp", "open", "high", "low", "close", "volume"])
                df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")
        except Exception as e:
            logger.error(f"Failed to fetch data for backtest: {e}")
            return BacktestResult(
                strategy=strategy.name, symbol=symbol, total_trades=0,
                wins=0, losses=0, win_rate=0, avg_win=0, avg_loss=0,
                profit_factor=0, sharpe_ratio=0, max_drawdown=0,
                total_return=0, passed=False,
                gate_details={"error": str(e)},
                note=f"Data fetch failed: {e}"
            )

        if len(df) < 100:
            return BacktestResult(
                strategy=strategy.name, symbol=symbol, total_trades=0,
                wins=0, losses=0, win_rate=0, avg_win=0, avg_loss=0,
                profit_factor=0, sharpe_ratio=0, max_drawdown=0,
                total_return=0, passed=False,
                gate_details={"error": "Insufficient data"},
                note=f"Only {len(df)} candles available, need at least 100."
            )

        # Walk-forward split: 70% in-sample, 30% out-of-sample
        split_idx = int(len(df) * 0.7)
        oos_data = df.iloc[split_idx:].copy()

        # Run strategy on out-of-sample data
        trades = self._simulate_trades(strategy, oos_data, symbol, leverage)
        metrics = self._calculate_metrics(trades)

        # Gate check
        gate = {
            "profit_factor": bool(metrics["profit_factor"] >= config.GATE_MIN_PROFIT_FACTOR),
            "sharpe_ratio": bool(metrics["sharpe_ratio"] >= config.GATE_MIN_SHARPE),
            "max_drawdown": bool(metrics["max_drawdown"] <= config.GATE_MAX_DRAWDOWN),
            "min_trades": bool(metrics["total_trades"] >= config.GATE_MIN_TRADES),
        }
        passed = bool(all(gate.values()))

        if passed:
            logger.info(f"OK {strategy.name} PASSED the gate: {metrics}")
        else:
            failed = [k for k, v in gate.items() if not v]
            logger.warning(f"X {strategy.name} FAILED the gate on: {failed}")

        return BacktestResult(
            strategy=strategy.name, symbol=symbol,
            total_trades=metrics["total_trades"],
            wins=metrics["wins"], losses=metrics["losses"],
            win_rate=metrics["win_rate"],
            avg_win=metrics["avg_win"], avg_loss=metrics["avg_loss"],
            profit_factor=metrics["profit_factor"],
            sharpe_ratio=metrics["sharpe_ratio"],
            max_drawdown=metrics["max_drawdown"],
            total_return=metrics["total_return"],
            passed=passed, gate_details=gate, trades=trades,
            note="" if passed else "Strategy does NOT pass the quality gate. Honest assessment: it may not have an edge after fees."
        )

    def _simulate_trades(
        self, strategy: BaseStrategy, df: pd.DataFrame,
        symbol: str, leverage: int
    ) -> list[BacktestTrade]:
        """Simulate trades bar-by-bar with real fees and slippage."""
        trades = []
        in_position = False
        position_side = ""
        entry_price = 0.0
        entry_time = ""
        stop_loss = 0.0
        take_profit = 0.0

        min_bars = 50  # Need enough bars for indicators

        for i in range(min_bars, len(df)):
            window = df.iloc[:i + 1]
            bar = df.iloc[i]
            close = bar['close']
            high = bar['high']
            low = bar['low']
            bar_time = str(bar.get('timestamp', bar.name))

            if in_position:
                # Check stops
                hit_sl = False
                hit_tp = False
                exit_price = 0.0
                exit_reason = ""

                if position_side == "long":
                    if low <= stop_loss:
                        hit_sl = True
                        exit_price = stop_loss  # Honest: fill at stop, not better
                        exit_reason = "Stop Loss"
                    elif high >= take_profit:
                        hit_tp = True
                        exit_price = take_profit
                        exit_reason = "Take Profit"
                elif position_side == "short":
                    if high >= stop_loss:
                        hit_sl = True
                        exit_price = stop_loss
                        exit_reason = "Stop Loss"
                    elif low <= take_profit:
                        hit_tp = True
                        exit_price = take_profit
                        exit_reason = "Take Profit"

                if hit_sl or hit_tp:
                    # Apply slippage (always unfavorable)
                    if position_side == "long":
                        exit_price *= (1 - config.SLIPPAGE)
                    else:
                        exit_price *= (1 + config.SLIPPAGE)

                    quantity = 0.001  # Normalized
                    notional = quantity * exit_price

                    # Fees on both sides
                    entry_fee = quantity * entry_price * config.TAKER_FEE
                    exit_fee = quantity * exit_price * config.TAKER_FEE
                    total_fees = entry_fee + exit_fee

                    # PnL
                    if position_side == "long":
                        pnl_gross = (exit_price - entry_price) * quantity
                    else:
                        pnl_gross = (entry_price - exit_price) * quantity

                    pnl_net = pnl_gross - total_fees

                    trades.append(BacktestTrade(
                        entry_time=entry_time, exit_time=bar_time,
                        symbol=symbol, side=position_side,
                        entry_price=entry_price, exit_price=exit_price,
                        quantity=quantity, fees=total_fees,
                        pnl_gross=pnl_gross, pnl_net=pnl_net,
                        exit_reason=exit_reason,
                    ))
                    in_position = False

            else:
                # Generate signal
                signal = strategy.generate_signal(window)

                if signal.direction in ('long', 'short') and signal.stop_loss and signal.take_profit:
                    position_side = signal.direction
                    # Apply slippage on entry (unfavorable)
                    if position_side == "long":
                        entry_price = close * (1 + config.SLIPPAGE)
                    else:
                        entry_price = close * (1 - config.SLIPPAGE)

                    stop_loss = signal.stop_loss
                    take_profit = signal.take_profit
                    entry_time = bar_time
                    in_position = True

        return trades

    def _calculate_metrics(self, trades: list[BacktestTrade]) -> dict:
        """Calculate performance metrics from trade list."""
        if not trades:
            return {
                "total_trades": 0, "wins": 0, "losses": 0,
                "win_rate": 0, "avg_win": 0, "avg_loss": 0,
                "profit_factor": 0, "sharpe_ratio": 0,
                "max_drawdown": 0, "total_return": 0,
            }

        pnls = [t.pnl_net for t in trades]
        wins = [p for p in pnls if p > 0]
        losses = [p for p in pnls if p <= 0]

        total_trades = len(trades)
        win_count = len(wins)
        loss_count = len(losses)
        win_rate = win_count / total_trades if total_trades > 0 else 0

        avg_win = float(np.mean(wins)) if wins else 0.0
        avg_loss = float(abs(np.mean(losses))) if losses else 0.0

        gross_profit = float(sum(wins)) if wins else 0.0
        gross_loss = float(abs(sum(losses))) if losses else 0.0
        profit_factor = float(gross_profit / gross_loss) if gross_loss > 0 else 0.0

        # Sharpe (annualized, assuming hourly trades)
        returns = np.array(pnls)
        if len(returns) > 1 and float(np.std(returns)) > 0:
            sharpe_ratio = float((np.mean(returns) / np.std(returns)) * np.sqrt(252 * 24))
        else:
            sharpe_ratio = 0.0

        # Max drawdown from cumulative PnL
        cum_pnl = np.cumsum(pnls)
        peak = np.maximum.accumulate(cum_pnl)
        drawdowns = (peak - cum_pnl)
        max_dd_abs = float(np.max(drawdowns)) if len(drawdowns) > 0 else 0.0
        starting = float(config.STARTING_CAPITAL)
        max_drawdown = float(max_dd_abs / starting) if starting > 0 else 0.0

        total_return = float(sum(pnls) / starting) if starting > 0 else 0.0

        return {
            "total_trades": int(total_trades),
            "wins": int(win_count),
            "losses": int(loss_count),
            "win_rate": float(round(win_rate, 4)),
            "avg_win": float(round(avg_win, 6)),
            "avg_loss": float(round(avg_loss, 6)),
            "profit_factor": float(round(profit_factor, 4)),
            "sharpe_ratio": float(round(sharpe_ratio, 4)),
            "max_drawdown": float(round(min(max_drawdown, 1.0), 4)),
            "total_return": float(round(total_return, 4)),
        }
