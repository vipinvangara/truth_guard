import time

from app.cache import VerifyCache, key_for, normalize
from app.models import ClaimResult, Verdict, VerifyResponse


def _response(limited=False):
    return VerifyResponse(
        claims=[
            ClaimResult(
                text="c", verdict=Verdict.FALSE, confidence=0.9, reasoning="r", evidence=[]
            )
        ],
        limited=limited,
    )


def test_normalization_makes_trivial_variants_hit_the_same_key():
    assert key_for("Banks  CLOSED Monday") == key_for("banks closed monday")
    assert normalize("  A  B ") == "a b"


def test_roundtrip_marks_cached(tmp_path):
    cache = VerifyCache(str(tmp_path / "c.db"), ttl_seconds=60)
    cache.put("claim", _response())
    hit = cache.get("claim")
    assert hit is not None
    assert hit.cached is True
    assert hit.claims[0].verdict == Verdict.FALSE


def test_miss_returns_none(tmp_path):
    cache = VerifyCache(str(tmp_path / "c.db"), ttl_seconds=60)
    assert cache.get("never seen") is None


def test_expired_entries_are_evicted(tmp_path, monkeypatch):
    cache = VerifyCache(str(tmp_path / "c.db"), ttl_seconds=10)
    cache.put("claim", _response())
    real_time = time.time
    monkeypatch.setattr(time, "time", lambda: real_time() + 11)
    assert cache.get("claim") is None


def test_limited_responses_are_not_cached(tmp_path):
    cache = VerifyCache(str(tmp_path / "c.db"), ttl_seconds=60)
    cache.put("claim", _response(limited=True))
    assert cache.get("claim") is None
