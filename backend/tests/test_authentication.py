import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse

User = get_user_model()


@pytest.mark.django_db
def test_registration_page_loads(client) -> None:
    response = client.get(reverse("accounts:register"))

    assert response.status_code == 200
    assert "Crie sua conta" in response.content.decode()


@pytest.mark.django_db
def test_registration_creates_user_and_starts_authenticated_session(client) -> None:
    response = client.post(
        reverse("accounts:register"),
        {
            "email": "Pessoa@Example.com",
            "display_name": "Pessoa Forge",
            "password1": "Senha-Forte-Forge-2026",
            "password2": "Senha-Forte-Forge-2026",
            "accepted_terms": "on",
        },
    )

    user = User.objects.get(email="pessoa@example.com")

    assert response.status_code == 302
    assert response.url == reverse("accounts:onboarding")
    assert user.display_name == "Pessoa Forge"
    assert user.profile is not None
    assert user.preferences is not None
    assert str(client.session["_auth_user_id"]) == str(user.pk)


@pytest.mark.django_db
def test_registration_rejects_duplicate_email_after_normalization(client) -> None:
    User.objects.create_user("pessoa@example.com", "Senha-Forte-Forge-2026")

    response = client.post(
        reverse("accounts:register"),
        {
            "email": "PESSOA@EXAMPLE.COM",
            "password1": "Senha-Forte-Forge-2026",
            "password2": "Senha-Forte-Forge-2026",
            "accepted_terms": "on",
        },
    )

    assert response.status_code == 200
    assert User.objects.count() == 1
    assert "Este e-mail já está cadastrado." in response.content.decode()


@pytest.mark.django_db
def test_signin_page_loads(client) -> None:
    response = client.get(reverse("accounts:signin"))

    assert response.status_code == 200
    assert "Entrar" in response.content.decode()


@pytest.mark.django_db
def test_user_can_sign_in_with_email_and_password(client) -> None:
    User.objects.create_user("pessoa@example.com", "Senha-Forte-Forge-2026")

    response = client.post(
        reverse("accounts:signin"),
        {
            "username": "pessoa@example.com",
            "password": "Senha-Forte-Forge-2026",
        },
    )

    assert response.status_code == 302
    assert response.url == reverse("accounts:onboarding")


@pytest.mark.django_db
def test_onboarding_requires_authentication(client) -> None:
    response = client.get(reverse("accounts:onboarding"))

    assert response.status_code == 302
    assert response.url.startswith(f"{reverse('accounts:signin')}?next=")


@pytest.mark.django_db
def test_authenticated_user_can_access_onboarding(client) -> None:
    user = User.objects.create_user("pessoa@example.com", "Senha-Forte-Forge-2026")
    client.force_login(user)

    response = client.get(reverse("accounts:onboarding"))

    assert response.status_code == 302
    assert response.url == reverse("accounts:onboarding_profile")


@pytest.mark.django_db
def test_user_can_sign_out_with_post(client) -> None:
    user = User.objects.create_user("pessoa@example.com", "Senha-Forte-Forge-2026")
    client.force_login(user)

    response = client.post(reverse("accounts:logout"))

    assert response.status_code == 302
    assert response.url == reverse("accounts:signin")
    assert "_auth_user_id" not in client.session


@pytest.mark.django_db
def test_onboarding_profile_step_updates_display_name_and_resumes_at_goal(client) -> None:
    user = User.objects.create_user("pessoa@example.com", "Senha-Forte-Forge-2026")
    client.force_login(user)

    response = client.post(
        reverse("accounts:onboarding_profile"),
        {"display_name": "Pessoa Forge"},
    )
    user.refresh_from_db()

    assert response.status_code == 302
    assert response.url == reverse("accounts:onboarding")
    assert user.display_name == "Pessoa Forge"
    assert user.profile.onboarding_status == "training_goal"
    assert client.get(reverse("accounts:onboarding")).url == reverse("accounts:onboarding_goal")


@pytest.mark.django_db
def test_onboarding_goal_step_updates_training_goal(client) -> None:
    user = User.objects.create_user("pessoa@example.com", "Senha-Forte-Forge-2026")
    user.profile.onboarding_status = "training_goal"
    user.profile.save(update_fields=["onboarding_status"])
    client.force_login(user)

    response = client.post(
        reverse("accounts:onboarding_goal"),
        {"training_goal": "strength"},
    )
    user.profile.refresh_from_db()

    assert response.status_code == 302
    assert user.profile.training_goal == "strength"
    assert user.profile.onboarding_status == "physical_info"


@pytest.mark.django_db
def test_onboarding_physical_step_updates_required_measurements(client) -> None:
    user = User.objects.create_user("pessoa@example.com", "Senha-Forte-Forge-2026")
    user.profile.onboarding_status = "physical_info"
    user.profile.save(update_fields=["onboarding_status"])
    client.force_login(user)

    response = client.post(
        reverse("accounts:onboarding_physical"),
        {
            "birth_date": "1995-05-10",
            "height_cm": "180",
            "current_weight_kg": "82.50",
        },
    )
    user.profile.refresh_from_db()

    assert response.status_code == 302
    assert user.profile.onboarding_status == "plan_setup"
    assert user.profile.height_cm == 180
    assert user.profile.current_weight_kg == 82.50


@pytest.mark.django_db
def test_onboarding_plan_step_completes_onboarding_and_enters_today(client) -> None:
    user = User.objects.create_user("pessoa@example.com", "Senha-Forte-Forge-2026")
    user.profile.onboarding_status = "plan_setup"
    user.profile.save(update_fields=["onboarding_status"])
    client.force_login(user)

    response = client.post(reverse("accounts:onboarding_plan"))
    user.profile.refresh_from_db()

    assert response.status_code == 302
    assert response.url == reverse("core:home")
    assert user.profile.onboarding_status == "completed"


@pytest.mark.django_db
def test_completed_onboarding_redirects_to_today(client) -> None:
    user = User.objects.create_user("pessoa@example.com", "Senha-Forte-Forge-2026")
    user.profile.onboarding_status = "completed"
    user.profile.save(update_fields=["onboarding_status"])
    client.force_login(user)

    response = client.get(reverse("accounts:onboarding"))

    assert response.status_code == 302
    assert response.url == reverse("core:home")
