from typing import Any

from django.contrib.auth.base_user import BaseUserManager


class UserManager(BaseUserManager):
    use_in_migrations = True

    @classmethod
    def normalize_email(cls, email: str) -> str:
        return super().normalize_email(email).strip().casefold()

    def create_user(self, email: str, password: str | None = None, **extra_fields: Any):
        if not email:
            raise ValueError("O e-mail é obrigatório.")

        user = self.model(email=self.normalize_email(email), **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email: str, password: str | None = None, **extra_fields: Any):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superusuários precisam ter is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superusuários precisam ter is_superuser=True.")

        return self.create_user(email, password, **extra_fields)
