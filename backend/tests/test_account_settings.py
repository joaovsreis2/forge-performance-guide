import pytest
from django.urls import reverse


@pytest.mark.django_db
def test_account_page_requires_authentication(client) -> None:
    response = client.get(reverse("accounts:account"))

    assert response.status_code == 302
    assert response.url.startswith(f"{reverse('accounts:signin')}?next=")


@pytest.mark.django_db
def test_account_page_loads_for_authenticated_user(client, django_user_model) -> None:
    user = django_user_model.objects.create_user("pessoa@example.com", "Senha-Forte-Forge-2026")
    client.force_login(user)

    response = client.get(reverse("accounts:account"))

    assert response.status_code == 200
    assert "Perfil e preferências" in response.content.decode()
    assert "Salvar perfil" in response.content.decode()
    assert "Salvar preferências" in response.content.decode()


@pytest.mark.django_db
def test_account_profile_update_persists_user_and_profile_data(client, django_user_model) -> None:
    user = django_user_model.objects.create_user("pessoa@example.com", "Senha-Forte-Forge-2026")
    client.force_login(user)

    response = client.post(
        reverse("accounts:account"),
        {
            "form": "profile",
            "profile-display_name": "Pessoa Atualizada",
            "profile-training_goal": "hypertrophy",
            "profile-birth_date": "1995-05-10",
            "profile-height_cm": "181.5",
            "profile-current_weight_kg": "83.25",
        },
    )
    user.refresh_from_db()
    user.profile.refresh_from_db()

    assert response.status_code == 302
    assert response.url == reverse("accounts:account")
    assert user.display_name == "Pessoa Atualizada"
    assert user.profile.training_goal == "hypertrophy"
    assert user.profile.height_cm == 181.5
    assert user.profile.current_weight_kg == 83.25


@pytest.mark.django_db
def test_account_preference_update_persists_units_and_timer_settings(
    client,
    django_user_model,
) -> None:
    user = django_user_model.objects.create_user("pessoa@example.com", "Senha-Forte-Forge-2026")
    client.force_login(user)

    response = client.post(
        reverse("accounts:account"),
        {
            "form": "preferences",
            "preferences-timezone": "America/New_York",
            "preferences-weight_unit": "lb",
            "preferences-distance_unit": "mi",
            "preferences-appearance": "dark",
            "preferences-rest_timer_sound_enabled": "on",
        },
    )
    user.preferences.refresh_from_db()

    assert response.status_code == 302
    assert user.preferences.timezone == "America/New_York"
    assert user.preferences.weight_unit == "lb"
    assert user.preferences.distance_unit == "mi"
    assert user.preferences.appearance == "dark"
    assert user.preferences.rest_timer_sound_enabled is True
    assert user.preferences.rest_timer_vibration_enabled is False


@pytest.mark.django_db
def test_account_preference_update_rejects_invalid_timezone(client, django_user_model) -> None:
    user = django_user_model.objects.create_user("pessoa@example.com", "Senha-Forte-Forge-2026")
    client.force_login(user)

    response = client.post(
        reverse("accounts:account"),
        {
            "form": "preferences",
            "preferences-timezone": "Sao Paulo",
            "preferences-weight_unit": "kg",
            "preferences-distance_unit": "m",
            "preferences-appearance": "system",
            "preferences-rest_timer_sound_enabled": "on",
            "preferences-rest_timer_vibration_enabled": "on",
        },
    )
    user.preferences.refresh_from_db()

    assert response.status_code == 200
    assert "Informe um fuso horário IANA válido." in response.content.decode()
    assert user.preferences.timezone == "America/Sao_Paulo"
