from decimal import Decimal
from uuid import uuid4

import pytest
from django.core.exceptions import ValidationError

from forge.training.models import (
    CompletedSet,
    Exercise,
    PlanWorkout,
    SessionExercise,
    TrainingPlan,
    WorkoutExercise,
    WorkoutSession,
)
from forge.training.services import (
    cancel_workout_session,
    complete_workout_session,
    pause_workout_session,
    record_completed_set,
    resume_workout_session,
    skip_completed_set,
    skip_session_exercise,
    start_workout_session,
)


@pytest.fixture
def planned_workout(django_user_model):
    user = django_user_model.objects.create_user("pessoa@example.com", "Senha-Forte-Forge-2026")
    plan = TrainingPlan.objects.create(
        user=user,
        name="Base de força",
        status=TrainingPlan.Status.ACTIVE,
    )
    workout = PlanWorkout.objects.create(training_plan=plan, name="Treino A", sequence=1)
    first_exercise = Exercise.objects.create(
        name="Supino reto",
        slug="supino-reto-execution",
        primary_metric=Exercise.PrimaryMetric.WEIGHT_REPETITIONS,
        instructions="Mantenha controle.",
    )
    second_exercise = Exercise.objects.create(
        name="Prancha",
        slug="prancha-execution",
        primary_metric=Exercise.PrimaryMetric.DURATION,
    )
    WorkoutExercise.objects.create(
        plan_workout=workout,
        exercise=first_exercise,
        sequence=1,
        target_sets=2,
        target_repetitions_min=8,
        target_repetitions_max=10,
        target_weight_kg=Decimal("60.00"),
        rest_seconds=120,
        technical_notes="Controle a descida.",
    )
    WorkoutExercise.objects.create(
        plan_workout=workout,
        exercise=second_exercise,
        sequence=2,
        target_sets=1,
        target_duration_seconds=45,
        rest_seconds=60,
    )
    return user, workout


@pytest.mark.django_db
def test_start_workout_session_creates_historical_snapshots(planned_workout) -> None:
    user, workout = planned_workout

    session = start_workout_session(user=user, plan_workout=workout)

    snapshots = list(session.exercise_snapshots.order_by("sequence"))
    assert session.status == WorkoutSession.Status.ACTIVE
    assert session.workout_name_snapshot == "Treino A"
    assert len(snapshots) == 2
    assert snapshots[0].status == SessionExercise.Status.ACTIVE
    assert snapshots[0].exercise_name_snapshot == "Supino reto"
    assert snapshots[0].target_weight_kg_snapshot == Decimal("60.00")
    assert snapshots[0].technical_notes_snapshot == "Controle a descida."
    assert snapshots[1].status == SessionExercise.Status.PENDING

    workout.name = "Treino editado depois"
    workout.save(update_fields=["name", "updated_at"])
    session.refresh_from_db()

    assert session.workout_name_snapshot == "Treino A"


@pytest.mark.django_db
def test_start_workout_session_blocks_duplicate_open_session(planned_workout) -> None:
    user, workout = planned_workout
    start_workout_session(user=user, plan_workout=workout)

    with pytest.raises(ValidationError, match="treino em andamento"):
        start_workout_session(user=user, plan_workout=workout)


@pytest.mark.django_db
def test_start_workout_session_is_idempotent_by_client_id(planned_workout) -> None:
    user, workout = planned_workout
    client_id = uuid4()

    first_session = start_workout_session(
        user=user,
        plan_workout=workout,
        client_generated_id=client_id,
    )
    second_session = start_workout_session(
        user=user,
        plan_workout=workout,
        client_generated_id=client_id,
    )

    assert second_session.id == first_session.id
    assert WorkoutSession.objects.count() == 1


@pytest.mark.django_db
def test_record_completed_set_requires_meaningful_data(planned_workout) -> None:
    user, workout = planned_workout
    session = start_workout_session(user=user, plan_workout=workout)
    session_exercise = session.exercise_snapshots.get(sequence=1)

    with pytest.raises(ValidationError, match="ao menos um dado"):
        record_completed_set(user=user, session_exercise=session_exercise, set_number=1)


@pytest.mark.django_db
def test_record_completed_set_is_idempotent_and_advances_exercise(planned_workout) -> None:
    user, workout = planned_workout
    session = start_workout_session(user=user, plan_workout=workout)
    session_exercise = session.exercise_snapshots.get(sequence=1)
    client_id = uuid4()

    first_set = record_completed_set(
        user=user,
        session_exercise=session_exercise,
        set_number=1,
        client_generated_id=client_id,
        repetitions=10,
        weight_kg=Decimal("60.00"),
    )
    second_set = record_completed_set(
        user=user,
        session_exercise=session_exercise,
        set_number=1,
        client_generated_id=client_id,
        repetitions=10,
        weight_kg=Decimal("60.00"),
    )
    record_completed_set(
        user=user,
        session_exercise=session_exercise,
        set_number=2,
        repetitions=9,
        weight_kg=Decimal("60.00"),
    )
    session_exercise.refresh_from_db()
    next_exercise = session.exercise_snapshots.get(sequence=2)

    assert second_set.id == first_set.id
    assert CompletedSet.objects.count() == 2
    assert session_exercise.status == SessionExercise.Status.COMPLETED
    assert next_exercise.status == SessionExercise.Status.ACTIVE


@pytest.mark.django_db
def test_skip_completed_set_counts_toward_exercise_progress(planned_workout) -> None:
    user, workout = planned_workout
    session = start_workout_session(user=user, plan_workout=workout)
    session_exercise = session.exercise_snapshots.get(sequence=1)

    skip_completed_set(user=user, session_exercise=session_exercise, set_number=1)
    skip_completed_set(user=user, session_exercise=session_exercise, set_number=2)
    session_exercise.refresh_from_db()
    next_exercise = session.exercise_snapshots.get(sequence=2)

    assert session_exercise.status == SessionExercise.Status.COMPLETED
    assert session_exercise.completed_sets.filter(status=CompletedSet.Status.SKIPPED).count() == 2
    assert next_exercise.status == SessionExercise.Status.ACTIVE


@pytest.mark.django_db
def test_skip_session_exercise_activates_next_exercise(planned_workout) -> None:
    user, workout = planned_workout
    session = start_workout_session(user=user, plan_workout=workout)
    session_exercise = session.exercise_snapshots.get(sequence=1)

    skip_session_exercise(user=user, session_exercise=session_exercise)
    session_exercise.refresh_from_db()
    next_exercise = session.exercise_snapshots.get(sequence=2)

    assert session_exercise.status == SessionExercise.Status.SKIPPED
    assert session_exercise.skipped_at is not None
    assert next_exercise.status == SessionExercise.Status.ACTIVE


@pytest.mark.django_db
def test_workout_session_lifecycle_prevents_terminal_reactivation(planned_workout) -> None:
    user, workout = planned_workout
    session = start_workout_session(user=user, plan_workout=workout)

    pause_workout_session(user=user, session=session)
    session.refresh_from_db()
    assert session.status == WorkoutSession.Status.PAUSED

    resume_workout_session(user=user, session=session)
    session.refresh_from_db()
    assert session.status == WorkoutSession.Status.ACTIVE

    cancel_workout_session(user=user, session=session)
    session.refresh_from_db()
    assert session.status == WorkoutSession.Status.CANCELLED
    assert session.cancelled_at is not None

    with pytest.raises(ValidationError, match="Somente treinos pausados"):
        resume_workout_session(user=user, session=session)


@pytest.mark.django_db
def test_complete_workout_session_requires_completed_set(planned_workout) -> None:
    user, workout = planned_workout
    session = start_workout_session(user=user, plan_workout=workout)

    with pytest.raises(ValidationError, match="Registre pelo menos uma série"):
        complete_workout_session(user=user, session=session)


@pytest.mark.django_db
def test_complete_workout_session_marks_pending_exercises_skipped(planned_workout) -> None:
    user, workout = planned_workout
    session = start_workout_session(user=user, plan_workout=workout)
    session_exercise = session.exercise_snapshots.get(sequence=1)
    record_completed_set(
        user=user,
        session_exercise=session_exercise,
        set_number=1,
        repetitions=8,
        weight_kg=Decimal("60.00"),
    )

    complete_workout_session(user=user, session=session)
    session.refresh_from_db()

    assert session.status == WorkoutSession.Status.COMPLETED
    assert session.completed_at is not None
    assert session.duration_seconds is not None
    assert session.exercise_snapshots.get(sequence=2).status == SessionExercise.Status.SKIPPED
