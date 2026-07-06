"""
config.py — loads credentials and endpoint config.

Verified facts (source: docs.delta.exchange, checked in this session):
- Production base URL: https://api.india.delta.exchange
- Testnet base URL:     https://cdn-ind.testnet.deltaex.org
- API keys created against a Demo/testnet account only work against the
  testnet URL; prod keys only work against the prod URL. They are not
  interchangeable.
"""
import os
from dotenv import load_dotenv

load_dotenv()

PROD_BASE_URL = "https://api.india.delta.exchange"
TESTNET_BASE_URL = "https://cdn-ind.testnet.deltaex.org"

# Explicit switch — default to testnet. Must be manually changed in code
# (not just an env var) to point at prod, per the Phase 1 safety rule:
# no order-placement code exists in this repo regardless of this flag,
# but keeping the switch explicit and code-level (not env-level) makes it
# harder to accidentally point read calls at a live account by mistake.
USE_TESTNET = True

BASE_URL = TESTNET_BASE_URL if USE_TESTNET else PROD_BASE_URL

API_KEY = os.getenv("DELTA_API_KEY")
API_SECRET = os.getenv("DELTA_API_SECRET")

if not API_KEY or not API_SECRET:
    raise EnvironmentError(
        "DELTA_API_KEY / DELTA_API_SECRET not set. Copy .env.example to .env "
        "and fill in your keys. Testnet keys only work with USE_TESTNET=True; "
        "prod keys only work with USE_TESTNET=False."
    )
