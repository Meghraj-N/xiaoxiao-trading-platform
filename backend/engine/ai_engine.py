"""
NVIDIA NIM AI Engine
────────────────────
Uses OpenAI-compatible SDK to connect to NVIDIA's NIM API.
Provides AI-powered market analysis, strategy generation,
strategy improvement, and trade explanation.

Models available via https://integrate.api.nvidia.com/v1:
- meta/llama-3.1-405b-instruct (flagship)
- nvidia/nemotron-4-340b-instruct (NVIDIA native)
- mistralai/mixtral-8x22b-instruct-v0.1 (fast)
- google/gemma-2-27b-it (lightweight)
"""

import json
import logging
from typing import Any

from openai import AsyncOpenAI

import config

logger = logging.getLogger("xiaoxiao.ai_engine")


class AIEngine:
    """
    AI-powered analysis and strategy generation via NVIDIA NIM.
    All methods return structured dicts for reliable integration.
    """

    def __init__(self):
        provider = getattr(config, "AI_PROVIDER", "nvidia").lower()
        
        if provider == "openrouter":
            if not getattr(config, "OPENROUTER_API_KEY", ""):
                logger.warning("OPENROUTER_API_KEY not set. AI features disabled.")
                self.client = None
            else:
                self.client = AsyncOpenAI(
                    base_url=getattr(config, "OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"),
                    api_key=config.OPENROUTER_API_KEY,
                )
                logger.info("AI Engine initialized with OpenRouter")
        else:
            if not config.NVIDIA_API_KEY:
                logger.warning(
                    "NVIDIA_API_KEY not set. AI features disabled. "
                    "Get a free key at https://build.nvidia.com"
                )
                self.client = None
            else:
                self.client = AsyncOpenAI(
                    base_url=config.NVIDIA_BASE_URL,
                    api_key=config.NVIDIA_API_KEY,
                )
                logger.info("AI Engine initialized with NVIDIA NIM")

    @property
    def available(self) -> bool:
        return self.client is not None

    def get_models(self) -> list[dict]:
        """Return list of available models."""
        return [
            {"id": key, "name": model_id, "provider": model_id.split("/")[0]}
            for key, model_id in config.AI_MODELS.items()
        ]

    def _resolve_model(self, model: str | None) -> str:
        """Resolve model shorthand to full NVIDIA model ID."""
        if not model:
            return config.DEFAULT_AI_MODEL
        # Check if it's a shorthand key
        if model in config.AI_MODELS:
            return config.AI_MODELS[model]
        # Otherwise assume it's a full model ID
        return model

    async def _chat(self, system: str, user: str, model: str | None = None,
                    temperature: float = 0.3, max_tokens: int = 2048, history: list = None) -> str:
        """Send a chat completion request to NVIDIA NIM."""
        if not self.client:
            return json.dumps({"error": "AI not configured. Set NVIDIA_API_KEY in .env"})

        model_id = self._resolve_model(model)
        
        messages_payload = [{"role": "system", "content": system}]
        if history:
            for msg in history:
                if msg.get("role") in ["user", "assistant"] and "text" in msg:
                    messages_payload.append({"role": msg["role"], "content": msg["text"]})
        
        messages_payload.append({"role": "user", "content": user})
        
        try:
            response = await self.client.chat.completions.create(
                model=model_id,
                messages=messages_payload,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            content = response.choices[0].message.content
            logger.info(f"AI response from {model_id}: {len(content)} chars")
            return content
        except Exception as e:
            logger.error(f"AI request failed ({model_id}): {e}")
            return json.dumps({"error": str(e)})

    async def _chat_json(self, system: str, user: str, model: str | None = None,
                         temperature: float = 0.2) -> dict:
        """Chat and parse response as JSON."""
        raw = await self._chat(system, user, model, temperature)
        # Try to extract JSON from response
        try:
            # Handle markdown-wrapped JSON
            if "```json" in raw:
                raw = raw.split("```json")[1].split("```")[0].strip()
            elif "```" in raw:
                raw = raw.split("```")[1].split("```")[0].strip()
            return json.loads(raw)
        except json.JSONDecodeError:
            return {"raw_response": raw, "parse_error": True}

    # ── Public AI Methods ──

    async def analyze_market(self, symbol: str, candle_summary: str,
                             model: str | None = None) -> dict:
        """
        AI analyzes current market conditions for a trading symbol.
        Returns regime (trending/ranging/volatile), bias, and confidence.
        """
        system = """You are an expert quantitative analyst. Analyze the given market data and return ONLY a JSON object with:
{
    "regime": "trending_up" | "trending_down" | "ranging" | "volatile",
    "bias": "bullish" | "bearish" | "neutral",
    "confidence": 0.0-1.0,
    "key_levels": {"support": number, "resistance": number},
    "volatility": "low" | "medium" | "high",
    "summary": "1-2 sentence analysis",
    "suggested_approach": "trend_following" | "mean_reversion" | "breakout" | "wait"
}"""
        user = f"Analyze {symbol} market data:\n{candle_summary}"
        return await self._chat_json(system, user, model)

    async def suggest_strategy(self, market_analysis: dict,
                               existing_strategies: list[str],
                               model: str | None = None) -> dict:
        """
        AI suggests a new strategy based on market conditions.
        Returns strategy description, parameters, and entry/exit rules.
        """
        system = """You are an expert algorithmic trading strategy designer. Given market analysis and existing strategies, suggest a NEW strategy that would complement the portfolio. Return ONLY a JSON object with:
{
    "name": "strategy name",
    "type": "trend_following" | "mean_reversion" | "breakout" | "momentum" | "volatility",
    "description": "detailed description",
    "indicators": [{"name": "indicator", "params": {}}],
    "entry_rules": {"long": "condition", "short": "condition"},
    "exit_rules": {"stop_loss": "method", "take_profit": "method"},
    "timeframe": "1h" | "4h" | "1d",
    "expected_win_rate": 0.0-1.0,
    "risk_reward": number,
    "reasoning": "why this strategy fits current conditions"
}"""
        user = f"""Market Analysis: {json.dumps(market_analysis)}
Existing Strategies: {', '.join(existing_strategies)}
Suggest a NEW strategy that complements these."""
        return await self._chat_json(system, user, model)

    async def generate_strategy_code(self, description: str,
                                     model: str | None = None) -> dict:
        """
        AI generates Python strategy code from natural language.
        Returns complete strategy class inheriting from BaseStrategy.
        """
        system = """You are an expert Python developer specializing in algorithmic trading. Generate a complete Python trading strategy class. The class MUST:

1. Inherit from BaseStrategy (from engine.strategies.base import BaseStrategy, Signal)
2. Set a class attribute `name = "Your Strategy Name"`
3. Implement `calculate_indicators(self, df)` - add indicator columns to DataFrame
4. Implement `generate_signal(self, df)` - return a Signal object
5. Use only pandas and numpy for calculations (no external indicator libraries)
6. Include proper stop_loss and take_profit in every Signal
7. Use ATR for stop placement when possible

The DataFrame has columns: timestamp, open, high, low, close, volume

Return ONLY a JSON object with:
{
    "name": "strategy name",
    "description": "what it does",
    "code": "complete Python code as a string",
    "indicators_used": ["list of indicators"],
    "parameters": {"param": value}
}"""
        user = f"Generate a trading strategy: {description}"
        return await self._chat_json(system, user, model, temperature=0.3)

    async def improve_strategy(self, strategy_name: str, strategy_code: str,
                               backtest_results: dict,
                               model: str | None = None) -> dict:
        """
        AI reviews backtest results and suggests improvements.
        """
        system = """You are an expert quantitative researcher reviewing a trading strategy's performance. Analyze the backtest results and suggest specific improvements. Return ONLY a JSON object with:
{
    "assessment": "honest assessment of the strategy",
    "strengths": ["list of what works"],
    "weaknesses": ["list of what doesn't work"],
    "improvements": [
        {"change": "specific code change", "expected_impact": "what it should fix", "priority": "high|medium|low"}
    ],
    "improved_code": "complete improved Python code",
    "confidence_in_improvement": 0.0-1.0,
    "honest_note": "truthful statement about whether this strategy has real edge"
}"""
        user = f"""Strategy: {strategy_name}

Code:
{strategy_code}

Backtest Results:
{json.dumps(backtest_results, indent=2)}

Analyze and suggest improvements. Be HONEST — if the strategy has no edge, say so."""
        return await self._chat_json(system, user, model, temperature=0.3)

    async def explain_trade(self, trade_data: dict,
                            model: str | None = None) -> dict:
        """
        AI explains why a specific trade won or lost.
        """
        system = """You are a trading coach reviewing a completed trade. Explain what happened in simple terms. Return ONLY a JSON object with:
{
    "outcome": "win" | "loss",
    "explanation": "clear explanation of what happened",
    "market_context": "what was the market doing",
    "entry_quality": "good" | "fair" | "poor",
    "exit_quality": "good" | "fair" | "poor",
    "lessons": ["actionable lessons"],
    "could_improve": "specific improvement suggestion"
}"""
        user = f"Explain this trade:\n{json.dumps(trade_data, indent=2)}"
        return await self._chat_json(system, user, model)

    async def chat(self, message: str, context: str = "",
                   model: str | None = None, history: list = None) -> str:
        """
        Free-form chat with AI about trading.
        Returns raw text response (not JSON).
        """
        system = f"""You are Xiaoxiao's AI trading assistant. You help with:
- Analyzing market conditions
- Explaining trading concepts
- Suggesting strategy improvements
- Answering questions about the bot's performance

Be honest and direct. If something won't work, say so.
{f"Context: {context}" if context else ""}"""
        return await self._chat(system, message, model, temperature=0.5, max_tokens=1500, history=history)
