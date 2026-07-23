import pytest

from app.config import Settings, get_settings
from app.main import app


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


@pytest.fixture
def override_settings(tmp_path):
    """Override app settings for endpoint tests; yields the Settings used."""

    def _override(settings):
        app.dependency_overrides = {}
        get_settings.cache_clear()
        app.state._test_settings = settings
        return settings

    yield _override
    get_settings.cache_clear()
