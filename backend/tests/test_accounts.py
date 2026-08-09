import pytest
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError

from forge.accounts.models import UserPreference, UserProfile

User = get_user_model()


@pytest.mark.django_db
def test_create_user_with_email() -> None:
    user = User.objects.create_user(
        email="PESSOA@EXAMPLE.COM",
        password="uma-senha-segura",
        display_name="Pessoa Forge",
    )

    assert user.email == "pessoa@example.com"
    assert user.display_name == "Pessoa Forge"
    assert user.is_active is True
    assert user.is_staff is False
    assert user.is_superuser is False


@pytest.mark.django_db
def test_create_superuser_with_expected_permissions() -> None:
    user = User.objects.create_superuser("admin@example.com", "uma-senha-segura")

    assert user.is_staff is True
    assert user.is_superuser is True
    assert user.has_perm("accounts.change_user") is True


@pytest.mark.django_db
@pytest.mark.parametrize("field", ["is_staff", "is_superuser"])
def test_create_superuser_rejects_missing_permission(field: str) -> None:
    with pytest.raises(ValueError, match="Superusuários precisam"):
        User.objects.create_superuser(
            "admin@example.com",
            "uma-senha-segura",
            **{field: False},
        )


@pytest.mark.django_db
def test_email_is_required() -> None:
    with pytest.raises(ValueError, match="e-mail é obrigatório"):
        User.objects.create_user(email="", password="uma-senha-segura")


@pytest.mark.django_db(transaction=True)
def test_email_is_unique_after_normalization() -> None:
    User.objects.create_user("pessoa@example.com", "uma-senha-segura")

    with pytest.raises(IntegrityError):
        User.objects.create_user("PESSOA@EXAMPLE.COM", "outra-senha-segura")


@pytest.mark.django_db
def test_password_is_hashed() -> None:
    raw_password = "uma-senha-segura"
    user = User.objects.create_user("pessoa@example.com", raw_password)

    assert user.password != raw_password
    assert user.check_password(raw_password) is True


@pytest.mark.django_db
def test_regular_user_has_no_staff_permissions() -> None:
    user = User.objects.create_user("pessoa@example.com", "uma-senha-segura")

    assert user.has_perm("accounts.change_user") is False
    assert user.has_module_perms("accounts") is False


@pytest.mark.django_db
def test_user_normalizes_email_when_saved_directly() -> None:
    user = User(email="DIRETO@EXAMPLE.COM", display_name="Pessoa")
    user.set_unusable_password()
    user.full_clean()
    user.save()

    assert user.email == "direto@example.com"
    assert str(user) == "direto@example.com"


@pytest.mark.django_db
def test_user_creation_provisions_profile_and_preferences() -> None:
    user = User.objects.create_user("pessoa@example.com", "uma-senha-segura")

    assert user.profile.onboarding_status == UserProfile.OnboardingStatus.PROFILE
    assert user.preferences.timezone == "America/Sao_Paulo"
    assert user.preferences.weight_unit == UserPreference.WeightUnit.KILOGRAM
    assert user.preferences.distance_unit == UserPreference.DistanceUnit.METER
    assert user.preferences.appearance == UserPreference.Appearance.SYSTEM
    assert user.preferences.rest_timer_sound_enabled is True
    assert user.preferences.rest_timer_vibration_enabled is True
    assert user.preferences.workout_reminders_enabled is False


@pytest.mark.django_db
def test_profile_physical_values_must_be_positive() -> None:
    user = User.objects.create_user("pessoa@example.com", "uma-senha-segura")
    user.profile.height_cm = 0
    user.profile.current_weight_kg = -1

    with pytest.raises(ValidationError):
        user.profile.full_clean()


@pytest.mark.django_db
def test_preference_timezone_must_be_iana_identifier() -> None:
    user = User.objects.create_user("pessoa@example.com", "uma-senha-segura")
    user.preferences.timezone = "Sao Paulo"

    with pytest.raises(ValidationError, match="fuso horário IANA"):
        user.preferences.full_clean()
