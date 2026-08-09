from .base import *  # noqa: F403

ENVIRONMENT = "test"
SECRET_KEY = "django-insecure-forge-test-key"
DEBUG = False
ALLOWED_HOSTS = ["testserver", "localhost"]

DATABASES["default"]["CONN_MAX_AGE"] = 0  # noqa: F405
DATABASES["default"]["CONN_HEALTH_CHECKS"] = False  # noqa: F405

PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
