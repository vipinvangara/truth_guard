"""SQLite cache keyed by normalized claim-text hash.

Viral forwards mean many users check identical text — cache hits are the norm,
and every hit saves the whole provider + LLM budget for that scan.
"""

import hashlib
import json
import sqlite3
import time

from .models import VerifyResponse


def normalize(text: str) -> str:
    return " ".join(text.lower().split())


def key_for(text: str) -> str:
    return hashlib.sha256(normalize(text).encode()).hexdigest()


class VerifyCache:
    def __init__(self, path: str, ttl_seconds: int) -> None:
        self._ttl = ttl_seconds
        self._conn = sqlite3.connect(path, check_same_thread=False)
        self._conn.execute(
            "CREATE TABLE IF NOT EXISTS verify_cache ("
            "key TEXT PRIMARY KEY, response TEXT NOT NULL, created_at REAL NOT NULL)"
        )
        self._conn.commit()

    def get(self, text: str) -> VerifyResponse | None:
        row = self._conn.execute(
            "SELECT response, created_at FROM verify_cache WHERE key = ?", (key_for(text),)
        ).fetchone()
        if row is None:
            return None
        response_json, created_at = row
        if time.time() - created_at > self._ttl:
            self._conn.execute("DELETE FROM verify_cache WHERE key = ?", (key_for(text),))
            self._conn.commit()
            return None
        cached = VerifyResponse.model_validate(json.loads(response_json))
        cached.cached = True
        return cached

    def put(self, text: str, response: VerifyResponse) -> None:
        # Limited (LLM-less) responses are not cached: they should be retried
        # once judgment capability is back rather than pinned for the TTL.
        if response.limited:
            return
        self._conn.execute(
            "INSERT OR REPLACE INTO verify_cache (key, response, created_at) VALUES (?, ?, ?)",
            (key_for(text), response.model_dump_json(), time.time()),
        )
        self._conn.commit()

    def close(self) -> None:
        self._conn.close()
