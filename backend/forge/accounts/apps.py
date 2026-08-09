from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "forge.accounts"
    verbose_name = "Contas"

    def ready(self) -> None:
        import forge.accounts.signals  # noqa: F401
