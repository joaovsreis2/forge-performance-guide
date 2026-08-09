from datetime import date
from decimal import Decimal

import pytest

from forge.progress.models import (
    DailyRecovery,
    ExperienceLedger,
    HabitDefinition,
    HabitEntry,
    UserProgression,
)
from forge.progress.services import (
    HABIT_DAILY_CAP,
    award_habit_experience,
    award_recovery_experience,
    level_for_experience,
)
from forge.training.models import Exercise, PlanWorkout, TrainingPlan, WorkoutExercise
from forge.training.services import (
    complete_workout_session,
    record_completed_set,
    start_workout_session,
)


@pytest.mark.django_db
def test_workout_completion_awards_traceable_experience_once(django_user_model) -> None:
    user = django_user_model.objects.create_user("pessoa@example.com", "Senha-Forte-Forge-2026")
    plan = TrainingPlan.objects.create(user=user, name="Base", status=TrainingPlan.Status.ACTIVE)
    workout = PlanWorkout.objects.create(training_plan=plan, name="Treino A", sequence=1)
    exercise = Exercise.objects.create(
        name="Supino reto",
        slug="supino-reto-xp",
        primary_metric=Exercise.PrimaryMetric.WEIGHT_REPETITIONS,
    )
    WorkoutExercise.objects.create(
        plan_workout=workout,
        exercise=exercise,
        sequence=1,
        target_sets=1,
    )
    session = start_workout_session(user=user, plan_workout=workout)
    session_exercise = session.exercise_snapshots.get()
    record_completed_set(
        user=user,
        session_exercise=session_exercise,
        set_number=1,
        repetitions=10,
        weight_kg=Decimal("60.00"),
    )

    complete_workout_session(user=user, session=session)

    events = ExperienceLedger.objects.filter(user=user)
    assert events.filter(event_type=ExperienceLedger.EventType.WORKOUT_COMPLETION).count() == 1
    assert events.filter(event_type=ExperienceLedger.EventType.COMPLETED_SET).count() == 1
    assert events.filter(event_type=ExperienceLedger.EventType.PERSONAL_RECORD).count() == 3
    assert UserProgression.objects.get(user=user).total_experience == 182


@pytest.mark.django_db
def test_recovery_experience_is_awarded_once_per_record(django_user_model) -> None:
    user = django_user_model.objects.create_user("pessoa@example.com", "Senha-Forte-Forge-2026")
    recovery = DailyRecovery.objects.create(
        user=user,
        recovery_date=date(2026, 8, 8),
        sleep_minutes=480,
    )

    first_award = award_recovery_experience(recovery)
    second_award = award_recovery_experience(recovery)

    assert first_award.id == second_award.id
    assert ExperienceLedger.objects.count() == 1


@pytest.mark.django_db
def test_habit_experience_obeys_daily_cap(django_user_model) -> None:
    user = django_user_model.objects.create_user("pessoa@example.com", "Senha-Forte-Forge-2026")
    for index in range(10):
        habit = HabitDefinition.objects.create(user=user, name=f"Hábito {index}")
        entry = HabitEntry.objects.create(
            user=user,
            habit_definition=habit,
            entry_date=date(2026, 8, 8),
            status=HabitEntry.Status.COMPLETED,
        )
        award_habit_experience(entry)

    total = sum(event.experience_delta for event in ExperienceLedger.objects.filter(user=user))
    assert total == HABIT_DAILY_CAP


def test_level_formula_matches_specification() -> None:
    assert level_for_experience(0) == 1
    assert level_for_experience(199) == 1
    assert level_for_experience(200) == 2
    assert level_for_experience(600) == 3
    assert level_for_experience(1200) == 4
