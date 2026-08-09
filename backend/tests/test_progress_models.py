from datetime import date

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction

from forge.progress.models import BodyMeasurement, DailyRecovery, HabitDefinition, HabitEntry


@pytest.mark.django_db
def test_daily_recovery_is_unique_per_user_and_date(django_user_model) -> None:
    user = django_user_model.objects.create_user("pessoa@example.com", "Senha-Forte-Forge-2026")
    DailyRecovery.objects.create(user=user, recovery_date=date(2026, 8, 8), sleep_minutes=480)

    with pytest.raises(IntegrityError), transaction.atomic():
        DailyRecovery.objects.create(
            user=user,
            recovery_date=date(2026, 8, 8),
            hydration_ml=2000,
        )


@pytest.mark.django_db
def test_body_measurement_requires_at_least_one_value(django_user_model) -> None:
    user = django_user_model.objects.create_user("pessoa@example.com", "Senha-Forte-Forge-2026")
    measurement = BodyMeasurement(user=user, measurement_date=date(2026, 8, 8))

    with pytest.raises(ValidationError, match="pelo menos uma medida"):
        measurement.full_clean()


@pytest.mark.django_db
def test_body_measurement_is_unique_per_user_and_date(django_user_model) -> None:
    user = django_user_model.objects.create_user("pessoa@example.com", "Senha-Forte-Forge-2026")
    BodyMeasurement.objects.create(
        user=user,
        measurement_date=date(2026, 8, 8),
        weight_kg="82.50",
    )

    with pytest.raises(IntegrityError), transaction.atomic():
        BodyMeasurement.objects.create(
            user=user,
            measurement_date=date(2026, 8, 8),
            weight_kg="82.70",
        )


@pytest.mark.django_db
def test_habit_entry_is_unique_per_habit_and_date(django_user_model) -> None:
    user = django_user_model.objects.create_user("pessoa@example.com", "Senha-Forte-Forge-2026")
    habit = HabitDefinition.objects.create(user=user, name="Mobilidade")
    HabitEntry.objects.create(
        user=user,
        habit_definition=habit,
        entry_date=date(2026, 8, 8),
        status=HabitEntry.Status.COMPLETED,
    )

    with pytest.raises(IntegrityError), transaction.atomic():
        HabitEntry.objects.create(
            user=user,
            habit_definition=habit,
            entry_date=date(2026, 8, 8),
            status=HabitEntry.Status.PARTIAL,
        )
