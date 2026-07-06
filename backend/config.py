"""
Xiaoxiao Trading Bot — Central Configuration

All tunable parameters live here. Secrets are loaded from .env file.
Delta Exchange fees verified from https://www.delta.exchange/fees
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Load .env from project root (one level up from this file, or same dir)
# ---------------------------------------------------------------------------
_env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(_env_path)

import json
_settings_path = Path(__file__).resolve().parent / "settings.json"

def _load_settings():
    if _settings_path.exists():
        try:
            with open(_settings_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading settings.json: {e}")
    return {}

_dynamic_settings = _load_settings()

def get_setting(key: str, default):
    """Get a setting from dynamic settings, fallback to default."""
    return _dynamic_settings.get(key, default)

def update_settings(new_settings: dict):
    """Update settings in memory and persist to settings.json."""
    global _dynamic_settings
    _dynamic_settings.update(new_settings)
    
    # Update global variables in this module to reflect changes
    import sys
    this_module = sys.modules[__name__]
    for k, v in new_settings.items():
        if hasattr(this_module, k):
            setattr(this_module, k, type(getattr(this_module, k))(v))
            
    try:
        with open(_settings_path, 'w') as f:
            json.dump(_dynamic_settings, f, indent=4)
    except Exception as e:
        print(f"Error saving settings.json: {e}")

# ---------------------------------------------------------------------------
# Exchange Settings
# ---------------------------------------------------------------------------
EXCHANGE = "delta"
EXCHANGE_ID = "deltaexchange"  # CCXT exchange identifier
API_BASE = "https://api.delta.exchange/v2"
TESTNET_API = "https://testnet-api.delta.exchange"

# ---------------------------------------------------------------------------
# Supabase Configuration
# ---------------------------------------------------------------------------
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")
USE_TESTNET: bool = False

# API credentials — NEVER commit real keys
DELTA_API_KEY: str = os.getenv("DELTA_API_KEY", "")
DELTA_API_SECRET: str = os.getenv("DELTA_API_SECRET", "")

# ---------------------------------------------------------------------------
# Trading Parameters
# ---------------------------------------------------------------------------
TRADING_PAIRS: list[str] = get_setting("TRADING_PAIRS", ["BTC/USDT", "ETH/USDT", "SOL/USDT"])
TIMEFRAME: str = get_setting("TIMEFRAME", "1h")
STARTING_CAPITAL: float = get_setting("STARTING_CAPITAL", 3.0)  # USD — we're trading small on purpose

DEFAULT_LEVERAGE: int = get_setting("DEFAULT_LEVERAGE", 5)
MAX_LEVERAGE: int = get_setting("MAX_LEVERAGE", 10)

# ---------------------------------------------------------------------------
# Fee Structure (Delta Exchange Futures)
# Verified: https://www.delta.exchange/fees
# ---------------------------------------------------------------------------
MAKER_FEE: float = 0.0002   # 0.02%
TAKER_FEE: float = 0.0005   # 0.05%
SLIPPAGE: float = 0.0005    # 0.05% — conservative estimate for paper trading

# ---------------------------------------------------------------------------
# Risk Management
# ---------------------------------------------------------------------------
MAX_DRAWDOWN_PCT: float = get_setting("MAX_DRAWDOWN_PCT", 0.15)        # 15% — pause trading if breached
DAILY_LOSS_LIMIT_PCT: float = get_setting("DAILY_LOSS_LIMIT_PCT", 0.03)    # 3% of equity per day
MAX_OPEN_POSITIONS: int = get_setting("MAX_OPEN_POSITIONS", 2)           # Small account = concentrated bets

# ---------------------------------------------------------------------------
# Position Sizing — Fractional Kelly
# ---------------------------------------------------------------------------
KELLY_FRACTION: float = 0.5    # Half-Kelly for safety
KELLY_MIN_TRADES: int = 30     # Need this many trades before Kelly kicks in
MIN_RISK_PCT: float = get_setting("MIN_RISK_PCT", 0.01)     # Floor: risk at least 1% per trade
MAX_RISK_PCT: float = get_setting("MAX_RISK_PCT", 0.02)     # Ceiling: never risk more than 2%

# ---------------------------------------------------------------------------
# Reset Loop
# ---------------------------------------------------------------------------
RESET_DRAWDOWN_THRESHOLD: float = 0.10  # Enter reset mode at 10% drawdown
RESET_TRADE_COUNT: int = 20             # Number of trades in reduced mode
RESET_SIZE_MULTIPLIER: float = 0.25     # 25% of Kelly during reset
MAX_RESET_CYCLES: int = 3               # Disable strategy after 3 failed resets

# ---------------------------------------------------------------------------
# Backtester Gate Thresholds
# ---------------------------------------------------------------------------
GATE_MIN_PROFIT_FACTOR: float = 1.2
GATE_MIN_SHARPE: float = 0.5
GATE_MAX_DRAWDOWN: float = 0.20
GATE_MIN_TRADES: int = 30

# ---------------------------------------------------------------------------
# API / Server
# ---------------------------------------------------------------------------
API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
API_PORT: int = int(os.getenv("PORT", os.getenv("API_PORT", "8000")))
CORS_ORIGINS: list[str] = [
    "http://localhost:5173",   # Vite dev server
    "http://127.0.0.1:5173",
]

# ---------------------------------------------------------------------------
# AI Integration (NVIDIA NIM & OpenRouter)
# ---------------------------------------------------------------------------
NVIDIA_API_KEY: str = os.getenv("NVIDIA_API_KEY", "")
NVIDIA_BASE_URL: str = "https://integrate.api.nvidia.com/v1"

OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"

# Default provider choice
AI_PROVIDER: str = get_setting("AI_PROVIDER", "nvidia") # "nvidia" or "openrouter"

# Available models on NVIDIA NIM
AI_MODELS: dict[str, str] = {
    "llama-3.1-405b": "meta/llama-3.1-405b-instruct",
    "nemotron-340b": "nvidia/nemotron-4-340b-instruct",
    "mixtral-8x22b": "mistralai/mixtral-8x22b-instruct-v0.1",
    "gemma-2-27b": "google/gemma-2-27b-it",
    # OpenRouter additions
    "claude-3.5-sonnet": "anthropic/claude-3.5-sonnet",
    "gpt-4o": "openai/gpt-4o",
}
DEFAULT_AI_MODEL: str = "meta/llama-3.1-405b-instruct"

# ---------------------------------------------------------------------------
# Custom Strategies
# ---------------------------------------------------------------------------
CUSTOM_STRATEGIES_DIR: str = str(Path(__file__).resolve().parent / "custom_strategies")

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------
DB_PATH: str = os.getenv("DB_PATH", str(Path(__file__).resolve().parent / "xiaoxiao.db"))

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
LOG_FORMAT: str = "%(asctime)s | %(levelname)-8s | %(name)-20s | %(message)s"
