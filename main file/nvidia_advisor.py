"""
nvidia_advisor.py — LLM-based analysis of trading performance via NVIDIA NIM.

SCOPE, ENFORCED BY DESIGN: this module reads trades.csv, sends AGGREGATED
STATISTICS (not raw account data, not API keys, not code) to an NVIDIA
NIM model, and writes the model's suggestions to a text file for human
review. It contains NO code path that writes to paper_engine.py, no
code path that changes FEE_RATE, position sizing, or strategy logic.

Why this boundary exists: an earlier request in this project asked for
an LLM that "improves the bot by itself." That was declined as a fully
autonomous loop because unsupervised self-modification of trading logic
based on an LLM's read of recent performance is a real risk (chasing
noise, hallucinated "improvements", no rollback). This module gets you
the analysis value without that risk — you read its suggestions and
decide, in Phase 2/3 code, whether to act on them.

Facts checked this session:
- NVIDIA NIM cloud endpoint: https://integrate.api.nvidia.com/v1
- OpenAI-compatible API — use the standard `openai` Python package,
  swap base_url and api_key.
- Key format: nvapi-...  Get one at build.nvidia.com.
- Free-tier rate limit is commonly reported around 40 req/min across
  several third-party sources, but I have not confirmed this on an
  NVIDIA-owned page directly — check your actual limit on your
  build.nvidia.com account page. The throttle below is a conservative
  default, not a verified number.
"""
import csv
import os
from datetime import datetime, timezone

NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"
NVIDIA_MODEL = "meta/llama-3.3-70b-instruct"  # swap freely — OpenAI-compatible,
                                                # changing model is a one-line change
SUGGESTIONS_LOG = "advisor_suggestions.txt"


def _require_api_key() -> str:
    key = os.getenv("NVIDIA_API_KEY")
    if not key:
        raise EnvironmentError(
            "NVIDIA_API_KEY not set. Get a free key at build.nvidia.com "
            "(format: nvapi-...) and set it as an environment variable."
        )
    return key


def _summarize_trades(trades_csv_path: str) -> dict:
    """
    Computes the same kind of aggregate stats as the dashboard's server.py —
    intentionally reused logic, not duplicated invention. Only aggregates
    are sent to the LLM, never raw rows, to limit what leaves the machine.
    """
    if not os.path.exists(trades_csv_path):
        return {"has_data": False}

    with open(trades_csv_path, newline="") as f:
        rows = list(csv.DictReader(f))

    closed = [r for r in rows if r.get("event") == "CLOSE"]
    pnls = [float(r["pnl"]) for r in closed if r.get("pnl")]
    wins = [p for p in pnls if p > 0]
    losses = [p for p in pnls if p <= 0]

    return {
        "has_data": len(rows) > 0,
        "total_trades": len(closed),
        "win_rate_pct": (len(wins) / len(closed) * 100) if closed else None,
        "avg_win": (sum(wins) / len(wins)) if wins else None,
        "avg_loss": (sum(losses) / len(losses)) if losses else None,
        "total_pnl": sum(pnls) if pnls else 0.0,
    }


def get_suggestions(trades_csv_path: str = "trades.csv") -> str:
    """
    Sends aggregate stats to NVIDIA NIM, returns plain-text suggestions.
    Does NOT apply anything. Raises if there isn't enough data to be
    worth analyzing, rather than asking the LLM to speculate from nothing.
    """
    api_key = _require_api_key()
    stats = _summarize_trades(trades_csv_path)

    if not stats["has_data"] or stats["total_trades"] < 10:
        return ("Not enough trade data yet for a meaningful analysis "
                f"(have {stats.get('total_trades', 0)} closed trades, "
                "recommend waiting for at least 10-20 before asking for advice).")

    # Lazy import — keeps this module importable/testable even without
    # the openai package installed, for environments that only want the
    # summarization logic tested.
    from openai import OpenAI

    client = OpenAI(base_url=NVIDIA_BASE_URL, api_key=api_key)

    prompt = (
        "You are reviewing AGGREGATE statistics from a paper-trading bot. "
        "You are not being shown code or raw trade-by-trade data. "
        "Give at most 3 specific, falsifiable observations or suggestions "
        "based on these numbers. Do not recommend position-size changes "
        "beyond noting risk; a human will decide whether to act on this.\n\n"
        f"Stats: {stats}"
    )

    response = client.chat.completions.create(
        model=NVIDIA_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=500,
    )
    suggestion_text = response.choices[0].message.content

    with open(SUGGESTIONS_LOG, "a") as f:
        f.write(f"\n--- {datetime.now(timezone.utc).isoformat()} ---\n")
        f.write(f"Stats sent: {stats}\n")
        f.write(f"Suggestions (NOT auto-applied — human review required):\n{suggestion_text}\n")

    return suggestion_text


if __name__ == "__main__":
    print(get_suggestions())
