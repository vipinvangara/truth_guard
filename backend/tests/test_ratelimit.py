import time

from app.ratelimit import RateLimiter


def test_allows_up_to_limit_then_blocks():
    limiter = RateLimiter(limit_per_hour=3)
    assert all(limiter.allow("device-a") for _ in range(3))
    assert limiter.allow("device-a") is False


def test_tokens_are_isolated():
    limiter = RateLimiter(limit_per_hour=1)
    assert limiter.allow("device-a")
    assert limiter.allow("device-b")
    assert limiter.allow("device-a") is False


def test_window_slides(monkeypatch):
    limiter = RateLimiter(limit_per_hour=1)
    assert limiter.allow("device-a")
    real_time = time.time
    monkeypatch.setattr(time, "time", lambda: real_time() + 3601)
    assert limiter.allow("device-a")
