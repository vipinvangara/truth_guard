"""Per-device-token sliding-window rate limiter.

In-memory: adequate for the single-instance P1 deployment. Replace with a
shared store before scaling past one instance.
"""

import time
from collections import defaultdict, deque


class RateLimiter:
    def __init__(self, limit_per_hour: int) -> None:
        self._limit = limit_per_hour
        self._events: dict[str, deque[float]] = defaultdict(deque)

    def allow(self, token: str) -> bool:
        now = time.time()
        window = self._events[token]
        while window and now - window[0] > 3600:
            window.popleft()
        if len(window) >= self._limit:
            return False
        window.append(now)
        return True
