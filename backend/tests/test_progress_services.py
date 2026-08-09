from decimal import Decimal

import pytest

from forge.progress.models import PersonalRecord
from forge.training.models import (
    Exercise,
    PlanWorkout,
    TrainingPlan,
    WorkoutExercise,
    WorkoutSession,
)
from forge.training.services import (
    complete_workout_session,
    record_completed_set,
    start_workout_session,
)


@pytest.fixture
def planned_workout(django_user_model):
    user = django_user_model.objects.create_user("pessoa@example.com", "Senha-Forte-Forge-2026")
    plan = TrainingPlan.objects.create(user=user, name="Base", status=TrainingPlan.Status.ACTIVE)
    workout = PlanWorkout.objects.create(training_plan=plan, name="Treino A", sequence=1)
    exercise = Exercise.objects.create(
        name="Supino reto",
        slug="supino-reto-progress",
        primary_metric=Exercise.PrimaryMetric.WEIGHT_REPETITIONS,
    )
    WorkoutExercise.objects.create(
        plan_workout=workout,
        exercise=exercise,
        sequence=1,
        target_sets=1,
    )
    return user, workout, exercise


@pytest.mark.django_db
def test_workout_completion_creates_personal_records(planned_workout) -> None:
    user, workout, exercise = planned_workout
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

    session.refresh_from_db()
    assert session.status == WorkoutSession.Status.COMPLETED
    assert PersonalRecord.objects.filter(
        user=user,
        exercise=exercise,
        record_type=PersonalRecord.RecordType.MAXIMUM_WEIGHT,
        value_numeric=Decimal("60.00"),
        is_current=True,
    ).exists()
    assert PersonalRecord.objects.filter(
        user=user,
        exercise=exercise,
        record_type=PersonalRecord.RecordType.HIGHEST_VOLUME,
        value_numeric=Decimal("600.00"),
        is_current=True,
    ).exists()


@pytest.mark.django_db
def test_lower_personal_record_does_not_replace_current_record(planned_workout) -> None:
    user, workout, exercise = planned_workout
    first_session = start_workout_session(user=user, plan_workout=workout)
    first_exercise = first_session.exercise_snapshots.get()
    record_completed_set(
        user=user,
        session_exercise=first_exercise,
        set_number=1,
        repetitions=10,
        weight_kg=Decimal("60.00"),
    )
    complete_workout_session(user=user, session=first_session)

    second_session = start_workout_session(user=user, plan_workout=workout)
    second_exercise = second_session.exercise_snapshots.get()
    record_completed_set(
        user=user,
        session_exercise=second_exercise,
        set_number=1,
        repetitions=8,
        weight_kg=Decimal("50.00"),
    )
    complete_workout_session(user=user, session=second_session)

    assert PersonalRecord.objects.filter(
        user=user,
        exercise=exercise,
        record_type=PersonalRecord.RecordType.MAXIMUM_WEIGHT,
        is_current=True,
    ).get().value_numeric == Decimal("60.00")
