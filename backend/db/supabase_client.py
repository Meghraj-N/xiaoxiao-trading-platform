import os
import asyncio
from supabase import create_client, Client
import config
import logging

logger = logging.getLogger(__name__)

class SupabaseClient:
    def __init__(self):
        url = getattr(config, "SUPABASE_URL", os.getenv("SUPABASE_URL"))
        key = getattr(config, "SUPABASE_KEY", os.getenv("SUPABASE_KEY"))
        if url and key:
            try:
                self.client: Client = create_client(url, key)
                logger.info("Supabase client initialized successfully.")
            except Exception as e:
                self.client = None
                logger.error(f"Failed to initialize Supabase client: {e}")
        else:
            self.client = None
            logger.warning("Supabase credentials not found. Logging locally only.")

    async def log_system_event(self, message: str, level: str = "info"):
        if not self.client: return
        try:
            # Running synchronous Supabase client insert in an executor
            def _insert():
                self.client.table("system_logs").insert({"message": message, "level": level}).execute()
            await asyncio.to_thread(_insert)
        except Exception as e:
            logger.error(f"Supabase system_logs error: {e}")

    async def log_trade(self, trade_data: dict):
        if not self.client: return
        try:
            def _insert():
                self.client.table("trades").insert(trade_data).execute()
            await asyncio.to_thread(_insert)
        except Exception as e:
            logger.error(f"Supabase trades error: {e}")

# Singleton instance
db_client = SupabaseClient()
