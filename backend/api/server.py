"""
Xiaoxiao API — FastAPI REST + WebSocket Server
───────────────────────────────────────────────
Serves the dashboard with live data.
- REST endpoints for trades, equity, strategies, risk status
- WebSocket for real-time price/trade streaming
- CORS enabled for Vite dev server
"""

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import httpx

import config

logger = logging.getLogger("xiaoxiao.api")

app = FastAPI(
    title="Xiaoxiao Trading Bot API",
    description="Honest AI trading bot — real prices, fake money, real fees",
    version="1.0.0",
)

# CORS for Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS + ["*"],  # Allow all during dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global state references (set by main.py) ──
_engine_state: dict[str, Any] = {}
_ws_clients: list[WebSocket] = []


def set_engine_state(state: dict):
    """Called by main.py to share engine references with the API."""
    global _engine_state
    _engine_state = state


async def broadcast(message: dict):
    """Send a message to all connected WebSocket clients."""
    dead = []
    data = json.dumps(message, default=str)
    for ws in _ws_clients:
        try:
            await ws.send_text(data)
        except Exception:
            dead.append(ws)
    for ws in dead:
        _ws_clients.remove(ws)


# ── REST Endpoints ──

@app.get("/api/status")
async def get_status():
    paper_trader = _engine_state.get("paper_trader")
    risk_mgr = _engine_state.get("risk_manager")
    running = _engine_state.get("running", False)
    start_time = _engine_state.get("start_time")

    prices = _engine_state.get("current_prices", {})
    equity = paper_trader.get_equity(prices) if paper_trader else config.STARTING_CAPITAL
    risk = risk_mgr.get_risk_dict() if risk_mgr else {}

    return {
        "running": running,
        "equity": round(equity, 6),
        "starting_capital": config.STARTING_CAPITAL,
        "pnl": round(equity - config.STARTING_CAPITAL, 6),
        "uptime_seconds": (datetime.now(timezone.utc) - start_time).total_seconds() if start_time else 0,
        "exchange": config.EXCHANGE,
        "testnet": config.USE_TESTNET,
        "risk": risk,
    }


@app.get("/api/trades")
async def get_trades(limit: int = Query(50, ge=1, le=500), offset: int = Query(0, ge=0)):
    db = _engine_state.get("db")
    if db:
        trades = await db.get_trades(limit=limit, offset=offset)
        return {"trades": trades, "total": len(trades)}

    paper_trader = _engine_state.get("paper_trader")
    if paper_trader:
        history = paper_trader.trade_history[offset:offset + limit]
        return {
            "trades": [
                {
                    "timestamp": t.timestamp,
                    "symbol": t.symbol,
                    "side": t.side,
                    "entry_price": t.entry_price,
                    "exit_price": t.exit_price,
                    "quantity": t.quantity,
                    "leverage": t.leverage,
                    "fees": t.fees,
                    "pnl": t.pnl_net,
                    "strategy": t.strategy_name,
                    "exit_reason": t.exit_reason,
                }
                for t in history
            ],
            "total": len(paper_trader.trade_history),
        }
    return {"trades": [], "total": 0}


@app.get("/api/equity")
async def get_equity():
    db = _engine_state.get("db")
    if db:
        curve = await db.get_equity_curve(limit=500)
        return {"equity_curve": curve}
    return {"equity_curve": []}


@app.get("/api/strategies")
async def get_strategies():
    strategies = _engine_state.get("strategies", [])
    reset_loop = _engine_state.get("reset_loop")
    reset_status = reset_loop.get_status() if reset_loop else {}

    result = []
    for s in strategies:
        name = s.name
        rs = reset_status.get(name, {})
        result.append({
            "name": name,
            "active": not rs.get("disabled", False),
            "in_reset": rs.get("in_reset", False),
            "reset_cycle": rs.get("reset_cycle", 0),
        })
    return {"strategies": result}


@app.get("/api/prices")
async def get_prices():
    prices = _engine_state.get("current_prices", {})
    return {"prices": prices}


@app.get("/api/positions")
async def get_positions():
    paper_trader = _engine_state.get("paper_trader")
    if paper_trader:
        positions = []
        for p in paper_trader.open_positions.values():
            positions.append({
                "id": p.id,
                "symbol": p.symbol,
                "side": p.side,
                "entry_price": p.entry_price,
                "quantity": p.quantity,
                "leverage": p.leverage,
                "margin": p.margin,
                "stop_loss": p.stop_loss,
                "take_profit": p.take_profit,
                "strategy": p.strategy_name,
                "entry_time": p.entry_time,
            })
        return {"positions": positions}
    return {"positions": []}


@app.get("/api/risk")
async def get_risk():
    risk_mgr = _engine_state.get("risk_manager")
    if risk_mgr:
        return risk_mgr.get_risk_dict()
    return {"trading_allowed": False, "drawdown_pct": 0, "daily_loss_pct": 0}


@app.get("/api/settings")
async def get_settings_endpoint():
    import config
    def redact(val):
        return "********" if val else ""

    return {
        "STARTING_CAPITAL": config.STARTING_CAPITAL,
        "DEFAULT_LEVERAGE": config.DEFAULT_LEVERAGE,
        "MAX_DRAWDOWN_PCT": config.MAX_DRAWDOWN_PCT,
        "DAILY_LOSS_LIMIT_PCT": config.DAILY_LOSS_LIMIT_PCT,
        "MAX_OPEN_POSITIONS": config.MAX_OPEN_POSITIONS,
        "MIN_RISK_PCT": config.MIN_RISK_PCT,
        "MAX_RISK_PCT": config.MAX_RISK_PCT,
        "DELTA_API_KEY": redact(config.DELTA_API_KEY),
        "DELTA_API_SECRET": redact(config.DELTA_API_SECRET),
        "NVIDIA_API_KEY": redact(config.NVIDIA_API_KEY),
        "OPENROUTER_API_KEY": redact(config.OPENROUTER_API_KEY),
        "AI_PROVIDER": config.AI_PROVIDER,
        "DEFAULT_AI_MODEL": config.DEFAULT_AI_MODEL
    }

class AIChatRequest(BaseModel):
    message: str
    history: list[dict] = []

@app.post("/api/ai/chat")
async def ai_chat(req: AIChatRequest):
    ai_engine = _engine_state.get("ai_engine")
    if not ai_engine or not ai_engine.available:
        return {"response": "AI Engine is not configured or unavailable. Check API keys."}
    
    context = json.dumps(req.history[-3:]) if req.history else ""
    response = await ai_engine.chat(req.message, context)
    return {"response": response}

class AIStrategyRequest(BaseModel):
    prompt: str

@app.post("/api/ai/strategy/generate")
async def ai_strategy_generate(req: AIStrategyRequest):
    ai_engine = _engine_state.get("ai_engine")
    if not ai_engine or not ai_engine.available:
        return {"error": "AI Engine is not configured"}
    
    res = await ai_engine.generate_strategy_code(req.prompt)
    return res

class RiskSettingsRequest(BaseModel):
    MAX_DRAWDOWN_PCT: float
    DAILY_LOSS_LIMIT_PCT: float
    MAX_OPEN_POSITIONS: int
    DEFAULT_LEVERAGE: int

@app.post("/api/risk/settings")
async def update_risk_settings(req: RiskSettingsRequest):
    import config
    config.update_settings(req.dict())
    
    risk_mgr = _engine_state.get("risk_manager")
    if risk_mgr:
        risk_mgr.max_drawdown = req.MAX_DRAWDOWN_PCT
        risk_mgr.daily_loss_limit = req.DAILY_LOSS_LIMIT_PCT
        risk_mgr.max_positions = req.MAX_OPEN_POSITIONS
        
    return {"status": "success", "message": "Risk settings updated."}

@app.post("/api/risk/liquidate")
async def risk_liquidate():
    paper_trader = _engine_state.get("paper_trader")
    if not paper_trader:
        return {"error": "Trader engine not running"}
    
    count = 0
    for pos_id, pos in list(paper_trader.open_positions.items()):
        current_price = _engine_state.get("current_prices", {}).get(pos.symbol, pos.entry_price)
        await paper_trader.close_position(pos.symbol, current_price, "LIQUIDATE_ALL")
        count += 1
        
    risk_mgr = _engine_state.get("risk_manager")
    if risk_mgr:
        risk_mgr.trading_allowed = False
        
    return {"status": "success", "message": f"Liquidated {count} positions and halted trading."}

@app.get("/api/options/chain")
async def get_options_chain(symbol: str = Query("BTC"), price: float = Query(0.0)):
    """Fetch live option chain data from Delta Exchange."""
    from engine.options_engine import options_engine
    
    if price == 0.0:
        # Fallback to current memory price if not provided
        price = _engine_state.get("current_prices", {}).get(f"{symbol}/USDT", 60000)

    try:
        chain_data = await options_engine.get_option_chain(symbol, price)
        return {"chain": chain_data}
    except Exception as e:
        logger.error(f"Error fetching option chain: {e}")
        return {"chain": []}

@app.get("/api/options/analytics/{symbol}")
async def get_options_analytics(symbol: str):
    from engine.options_engine import options_engine
    price = _engine_state.get("current_prices", {}).get(f"{symbol}/USDT", 60000)
    
    chain = await options_engine.get_option_chain(symbol, price)
    if not chain:
        return {"max_pain": 0, "pcr": 0}
        
    max_pain = options_engine.calculate_max_pain(chain)
    
    call_oi = sum(c["oi"] for c in chain if c["type"] == "CALL")
    put_oi = sum(c["oi"] for c in chain if c["type"] == "PUT")
    pcr = put_oi / call_oi if call_oi > 0 else 0
    
    return {
        "max_pain": max_pain,
        "pcr": round(pcr, 2),
        "call_oi": call_oi,
        "put_oi": put_oi
    }

class StrategyLeg(BaseModel):
    type: str
    strike: float
    premium: float
    quantity: int
    side: str

class StrategyRequest(BaseModel):
    symbol: str
    legs: list[StrategyLeg]

@app.post("/api/options/builder/analyze")
async def analyze_strategy(req: StrategyRequest):
    from engine.strategy_builder import strategy_builder
    
    # Get current price
    price = _engine_state.get("current_prices", {}).get(f"{req.symbol}/USDT", 60000)
    
    # Analyze payoff
    # Need to convert BaseModel to dict list
    legs_dict = [leg.dict() for leg in req.legs]
    analysis = strategy_builder.calculate_payoff_curve(legs_dict, price)
    
    return analysis

@app.post("/api/options/builder/execute")
async def execute_strategy(req: StrategyRequest):
    from engine.paper_trader import paper_trader
    
    results = []
    for leg in req.legs:
        # Generate an option symbol (simplified)
        opt_symbol = f"{req.symbol}-{leg.strike}-{leg.type}"
        
        # Determine trade size / cost
        cost = leg.premium * leg.quantity
        
        # Execute paper trade
        action = 'long' if leg.side.upper() == 'BUY' else 'short'
        trade_res = await paper_trader.execute_trade(
            symbol=opt_symbol,
            side=action,
            size=leg.quantity,
            price=leg.premium
        )
        results.append(trade_res)
        
    return {"status": "success", "executed_legs": len(results), "trades": results}

class StrategyPortfolioRequest(BaseModel):
    name: str
    symbol: str
    legs: list[StrategyLeg]

@app.post("/api/options/portfolio/save")
async def save_strategy(req: StrategyPortfolioRequest):
    from db.models import save_strategy_portfolio
    legs_dict = [leg.dict() for leg in req.legs]
    await save_strategy_portfolio(req.name, req.symbol, legs_dict)
    return {"status": "success"}

@app.get("/api/options/portfolio/list")
async def list_strategies():
    from db.models import get_saved_strategies
    import json
    strategies = await get_saved_strategies()
    # Decode json legs
    for s in strategies:
        try:
            s['legs'] = json.loads(s['legs_json'])
        except:
            s['legs'] = []
    return {"status": "success", "strategies": strategies}

@app.delete("/api/options/portfolio/{name}")
async def delete_strategy(name: str):
    from db.models import delete_saved_strategy
    success = await delete_saved_strategy(name)
    return {"status": "success", "deleted": success}

@app.get("/api/options/greeks/history")
async def get_greeks_history(symbol: str = "BTC"):
    """Mock historical greeks for ATM strike for charting"""
    import random
    history = []
    base_time = int(time.time()) - (100 * 3600) # 100 hours ago
    
    # Starting values
    iv = 45.0
    delta = 0.50
    gamma = 0.0001
    theta = -2.5
    vega = 1.2

    for i in range(100):
        t = base_time + (i * 3600)
        
        # Random walks
        iv += random.uniform(-1, 1)
        delta += random.uniform(-0.02, 0.02)
        delta = max(0.01, min(0.99, delta))
        gamma += random.uniform(-0.00001, 0.00001)
        gamma = max(0.00001, gamma)
        theta += random.uniform(-0.5, 0.5)
        vega += random.uniform(-0.1, 0.1)

        history.append({
            "time": t,
            "iv": round(iv, 2),
            "delta": round(delta, 3),
            "gamma": round(gamma, 5),
            "theta": round(theta, 2),
            "vega": round(vega, 2)
        })
        
    return {"status": "success", "history": history}

@app.post("/api/settings")
async def update_settings_endpoint(request: Request):
    try:
        data = await request.json()
        import config
        
        updates = {}
        for key, value in data.items():
            if key in ["DELTA_API_KEY", "DELTA_API_SECRET", "NVIDIA_API_KEY", "OPENROUTER_API_KEY"]:
                if value and value != "********":
                    updates[key] = value
            else:
                updates[key] = value
                
        if updates:
            config.update_settings(updates)
            
            # Update instances that depend on these configs if needed
            paper_trader = _engine_state.get("paper_trader")
            if paper_trader and "STARTING_CAPITAL" in updates:
                paper_trader.update_starting_capital(updates["STARTING_CAPITAL"])

            # If AI settings changed, actively reload the AI Engine in memory
            if any(k in updates for k in ["NVIDIA_API_KEY", "OPENROUTER_API_KEY", "AI_PROVIDER"]):
                if "ai_engine" in _engine_state:
                    logger.info("AI Provider/Keys changed. Reloading AIEngine...")
                    from engine.ai_engine import AIEngine
                    _engine_state["ai_engine"] = AIEngine()

            # Let's broadcast the new settings so UI can refresh
            await broadcast({
                "type": "settings_updated",
                "settings": updates
            })
            
        return {"status": "success", "settings": updates}
    except Exception as e:
        logger.error(f"Error updating settings: {e}")
        return {"status": "error", "message": str(e)}


@app.post("/api/control/start")
async def start_bot(request: Request):
    try:
        data = await request.json()
        strategy = data.get("strategy", "All")
    except Exception:
        strategy = "All"
        
    _engine_state["running"] = True
    _engine_state["active_strategy"] = strategy
    _engine_state["start_time"] = datetime.now(timezone.utc)
    await broadcast({"type": "status_change", "running": True, "strategy": strategy})
    logger.info(f"Bot START command received via API. Strategy: {strategy}")
    return {"status": "started", "strategy": strategy}


@app.post("/api/control/stop")
async def stop_bot():
    _engine_state["running"] = False
    await broadcast({"type": "status_change", "running": False})
    logger.info("Bot STOP command received via API")
    return {"status": "stopped"}


@app.post("/api/backtest/{strategy_name}")
async def run_backtest_endpoint(strategy_name: str, symbol: str = Query("BTC/USDT"), timeframe: str = Query("1h")):
    backtester = _engine_state.get("backtester")
    strategies = _engine_state.get("strategies", [])

    strategy = None
    for s in strategies:
        # Match using lowercase and replaced spaces, or exact name
        if s.name.lower().replace(" ", "_") == strategy_name.lower().replace(" ", "_") or s.name == strategy_name:
            strategy = s
            break
            
    if not strategy:
        return {"error": f"Strategy {strategy_name} not found"}

    if not backtester:
        return {"error": "Backtester not initialized"}

    result = await backtester.run_backtest(strategy, symbol=symbol, timeframe=timeframe)
    # Save to DB
    from db.models import save_backtest_result
    await save_backtest_result({
        "strategy_name": result.strategy,
        "symbol": result.symbol,
        "timeframe": timeframe,
        "total_trades": result.total_trades,
        "wins": result.wins,
        "losses": result.losses,
        "win_rate": result.win_rate,
        "profit_factor": result.profit_factor,
        "sharpe_ratio": result.sharpe_ratio,
        "max_drawdown": result.max_drawdown,
        "total_return": result.total_return,
        "passed": result.passed,
        "note": result.note,
    })

    return {
        "strategy": result.strategy,
        "symbol": result.symbol,
        "timeframe": timeframe,
        "total_trades": result.total_trades,
        "win_rate": result.win_rate,
        "profit_factor": result.profit_factor,
        "sharpe": result.sharpe_ratio,
        "max_drawdown": result.max_drawdown,
        "total_return": result.total_return,
        "passed": result.passed,
        "gate_details": result.gate_details,
        "note": result.note,
    }

# ── AI Endpoints ──

@app.get("/api/ml/features")
async def get_ml_features(symbol: str = Query("BTC/USDT"), limit: int = Query(200, ge=100, le=1000)):
    data_feed = _engine_state.get("data_feed")
    if not data_feed:
        return {"error": "Data feed not initialized"}
        
    try:
        raw_ohlcv = await data_feed.fetch_ohlcv(symbol, limit=limit)
        import pandas as pd
        from engine.ml_features import FeatureGenerator
        import numpy as np
        
        df = pd.DataFrame(raw_ohlcv, columns=["timestamp", "open", "high", "low", "close", "volume"])
        df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")
        
        # Generate features
        df_features = FeatureGenerator.generate_features(df, drop_nan=True)
        
        # Normalize
        cols_to_norm = [c for c in df_features.columns if c not in ["timestamp", "open", "high", "low", "close", "volume"]]
        df_norm = FeatureGenerator.normalize(df_features, cols_to_norm)
        
        # We need to replace NaNs with None for JSON serialization
        df_norm = df_norm.replace({np.nan: None, pd.NA: None})
        
        # Convert timestamp to string
        df_norm["timestamp"] = df_norm["timestamp"].dt.strftime("%Y-%m-%dT%H:%M:%SZ")
        
        return {
            "symbol": symbol,
            "count": len(df_norm),
            "features": cols_to_norm,
            "data": df_norm.to_dict(orient="records")
        }
    except Exception as e:
        logger.error(f"Error generating ML features: {e}", exc_info=True)
        return {"error": str(e)}

@app.get("/api/ai/models")
async def get_ai_models():
    ai_engine = _engine_state.get("ai_engine")
    if not ai_engine:
        return {"models": [], "available": False}
    return {"models": ai_engine.get_models(), "available": ai_engine.available}


@app.post("/api/ai/analyze")
async def ai_analyze_market(body: dict):
    ai_engine = _engine_state.get("ai_engine")
    if not ai_engine or not ai_engine.available:
        return {"error": "AI not configured. Set NVIDIA_API_KEY in .env"}

    symbol = body.get("symbol", "BTC/USDT")
    model = body.get("model")

    # Build candle summary from current prices
    prices = _engine_state.get("current_prices", {})
    data_feed = _engine_state.get("data_feed")
    candle_summary = f"Current price: ${prices.get(symbol, 'N/A')}"

    if data_feed:
        try:
            raw = await data_feed.fetch_ohlcv(symbol, "1h", limit=24)
            if raw:
                import pandas as pd
                df = pd.DataFrame(raw, columns=["ts", "open", "high", "low", "close", "volume"])
                candle_summary = (
                    f"Symbol: {symbol}\n"
                    f"Current Price: ${df.iloc[-1]['close']:.2f}\n"
                    f"24h High: ${df['high'].max():.2f}\n"
                    f"24h Low: ${df['low'].min():.2f}\n"
                    f"24h Change: {((df.iloc[-1]['close'] - df.iloc[0]['open']) / df.iloc[0]['open'] * 100):.2f}%\n"
                    f"Avg Volume: {df['volume'].mean():.2f}\n"
                    f"Last 5 closes: {', '.join(f'${c:.2f}' for c in df['close'].tail(5))}"
                )
        except Exception as e:
            logger.error(f"Failed to fetch data for AI analysis: {e}")

    result = await ai_engine.analyze_market(symbol, candle_summary, model)
    return {"analysis": result, "symbol": symbol}


@app.post("/api/ai/suggest")
async def ai_suggest_strategy(body: dict):
    ai_engine = _engine_state.get("ai_engine")
    if not ai_engine or not ai_engine.available:
        return {"error": "AI not configured. Set NVIDIA_API_KEY in .env"}

    market_analysis = body.get("market_analysis", {})
    model = body.get("model")
    existing = [s.name for s in _engine_state.get("strategies", [])]

    result = await ai_engine.suggest_strategy(market_analysis, existing, model)
    return {"suggestion": result}


@app.post("/api/ai/generate")
async def ai_generate_strategy(body: dict):
    ai_engine = _engine_state.get("ai_engine")
    if not ai_engine or not ai_engine.available:
        return {"error": "AI not configured. Set NVIDIA_API_KEY in .env"}

    description = body.get("description", "")
    model = body.get("model")

    if not description:
        return {"error": "Provide a strategy description"}

    result = await ai_engine.generate_strategy_code(description, model)
    return {"generated": result, "model_used": ai_engine._resolve_model(model)}


@app.post("/api/ai/improve")
async def ai_improve_strategy(body: dict):
    ai_engine = _engine_state.get("ai_engine")
    if not ai_engine or not ai_engine.available:
        return {"error": "AI not configured. Set NVIDIA_API_KEY in .env"}

    strategy_name = body.get("strategy_name", "")
    backtest_results = body.get("backtest_results", {})
    model = body.get("model")

    # Try to find strategy code
    strategy_mgr = _engine_state.get("strategy_manager")
    code = ""
    if strategy_mgr:
        code = strategy_mgr.get_strategy_code(strategy_name) or ""

    result = await ai_engine.improve_strategy(strategy_name, code, backtest_results, model)
    return {"improvement": result}


@app.post("/api/ai/explain")
async def ai_explain_trade(body: dict):
    ai_engine = _engine_state.get("ai_engine")
    if not ai_engine or not ai_engine.available:
        return {"error": "AI not configured. Set NVIDIA_API_KEY in .env"}

    trade_data = body.get("trade", {})
    model = body.get("model")
    result = await ai_engine.explain_trade(trade_data, model)
    return {"explanation": result}


@app.post("/api/ai/chat")
async def ai_chat(body: dict):
    ai_engine = _engine_state.get("ai_engine")
    if not ai_engine or not ai_engine.available:
        return {"error": "AI not configured. Set NVIDIA_API_KEY in .env"}

    message = body.get("message", "")
    model = body.get("model")
    context = body.get("context", "")
    history = body.get("history", [])

    if not message:
        return {"error": "Provide a message"}

    response = await ai_engine.chat(message, context, model, history=history)
    return {"response": response, "model": ai_engine._resolve_model(model)}


# ── Custom Strategy Endpoints ──

@app.get("/api/custom-strategies")
async def list_custom_strategies():
    from db.models import get_custom_strategies
    strategies = await get_custom_strategies()
    return {"strategies": strategies}


@app.post("/api/custom-strategies")
async def create_custom_strategy(body: dict):
    from db.models import save_custom_strategy
    name = body.get("name", "")
    description = body.get("description", "")
    code = body.get("code", "")
    ai_model = body.get("ai_model_used", "")

    if not name or not code:
        return {"error": "Name and code are required"}

    # Save to DB
    row_id = await save_custom_strategy(name, description, code, ai_model)

    # Save to file and try loading
    strategy_mgr = _engine_state.get("strategy_manager")
    if strategy_mgr:
        try:
            filepath = strategy_mgr.save_strategy_code(name, code)
            strategy = strategy_mgr.reload_strategy(name)
            if strategy:
                # Add to active strategies
                strategies = _engine_state.get("strategies", [])
                # Remove old version if exists
                strategies = [s for s in strategies if s.name != strategy.name]
                strategies.append(strategy)
                _engine_state["strategies"] = strategies
                return {"id": row_id, "status": "saved_and_loaded", "name": strategy.name}
        except Exception as e:
            return {"id": row_id, "status": "saved_but_load_failed", "error": str(e)}

    return {"id": row_id, "status": "saved"}


@app.put("/api/custom-strategies/{name}")
async def update_custom_strategy(name: str, body: dict):
    from db.models import save_custom_strategy
    description = body.get("description", "")
    code = body.get("code", "")
    ai_model = body.get("ai_model_used", "")

    if not code:
        return {"error": "Code is required"}

    row_id = await save_custom_strategy(name, description, code, ai_model)

    strategy_mgr = _engine_state.get("strategy_manager")
    if strategy_mgr:
        try:
            strategy_mgr.save_strategy_code(name, code)
            strategy = strategy_mgr.reload_strategy(name)
            if strategy:
                strategies = _engine_state.get("strategies", [])
                strategies = [s for s in strategies if s.name != strategy.name]
                strategies.append(strategy)
                _engine_state["strategies"] = strategies
        except Exception as e:
            logger.error(f"Failed to reload strategy {name}: {e}")

    return {"id": row_id, "status": "updated"}


@app.delete("/api/custom-strategies/{name}")
async def remove_custom_strategy(name: str):
    from db.models import delete_custom_strategy
    deleted = await delete_custom_strategy(name)
    strategy_mgr = _engine_state.get("strategy_manager")
    if strategy_mgr:
        strategy_mgr.delete_strategy(name)
    # Remove from active strategies
    strategies = _engine_state.get("strategies", [])
    _engine_state["strategies"] = [s for s in strategies if s.name != name]
    return {"deleted": deleted}


@app.get("/api/backtest-results")
async def list_backtest_results(strategy: str = Query(None), limit: int = Query(50)):
    from db.models import get_backtest_results
    results = await get_backtest_results(strategy_name=strategy, limit=limit)
    return {"results": results}


# ── Settings ──


# ── WebSocket ──

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    _ws_clients.append(ws)
    logger.info(f"WebSocket client connected. Total: {len(_ws_clients)}")

    # Send initial state
    try:
        await ws.send_text(json.dumps({
            "type": "status_change",
            "running": _engine_state.get("running", False),
        }))
    except Exception:
        pass

    try:
        while True:
            data = await ws.receive_text()
            # Handle any client messages if needed
    except WebSocketDisconnect:
        _ws_clients.remove(ws)
        logger.info(f"WebSocket client disconnected. Total: {len(_ws_clients)}")


# ── Serve dashboard.html from project root ──
@app.get("/")
async def serve_dashboard():
    import os
    dashboard_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "dashboard.html")
    dashboard_path = os.path.abspath(dashboard_path)
    if os.path.exists(dashboard_path):
        return FileResponse(dashboard_path, media_type="text/html")
    return {"message": "Dashboard not found. Open dashboard.html directly in your browser."}

