import os
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[2]

load_dotenv(BASE_DIR / ".env")


def env_bool(name: str, default: bool = False) -> bool:
    raw_value = os.getenv(name)
    if raw_value is None:
        return default
    return raw_value.strip().lower() in {"1", "true", "yes", "on"}


def env_list(name: str, default: str = "") -> list[str]:
    return [item.strip() for item in os.getenv(name, default).split(",") if item.strip()]


def required_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise ImproperlyConfigured(
            f"A variável de ambiente obrigatória {name} não foi configurada."
        )
    return value


def database_options_from_query(query: str) -> dict[str, int | str]:
    options: dict[str, int | str] = {
        "connect_timeout": int(os.getenv("POSTGRES_CONNECT_TIMEOUT", "5"))
    }
    query_params = parse_qs(query)
    sslmode = query_params.get("sslmode", [os.getenv("POSTGRES_SSLMODE", "")])[0]
    if sslmode:
        options["sslmode"] = sslmode
    return options


def database_config_from_url(database_url: str) -> dict[str, object]:
    parsed_url = urlparse(database_url)
    if parsed_url.scheme not in {"postgres", "postgresql"}:
        raise ImproperlyConfigured("DATABASE_URL precisa usar o esquema postgres ou postgresql.")
    if not parsed_url.hostname:
        raise ImproperlyConfigured("DATABASE_URL precisa informar o host do PostgreSQL.")

    return {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": unquote(parsed_url.path.removeprefix("/")) or "postgres",
        "USER": unquote(parsed_url.username or ""),
        "PASSWORD": unquote(parsed_url.password or ""),
        "HOST": parsed_url.hostname,
        "PORT": str(parsed_url.port or 5432),
        "CONN_MAX_AGE": 60,
        "CONN_HEALTH_CHECKS": True,
        "OPTIONS": database_options_from_query(parsed_url.query),
    }


def database_config_from_env() -> dict[str, object]:
    options = database_options_from_query("")
    return {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": required_env("POSTGRES_DB"),
        "USER": required_env("POSTGRES_USER"),
        "PASSWORD": required_env("POSTGRES_PASSWORD"),
        "HOST": required_env("POSTGRES_HOST"),
        "PORT": required_env("POSTGRES_PORT"),
        "CONN_MAX_AGE": 60,
        "CONN_HEALTH_CHECKS": True,
        "OPTIONS": options,
    }


SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "django-insecure-unconfigured")
DEBUG = False
ALLOWED_HOSTS: list[str] = []
ENVIRONMENT = os.getenv("FORGE_ENVIRONMENT", "base")
FRONTEND_ORIGIN = os.getenv("FORGE_FRONTEND_ORIGIN", "http://127.0.0.1:5175")
PASSWORD_RECOVERY_ENABLED = env_bool("FORGE_PASSWORD_RECOVERY_ENABLED", default=True)
DEFAULT_TRAINING_PLAN_PATH = os.getenv(
    "FORGE_DEFAULT_TRAINING_PLAN_PATH",
    str(BASE_DIR / "forge" / "training" / "data" / "paulo-base.xlsx"),
)
DEFAULT_TRAINING_PLAN_NAME = os.getenv(
    "FORGE_DEFAULT_TRAINING_PLAN_NAME",
    "Plano Paulo — Recomposição Corporal",
)

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "forge.core.apps.CoreConfig",
    "forge.accounts.apps.AccountsConfig",
    "forge.training.apps.TrainingConfig",
    "forge.progress.apps.ProgressConfig",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

DATABASE_URL = os.getenv("DATABASE_URL", "")
DATABASES = {
    "default": database_config_from_url(DATABASE_URL)
    if DATABASE_URL
    else database_config_from_env()
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

AUTH_USER_MODEL = "accounts.User"
LOGIN_URL = "accounts:signin"
LOGIN_REDIRECT_URL = "core:home"
LOGOUT_REDIRECT_URL = "accounts:signin"

LANGUAGE_CODE = "pt-br"
TIME_ZONE = "America/Sao_Paulo"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

SESSION_COOKIE_HTTPONLY = True
X_FRAME_OPTIONS = "DENY"
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "Forge <no-reply@localhost>")
AUTH_RATE_LIMIT_ATTEMPTS = int(os.getenv("AUTH_RATE_LIMIT_ATTEMPTS", "5"))
AUTH_RATE_LIMIT_WINDOW_SECONDS = int(os.getenv("AUTH_RATE_LIMIT_WINDOW_SECONDS", "300"))

LOG_LEVEL = os.getenv("DJANGO_LOG_LEVEL", "INFO").upper()
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "{asctime} {levelname} {name}: {message}",
            "style": "{",
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "default",
        }
    },
    "root": {"handlers": ["console"], "level": LOG_LEVEL},
    "loggers": {
        "django.db.backends": {
            "handlers": ["console"],
            "level": "WARNING",
            "propagate": False,
        }
    },
}
