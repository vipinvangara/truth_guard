import pytest

from app.config import Settings


@pytest.fixture
def settings_with_keys(tmp_path):
    return Settings(
        gemini_api_key="test-gemini-key",
        factcheck_api_key="test-factcheck-key",
        cache_path=str(tmp_path / "cache.db"),
    )


@pytest.fixture
def settings_keyless(tmp_path):
    return Settings(cache_path=str(tmp_path / "cache.db"))
