from decimal import Decimal

import pytest
from django.urls import reverse
from django.utils import timezone

from forge.progress.models import BodyMeasurement, DailyRecovery, HabitDefinition, HabitEntry


@pytest.fixture
def completed_user(django_user_model):
    user = django_user_model.objects.create_user("pessoa@example.com", "Senha-Forte-Forge-2026")
    user.profile.onboarding_status = "completed"
    user.profile.save(update_fields=["onboarding_status"])
    return user


def test_progress_overview_requires_authentication(client) -> None:
    response = client.get(reverse("progress:overview"))

    assert response.status_code == 302
    assert response.url.startswith(f"{reverse('accounts:signin')}?next=")


@pytest.mark.django_db
def test_progress_overview_loads_for_completed_user(client, completed_user) -> None:
    client.force_login(completed_user)

    response = client.get(reverse("progress:overview"))

    assert response.status_code == 200
    assert "Progresso" in response.content.decode()


@pytest.mark.django_db
def test_recovery_view_creates_today_record(client, completed_user) -> None:
    client.force_login(completed_user)

    response = client.post(
        reverse("progress:recovery"),
        {"sleep_minutes": "480", "hydration_ml": "2200", "cardio_completed": "on"},
    )

    assert response.status_code == 302
    recovery = DailyRecovery.objects.get(user=completed_user, recovery_date=timezone.localdate())
    assert recovery.sleep_minutes == 480
    assert recovery.hydration_ml == 2200
    assert recovery.cardio_completed is True


@pytest.mark.django_db
def test_measurement_view_creates_today_record(client, completed_user) -> None:
    client.force_login(completed_user)

    response = client.post(
        reverse("progress:measurement"),
        {"weight_kg": "82.50", "waist_cm": "84.00"},
    )

    assert response.status_code == 302
    measurement = BodyMeasurement.objects.get(
        user=completed_user,
        measurement_date=timezone.localdate(),
    )
    assert measurement.weight_kg == Decimal("82.50")
    assert measurement.waist_cm == Decimal("84.00")


@pytest.mark.django_db
def test_measurement_view_rejects_empty_snapshot(client, completed_user) -> None:
    client.force_login(completed_user)

    response = client.post(reverse("progress:measurement"), {})

    assert response.status_code == 200
    assert "pelo menos uma medida" in response.content.decode()
    assert BodyMeasurement.objects.count() == 0


@pytest.mark.django_db
def test_habit_create_view_creates_habit(client, completed_user) -> None:
    client.force_login(completed_user)

    response = client.post(
        reverse("progress:habit_create"),
        {"name": "Mobilidade", "frequency": "daily", "target_value": "10", "unit": "min"},
    )

    assert response.status_code == 302
    assert HabitDefinition.objects.filter(user=completed_user, name="Mobilidade").exists()


@pytest.mark.django_db
def test_habit_entry_view_creates_today_entry(client, completed_user) -> None:
    habit = HabitDefinition.objects.create(user=completed_user, name="Mobilidade")
    client.force_login(completed_user)

    response = client.post(
        reverse("progress:habit_entry", kwargs={"habit_id": habit.id}),
        {"status": HabitEntry.Status.COMPLETED, "value_numeric": "10"},
    )

    assert response.status_code == 302
    entry = HabitEntry.objects.get(
        user=completed_user,
        habit_definition=habit,
        entry_date=timezone.localdate(),
    )
    assert entry.status == HabitEntry.Status.COMPLETED


@pytest.mark.django_db
def test_habit_entry_view_enforces_ownership(client, django_user_model, completed_user) -> None:
    other_user = django_user_model.objects.create_user("outra@example.com", "Senha-Forte-2026")
    habit = HabitDefinition.objects.create(user=other_user, name="De outra pessoa")
    client.force_login(completed_user)

    response = client.get(reverse("progress:habit_entry", kwargs={"habit_id": habit.id}))

    assert response.status_code == 404
