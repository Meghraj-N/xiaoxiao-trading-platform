"""
Xiaoxiao Trading Engine — Package Init
"""

from engine.data_feed import DataFeed
from engine.paper_trader import PaperTrader
from engine.position_sizer import PositionSizer
from engine.risk_manager import RiskManager
from engine.reset_loop import ResetLoop
from engine.backtester import Backtester

from engine.strategies.ema_cross import EMACrossStrategy
from engine.strategies.rsi_revert import RSIRevertStrategy
from engine.strategies.boll_break import BollingerBreakoutStrategy

__all__ = [
    "DataFeed", "PaperTrader", "PositionSizer", "RiskManager",
    "ResetLoop", "Backtester",
    "EMACrossStrategy", "RSIRevertStrategy", "BollingerBreakoutStrategy",
]
