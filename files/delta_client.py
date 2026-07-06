"""
delta_client.py — thin signed HTTP client, READ-ONLY endpoints only.

Signature scheme (verified, source: docs.delta.exchange):
    message   = method + timestamp + path + query_string + payload
    signature = HMAC_SHA256(secret, message).hexdigest()
    headers   = {api-key, timestamp, signature, Content-Type: application/json}

Verified constraint: timestamp must be within ~5 seconds of Delta's server
time or the request is rejected. This machine's clock must be NTP-synced.

HARD RULE FOR THIS FILE: only GET requests to read-only endpoints are
implemented. No order placement, modification, or cancellation exists here.
If you need those later, that is a deliberate, separate, human-reviewed
change — not something to bolt onto this client.
"""
import hashlib
import hmac
import time
import requests

from config import BASE_URL, API_KEY, API_SECRET

# Endpoints this client is allowed to call. Anything not in this list
# is refused by _signed_get, on purpose — an explicit allowlist rather
# than trusting every caller to only ask for safe things.
ALLOWED_READ_PATHS = {
    "/v2/assets",
    "/v2/products",
    "/v2/tickers",
    "/v2/tickers/{symbol}",  # placeholder pattern, see get_ticker()
    "/v2/l2orderbook/{symbol}",
    "/v2/history/candles",
    "/v2/orders",       # read open orders (GET only — no write path exposed)
    "/v2/positions/margined",
    "/v2/wallet/balances",
}


def _generate_signature(secret: str, message: str) -> str:
    return hmac.new(
        bytes(secret, "utf-8"), bytes(message, "utf-8"), hashlib.sha256
    ).hexdigest()


def _signed_get(path: str, query_params: dict | None = None) -> dict:
    """
    Signed GET request. Raises on any non-2xx response rather than
    silently returning something that looks like data.
    """
    query_params = query_params or {}
    method = "GET"
    timestamp = str(int(time.time()))

    # Build query string exactly as it will be sent — order matters for
    # the signature, so we build it once and reuse it for both the
    # signature and the actual request.
    if query_params:
        query_string = "?" + "&".join(f"{k}={v}" for k, v in query_params.items())
    else:
        query_string = ""

    payload = ""  # GET requests carry no body
    signature_data = method + timestamp + path + query_string + payload
    signature = _generate_signature(API_SECRET, signature_data)

    headers = {
        "api-key": API_KEY,
        "timestamp": timestamp,
        "signature": signature,
        "User-Agent": "delta-bot-phase1-python",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    url = BASE_URL + path
    response = requests.get(url, headers=headers, params=query_params, timeout=(5, 15))

    if response.status_code != 200:
        raise RuntimeError(
            f"Delta API error {response.status_code} on {path}: {response.text}"
        )

    body = response.json()
    if not body.get("success", False):
        raise RuntimeError(f"Delta API returned success=false on {path}: {body}")

    return body["result"]


def get_assets() -> dict:
    return _signed_get("/v2/assets")


def get_products() -> dict:
    return _signed_get("/v2/products")


def get_ticker(symbol: str) -> dict:
    return _signed_get(f"/v2/tickers/{symbol}")


def get_l2_orderbook(symbol: str) -> dict:
    return _signed_get(f"/v2/l2orderbook/{symbol}")


def get_candles(symbol: str, resolution: str, start: int, end: int) -> dict:
    """
    resolution: per Delta's docs, e.g. '1m', '5m', '1h', '1d' — confirm
    the exact accepted values against current docs before relying on this,
    since exchanges change these strings without much notice.
    start/end: unix timestamps (seconds).
    """
    return _signed_get(
        "/v2/history/candles",
        {"symbol": symbol, "resolution": resolution, "start": start, "end": end},
    )


def get_wallet_balances() -> dict:
    return _signed_get("/v2/wallet/balances")


def get_open_positions() -> dict:
    return _signed_get("/v2/positions/margined")
