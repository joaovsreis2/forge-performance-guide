from decimal import Decimal

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.utils.text import slugify

from forge.training.models import Exercise, PlanWorkout, TrainingPlan, WorkoutExercise


@pytest.fixture
def user(django_user_model):
    return django_user_model.objects.create_user("pessoa@example.com", "Senha-Forte-Forge-2026")


@pytest.fixture
def exercise() -> Exercise:
    return Exercise.objects.create(
        name="Supino reto",
        slug="supino-reto",
        primary_metric=Exercise.PrimaryMetric.WEIGHT_REPETITIONS,
        default_rest_seconds=120,
    )


@pytest.fixture
def training_plan(user) -> TrainingPlan:
    return TrainingPlan.objects.create(
        user=user,
        name="Força inicial",
        status=TrainingPlan.Status.DRAFT,
    )


@pytest.mark.django_db
def test_exercise_archive_preserves_record() -> None:
    exercise = Exercise.objects.create(
        name="Agachamento",
        slug=slugify("Agachamento"),
        primary_metric=Exercise.PrimaryMetric.WEIGHT_REPETITIONS,
    )

    exercise.archive()
    exercise.refresh_from_db()

    assert exercise.is_active is False
    assert exercise.archived_at is not None


@pytest.mark.django_db
def test_only_one_active_training_plan_is_allowed_per_user(user) -> None:
    TrainingPlan.objects.create(
        user=user,
        name="Plano ativo",
        status=TrainingPlan.Status.ACTIVE,
    )

    with pytest.raises(IntegrityError):
        TrainingPlan.objects.create(
            user=user,
            name="Outro ativo",
            status=TrainingPlan.Status.ACTIVE,
        )


@pytest.mark.django_db
def test_plan_workout_sequence_is_unique_inside_plan(training_plan) -> None:
    PlanWorkout.objects.create(training_plan=training_plan, name="Treino A", sequence=1)

    with pytest.raises(IntegrityError):
        PlanWorkout.objects.create(training_plan=training_plan, name="Treino B", sequence=1)


@pytest.mark.django_db
def test_workout_exercise_sequence_is_unique_inside_workout(training_plan, exercise) -> None:
    workout = PlanWorkout.objects.create(training_plan=training_plan, name="Treino A", sequence=1)
    WorkoutExercise.objects.create(
        plan_workout=workout,
        exercise=exercise,
        sequence=1,
        target_sets=3,
    )

    with pytest.raises(IntegrityError):
        WorkoutExercise.objects.create(
            plan_workout=workout,
            exercise=exercise,
            sequence=1,
            target_sets=4,
        )


@pytest.mark.django_db
def test_workout_exercise_repetition_range_must_be_ordered(training_plan, exercise) -> None:
    workout = PlanWorkout.objects.create(training_plan=training_plan, name="Treino A", sequence=1)
    prescription = WorkoutExercise(
        plan_workout=workout,
        exercise=exercise,
        sequence=1,
        target_sets=3,
        target_repetitions_min=12,
        target_repetitions_max=8,
    )

    with pytest.raises(ValidationError, match="repetição máxima"):
        prescription.full_clean()


@pytest.mark.django_db
def test_workout_exercise_preserves_targets_and_ordering(training_plan, exercise) -> None:
    workout = PlanWorkout.objects.create(training_plan=training_plan, name="Treino A", sequence=1)
    prescription = WorkoutExercise.objects.create(
        plan_workout=workout,
        exercise=exercise,
        sequence=1,
        target_sets=4,
        target_repetitions_min=8,
        target_repetitions_max=10,
        target_weight_kg=Decimal("80.50"),
        rest_seconds=120,
        technical_notes="Controle a descida.",
    )

    assert prescription.sequence == 1
    assert prescription.target_sets == 4
    assert prescription.target_repetitions_min == 8
    assert prescription.target_repetitions_max == 10
    assert prescription.target_weight_kg == Decimal("80.50")
    assert prescription.technical_notes == "Controle a descida."
