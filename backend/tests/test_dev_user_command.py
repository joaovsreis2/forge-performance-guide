import pytest
from django.core.management import call_command
from django.core.management.base import CommandError


@pytest.mark.django_db
def test_create_dev_user_command_creates_completed_user(django_user_model) -> None:
    call_command(
        "create_dev_user",
        email="Pessoa@Example.com",
        password="Senha-Forte-Forge-2026",
        name="Pessoa Teste",
        complete_onboarding=True,
    )

    user = django_user_model.objects.get(email="pessoa@example.com")

    assert user.display_name == "Pessoa Teste"
    assert user.check_password("Senha-Forte-Forge-2026") is True
    assert user.profile.onboarding_status == "completed"


@pytest.mark.django_db
def test_create_dev_user_command_rejects_short_password() -> None:
    with pytest.raises(CommandError, match="pelo menos 12"):
        call_command(
            "create_dev_user",
            email="pessoa@example.com",
            password="curta",
        )
