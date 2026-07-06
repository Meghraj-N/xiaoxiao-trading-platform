# Master Plan — Delta Exchange AI Trading Bot

**Status as of this document:** Phase 0-1 code built and unit-tested (logic only, no live connectivity proven). Phases 2-5 are spec'd, not built. Three decisions remain open and are blocking further build — listed in Section 6.

---

## 1. Goal

Autonomous paper-trading bot on Delta Exchange (crypto perpetuals), built to never fabricate a price, fill, or profit. Live capital is out of scope until paper trading proves the system for 2+ weeks (Section 8).

## 2. Verified facts (source-checked this session)

| Fact | Value | Source |
|---|---|---|
| Prod REST base | `https://api.india.delta.exchange` | docs.delta.exchange |
| Testnet REST base | `https://cdn-ind.testnet.deltaex.org` | docs.delta.exchange |
| Auth | HMAC-SHA256 of `method+timestamp+path+query_string+payload`; headers `api-key`, `timestamp`, `signature` | docs.delta.exchange |
| Timestamp tolerance | Requests rejected if >5 sec from server time — clock must be NTP-synced | docs.delta.exchange |
| Official Python SDK | `pip install delta-rest-client` | github.com/delta-exchange/python-rest-client |
| Funding mechanism | Exchanged every 8h at 05:30/13:30/21:30 IST. `Payment = Position_Value × Funding_Rate`. `Rate = Premium + clamp(Interest−Premium, ±cap)`. Cap ~1%, varies by contract — confirm per product. No exchange fee on funding itself. Snapshot-based: only positions open at exchange time are charged. | guides.delta.exchange, official schedule-change notice (Sept 2025) |
| India tax | 1% TDS + 30% flat tax apply to **spot** crypto buys on Delta India. Do **NOT** apply to futures/options (cash-settled in INR, no crypto changes hands). GST (18%) on trading fees applies regardless. | Delta's own India user guide |

## 3. Corrections made during this project (tracked for your awareness)

1. Originally stated TDS applies broadly to "trade value" — **wrong**. Corrected: TDS/30% tax is spot-only, doesn't apply to your perpetuals trading.
2. Old dashboard screenshot showed "0.05% taker" fee and a moving BTC/USDT chart while the backend never connected and no trade ever executed — that number and that chart carry **no evidential weight**. Treated as unverified, not inherited as fact.

## 4. Architecture

```
[Delta Exchange API] --read-only--> [delta_client.py] --> [market_data.py]
                                                                |
                                                                v
                                          [main_loop.py] --> decide() [Phase 2: real strategy]
                                                                |
                                                                v
                                                        [paper_engine.py] (fees, GST, fills)
                                                                |
                                                                v
                                                          [trade_log.py] --> trades.csv
                                                                |
                                                                v
                                                    [server.py] --> [dashboard.html]
```

No path from `decide()` to any order-placement endpoint exists anywhere in this system. That's deliberate — live execution is a separate, later, explicitly-approved addition.

## 5. Build status by phase

| Phase | Content | Status |
|---|---|---|
| 0 | Repo structure, config, auth client | **Built + unit-tested.** Signature logic verified against documented scheme. Live connectivity NOT tested (sandbox can't reach Delta's domains). |
| 1 | Market data fetch + paper engine + logging | **Built + unit-tested.** Fee guard, P&L math, honest-skip logging all verified with test data. `FEE_RATE_TAKER`/`FEE_RATE_MAKER` intentionally unset — hard-fails until confirmed. |
| 1.5 | Local dashboard | **Built + unit-tested.** Reads only from `trades.csv`. Honest empty-state verified. No price chart included — see Section 6.3. |
| 2 | Strategy engine + backtester | **Spec'd, not built.** EMA/RSI/ORB/VWAP/Supertrend adapted for 24/7 crypto (no NSE-style square-off). Walk-forward validation required, ≥100 trades to pass gate. Funding-rate cost must be included in backtest P&L. |
| 3 | Risk sizing | **Spec'd, not built.** Fixed 1% risk per trade until Phase 2 backtest gate passes. Fractional Kelly (0.25–0.5x) only after that, hard-capped at 1% regardless of Kelly output. "Reset-and-learn" loss-response — proposed definition awaiting your sign-off (Section 6.2). |
| 4 | Dashboard price chart, full wiring | **Blocked** on Section 6.3. |
| 5 | Extended paper run + reporting | Not started. Minimum 2 weeks before any live-capital discussion, per the source guide's own rule. |

## 6. Open decisions — blocking further build, require you, not more analysis from me

### 6.1 Confirmed fee %
Two conflicting numbers found (0.02%/0.05% vs 0.05%/0.075% maker/taker). Check `delta.exchange/fees` directly for your specific product (futures fee ≠ options fee). Set `FEE_RATE_TAKER` / `FEE_RATE_MAKER` in `paper_engine.py`.

### 6.2 Reset-and-learn definition
My proposed default (from earlier): drawdown >5% in 24h → halve position size for next 10 trades → restore only after 10 consecutive trades without re-triggering. No autonomous retraining or strategy-switching. **Approve, edit, or replace this before Phase 3 is built.**

### 6.3 Price chart data source
Unknown whether a live chart widget here would show real Delta data or decorative/demo data — same failure mode as the old dashboard. Needs a specific decision: which data source, confirmed live, before it's added.

## 7. Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Field-name mismatch between assumed API schema and live response (`market_data.py`) | Medium | Low — fails loudly on first live test, not silently | Run against testnet first, fix field names from actual response |
| Kelly sizing on unstable backtest win-rate estimate | Medium-High if enabled early | High (overbetting) | Hard 1% cap regardless of Kelly output; ≥100-trade gate before enabling |
| Funding-rate cost omitted from backtest | High if not implemented per spec | Medium (systematically overstates strategy profitability) | Explicit backtester requirement in Phase 2 spec |
| Fee number wrong | Certain until confirmed | Medium (all P&L math off by a fixed %) | Hard-fail guard already in code; cannot run until set |

## 8. Go/no-go gates (non-negotiable per your own stated priorities)

1. Phase 2 backtest: ≥100 trades, positive expectancy after fees+funding, passes majority of walk-forward windows.
2. Phase 5 paper run: minimum 2 weeks live-market paper trading, results not diverging >~10 percentage points from backtest win rate.
3. Human sign-off — this plan does not auto-conclude "ready for live capital" at any point.

## 9. Immediate next action
Resolve Section 6.1 (5-minute task: check one webpage). Nothing else is buildable until that's set — the fee guard in code will stop execution otherwise.
