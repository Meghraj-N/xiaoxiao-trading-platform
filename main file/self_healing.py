"""
self_healing.py — error recovery for the trading loop.

Scope, deliberately narrow: this file recovers from FAILURES (dropped
connections, API timeouts, unhandled exceptions, process crashes). It
does NOT change strategy behavior, position sizing, or any trading
parameter. "Self-healing" here means "doesn't die when the network
hiccups" — not "rewrites its own logic." That distinction matters and
is enforced by what this file does NOT contain.
"""
import functools
import json
import os
import time
from trade_log import log_line


def retry_with_backoff(max_retries: int = 5, base_delay: float = 2.0, max_delay: float = 60.0):
    """
    Decorator: retries a function on exception with exponential backoff.
    Logs every retry attempt honestly (never silently swallows failures).
    Re-raises after max_retries — a persistent failure should surface,
    not be hidden behind infinite silent retries.
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            attempt = 0
            delay = base_delay
            while True:
                try:
                    return func(*args, **kwargs)
                except Exception as exc:
                    attempt += 1
                    if attempt > max_retries:
                        log_line(f"[self_healing] {func.__name__} failed after "
                                 f"{max_retries} retries: {exc}. Giving up — not retrying further.")
                        raise
                    log_line(f"[self_healing] {func.__name__} failed (attempt {attempt}/"
                              f"{max_retries}): {exc}. Retrying in {delay:.1f}s.")
                    time.sleep(delay)
                    delay = min(delay * 2, max_delay)
        return wrapper
    return decorator


class Checkpoint:
    """
    Persists engine state to disk so a crash/restart doesn't silently
    reset to a fabricated fresh balance. On restart, the real last-known
    state is loaded — if no checkpoint exists, the caller must supply an
    explicit starting balance rather than this class inventing one.
    """
    def __init__(self, path: str = "checkpoint.json"):
        self.path = path

    def save(self, state: dict):
        tmp_path = self.path + ".tmp"
        with open(tmp_path, "w") as f:
            json.dump(state, f)
        os.replace(tmp_path, self.path)  # atomic write — avoids a half-written
                                          # checkpoint if the process dies mid-save

    def load(self) -> dict | None:
        if not os.path.exists(self.path):
            return None
        with open(self.path) as f:
            return json.load(f)


class Watchdog:
    """
    Wraps the main loop body. Catches per-cycle exceptions so one bad
    cycle doesn't kill the whole process — but if failures happen
    consecutively past a threshold, it stops and raises rather than
    looping forever on a fundamentally broken connection. Silent infinite
    retry on a dead API key or revoked credential is its own failure mode.
    """
    def __init__(self, max_consecutive_failures: int = 10):
        self.max_consecutive_failures = max_consecutive_failures
        self.consecutive_failures = 0

    def run_cycle(self, cycle_fn, *args, **kwargs):
        try:
            result = cycle_fn(*args, **kwargs)
            self.consecutive_failures = 0
            return result
        except Exception as exc:
            self.consecutive_failures += 1
            log_line(f"[watchdog] Cycle failed ({self.consecutive_failures}/"
                      f"{self.max_consecutive_failures} consecutive): {exc}")
            if self.consecutive_failures >= self.max_consecutive_failures:
                log_line("[watchdog] Too many consecutive failures — stopping "
                         "rather than looping forever on a broken connection.")
                raise
            return None
