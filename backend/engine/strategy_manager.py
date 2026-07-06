"""
Strategy Manager — Dynamic Strategy CRUD
─────────────────────────────────────────
Loads, saves, enables, and disables custom strategies at runtime.
Custom strategies are stored as Python files in custom_strategies/
and loaded dynamically using importlib.
"""

import importlib.util
import logging
import os
import sys
import time
from pathlib import Path
from typing import Any

import config
from engine.strategies.base import BaseStrategy

logger = logging.getLogger("xiaoxiao.strategy_manager")


class StrategyManager:
    """
    Manages both built-in and custom strategies.
    Custom strategies are Python files that define a class inheriting BaseStrategy.
    """

    def __init__(self):
        self.strategies_dir = Path(config.CUSTOM_STRATEGIES_DIR)
        self.strategies_dir.mkdir(parents=True, exist_ok=True)
        self._custom_strategies: dict[str, BaseStrategy] = {}
        logger.info(f"Strategy Manager initialized. Custom dir: {self.strategies_dir}")

    def load_custom_strategies(self) -> list[BaseStrategy]:
        """Load all custom strategy files from the custom_strategies directory."""
        loaded = []
        for filepath in self.strategies_dir.glob("*.py"):
            if filepath.name.startswith("_"):
                continue
            try:
                strategy = self._load_strategy_file(filepath)
                if strategy:
                    self._custom_strategies[strategy.name] = strategy
                    loaded.append(strategy)
                    logger.info(f"Loaded custom strategy: {strategy.name}")
            except Exception as e:
                logger.error(f"Failed to load {filepath.name}: {e}")
        return loaded

    def _load_strategy_file(self, filepath: Path) -> BaseStrategy | None:
        """Dynamically import a strategy from a Python file."""
        module_name = f"custom_strategy_{filepath.stem}"
        try:
            spec = importlib.util.spec_from_file_location(module_name, filepath)
            if spec is None or spec.loader is None:
                return None

            module = importlib.util.module_from_spec(spec)
            sys.modules[module_name] = module
            spec.loader.exec_module(module)

            # Find the strategy class (subclass of BaseStrategy)
            for attr_name in dir(module):
                attr = getattr(module, attr_name)
                if (isinstance(attr, type) and
                    issubclass(attr, BaseStrategy) and
                    attr is not BaseStrategy):
                    return attr()

            logger.warning(f"No BaseStrategy subclass found in {filepath.name}")
            return None
        except Exception as e:
            logger.error(f"Error loading strategy from {filepath}: {e}")
            return None

    def save_strategy_code(self, name: str, code: str) -> str:
        """
        Save strategy code to a Python file.
        Returns the filepath.
        """
        # Sanitize filename
        safe_name = "".join(c if c.isalnum() or c == "_" else "_" for c in name.lower())
        filepath = self.strategies_dir / f"{safe_name}.py"

        # Validate the code contains a BaseStrategy subclass
        if "BaseStrategy" not in code or "generate_signal" not in code:
            raise ValueError(
                "Strategy code must contain a class inheriting BaseStrategy "
                "with a generate_signal method"
            )

        # Add import header if missing
        if "from engine.strategies.base import" not in code:
            header = (
                "import pandas as pd\n"
                "import numpy as np\n"
                "from engine.strategies.base import BaseStrategy, Signal\n"
                "import logging\n\n"
                f"logger = logging.getLogger('xiaoxiao.strategy.{safe_name}')\n\n"
            )
            code = header + code

        filepath.write_text(code, encoding="utf-8")
        logger.info(f"Saved strategy '{name}' to {filepath}")
        return str(filepath)

    def delete_strategy(self, name: str) -> bool:
        """Delete a custom strategy file."""
        safe_name = "".join(c if c.isalnum() or c == "_" else "_" for c in name.lower())
        filepath = self.strategies_dir / f"{safe_name}.py"

        if filepath.exists():
            filepath.unlink()
            if name in self._custom_strategies:
                del self._custom_strategies[name]
            logger.info(f"Deleted strategy: {name}")
            return True
        return False

    def get_strategy_code(self, name: str) -> str | None:
        """Read the source code of a custom strategy."""
        safe_name = "".join(c if c.isalnum() or c == "_" else "_" for c in name.lower())
        filepath = self.strategies_dir / f"{safe_name}.py"
        if filepath.exists():
            return filepath.read_text(encoding="utf-8")
        return None

    def list_custom_strategies(self) -> list[dict[str, Any]]:
        """List all custom strategy files with metadata."""
        result = []
        for filepath in self.strategies_dir.glob("*.py"):
            if filepath.name.startswith("_"):
                continue
            stat = filepath.stat()
            result.append({
                "filename": filepath.name,
                "name": filepath.stem.replace("_", " ").title(),
                "size_bytes": stat.st_size,
                "modified": stat.st_mtime,
                "loaded": filepath.stem.replace("_", " ").title() in self._custom_strategies,
            })
        return result

    def get_all_strategies(self, builtin_strategies: list[BaseStrategy]) -> list[BaseStrategy]:
        """Return combined list of built-in + custom strategies."""
        return list(builtin_strategies) + list(self._custom_strategies.values())

    def reload_strategy(self, name: str) -> BaseStrategy | None:
        """Reload a specific custom strategy from disk."""
        safe_name = "".join(c if c.isalnum() or c == "_" else "_" for c in name.lower())
        filepath = self.strategies_dir / f"{safe_name}.py"
        if filepath.exists():
            strategy = self._load_strategy_file(filepath)
            if strategy:
                self._custom_strategies[strategy.name] = strategy
                return strategy
        return None
