from .base import *  # noqa: F403
from .base import env_bool, env_list

ENVIRONMENT = "development"
DEBUG = env_bool("DJANGO_DEBUG", default=True)
ALLOWED_HOSTS = env_list(
    "DJANGO_ALLOWED_HOSTS",
    default="localhost,127.0.0.1,[::1]",
)
CSRF_TRUSTED_ORIGINS = env_list(
    "DJANGO_CSRF_TRUSTED_ORIGINS",
    default="http://127.0.0.1:5175,http://localhost:5175",
)

# Managed session poolers have small connection limits; development requests need no persistence.
DATABASES["default"]["CONN_MAX_AGE"] = 0  # noqa: F405
DATABASES["default"]["CONN_HEALTH_CHECKS"] = False  # noqa: F405

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
