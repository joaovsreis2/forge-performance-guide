import importlib

import pytest
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

from config.settings import base


def test_foundation_settings() -> None:
    assert settings.AUTH_USER_MODEL == "accounts.User"
    assert settings.LANGUAGE_CODE == "pt-br"
    assert settings.TIME_ZONE == "America/Sao_Paulo"
    assert settings.USE_I18N is True
    assert settings.USE_TZ is True
    assert settings.ENVIRONMENT == "test"


def test_all_environments_use_postgresql() -> None:
    assert settings.DATABASES["default"]["ENGINE"] == "django.db.backends.postgresql"


def test_environment_helpers(monkeypatch) -> None:
    monkeypatch.setenv("FORGE_TEST_BOOL", "yes")
    monkeypatch.setenv("FORGE_TEST_LIST", "one, two, ,three")
    monkeypatch.setenv("FORGE_TEST_REQUIRED", "configured")

    assert base.env_bool("FORGE_TEST_BOOL") is True
    assert base.env_bool("FORGE_TEST_MISSING") is False
    assert base.env_list("FORGE_TEST_LIST") == ["one", "two", "three"]
    assert base.required_env("FORGE_TEST_REQUIRED") == "configured"


def test_missing_required_environment_fails_fast(monkeypatch) -> None:
    monkeypatch.delenv("FORGE_TEST_MISSING", raising=False)

    with pytest.raises(ImproperlyConfigured, match="FORGE_TEST_MISSING"):
        base.required_env("FORGE_TEST_MISSING")


def test_database_url_configuration_supports_managed_postgres() -> None:
    config = base.database_config_from_url(
        "postgresql://postgres.example:p%40ss@db.example.supabase.co:5432/postgres?sslmode=require"
    )

    assert config["ENGINE"] == "django.db.backends.postgresql"
    assert config["NAME"] == "postgres"
    assert config["USER"] == "postgres.example"
    assert config["PASSWORD"] == "p@ss"
    assert config["HOST"] == "db.example.supabase.co"
    assert config["PORT"] == "5432"
    assert config["OPTIONS"] == {"connect_timeout": 5, "sslmode": "require"}


def test_database_url_rejects_non_postgres_scheme() -> None:
    with pytest.raises(ImproperlyConfigured, match="postgres"):
        base.database_config_from_url("mysql://user:password@example.com/database")


def test_development_settings_allow_local_hosts() -> None:
    development = importlib.import_module("config.settings.development")

    assert development.ENVIRONMENT == "development"
    assert "localhost" in development.ALLOWED_HOSTS


def test_production_settings_are_secure(monkeypatch) -> None:
    monkeypatch.setenv("DJANGO_CSRF_TRUSTED_ORIGINS", "https://forge.example")
    monkeypatch.setenv("EMAIL_HOST", "smtp.example.com")
    monkeypatch.setenv("EMAIL_HOST_USER", "forge")
    monkeypatch.setenv("EMAIL_HOST_PASSWORD", "test-only")
    monkeypatch.setenv("DEFAULT_FROM_EMAIL", "Forge <no-reply@forge.example>")
    production = importlib.import_module("config.settings.production")

    assert production.ENVIRONMENT == "production"
    assert production.DEBUG is False
    assert production.SESSION_COOKIE_SECURE is True
    assert production.CSRF_COOKIE_SECURE is True
    assert production.SECURE_SSL_REDIRECT is True
    assert production.SESSION_COOKIE_SAMESITE == "Lax"
    assert production.CSRF_COOKIE_SAMESITE == "Lax"
    assert production.EMAIL_BACKEND == "django.core.mail.backends.smtp.EmailBackend"
    assert "*" not in production.ALLOWED_HOSTS
