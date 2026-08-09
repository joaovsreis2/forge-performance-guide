import re

import pytest
from django.core import mail
from django.urls import reverse


@pytest.mark.django_db
def test_password_recovery_page_loads(client) -> None:
    response = client.get(reverse("accounts:password_reset"))

    assert response.status_code == 200
    assert "Recuperar senha" in response.content.decode()


@pytest.mark.django_db
def test_password_recovery_uses_generic_confirmation_for_unknown_email(client) -> None:
    response = client.post(
        reverse("accounts:password_reset"),
        {"email": "desconhecido@example.com"},
    )

    assert response.status_code == 302
    assert response.url == reverse("accounts:password_reset_done")
    assert len(mail.outbox) == 0


@pytest.mark.django_db
def test_password_recovery_sends_reset_email_for_existing_user(client, django_user_model) -> None:
    django_user_model.objects.create_user("pessoa@example.com", "Senha-Forte-Forge-2026")

    response = client.post(
        reverse("accounts:password_reset"),
        {"email": "pessoa@example.com"},
    )

    assert response.status_code == 302
    assert response.url == reverse("accounts:password_reset_done")
    assert len(mail.outbox) == 1
    assert "Recuperação de senha do Forge" in mail.outbox[0].subject
    assert "/accounts/password/reset/" in mail.outbox[0].body


@pytest.mark.django_db
def test_user_can_reset_password_from_email_link(client, django_user_model) -> None:
    user = django_user_model.objects.create_user("pessoa@example.com", "Senha-Forte-Forge-2026")
    client.post(reverse("accounts:password_reset"), {"email": "pessoa@example.com"})
    reset_pattern = r"http://testserver(?P<path>/accounts/password/reset/[^\s]+)"
    reset_match = re.search(reset_pattern, mail.outbox[0].body)
    reset_url = reset_match["path"]

    response = client.get(reset_url)

    assert response.status_code == 302
    set_password_url = response.url

    response = client.post(
        set_password_url,
        {
            "new_password1": "Nova-Senha-Forte-Forge-2026",
            "new_password2": "Nova-Senha-Forte-Forge-2026",
        },
    )
    user.refresh_from_db()

    assert response.status_code == 302
    assert response.url == reverse("accounts:password_reset_complete")
    assert user.check_password("Nova-Senha-Forte-Forge-2026") is True
