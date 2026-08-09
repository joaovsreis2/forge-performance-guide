from decimal import Decimal
from uuid import uuid4

import pytest
from django.urls import reverse

from forge.core.models import SyncOperation
from forge.training.models import (
    Exercise,
    PlanWorkout,
    TrainingPlan,
    WorkoutExercise,
    WorkoutSession,
)
from forge.training.services import start_workout_session


@pytest.fixture
def completed_user(django_user_model):
    user = django_user_model.objects.create_user("pessoa@example.com", "Senha-Forte-Forge-2026")
    user.profile.onboarding_status = "completed"
    user.profile.save(update_fields=["onboarding_status"])
    return user


@pytest.fixture
def workout(completed_user):
    plan = TrainingPlan.objects.create(
        user=completed_user,
        name="Base de força",
        status=TrainingPlan.Status.ACTIVE,
    )
    workout = PlanWorkout.objects.create(training_plan=plan, name="Treino A", sequence=1)
    exercise = Exercise.objects.create(
        name="Supino reto",
        slug="supino-reto-execution-view",
        primary_metric=Exercise.PrimaryMetric.WEIGHT_REPETITIONS,
    )
    WorkoutExercise.objects.create(
        plan_workout=workout,
        exercise=exercise,
        sequence=1,
        target_sets=1,
        target_repetitions_min=8,
        target_repetitions_max=10,
        target_weight_kg=Decimal("60.00"),
        rest_seconds=120,
    )
    return workout


def test_workout_preview_requires_authentication(client, workout) -> None:
    response = client.get(reverse("training:workout_preview", kwargs={"workout_id": workout.id}))

    assert response.status_code == 302
    assert response.url.startswith(f"{reverse('accounts:signin')}?next=")


@pytest.mark.django_db
def test_workout_preview_shows_start_action(client, completed_user, workout) -> None:
    client.force_login(completed_user)

    response = client.get(reverse("training:workout_preview", kwargs={"workout_id": workout.id}))

    assert response.status_code == 200
    content = response.content.decode()
    assert "Treino A" in content
    assert "Iniciar treino" in content


@pytest.mark.django_db
def test_workout_start_creates_session_and_redirects_to_active(
    client,
    completed_user,
    workout,
) -> None:
    client.force_login(completed_user)

    response = client.post(reverse("training:workout_start", kwargs={"workout_id": workout.id}))

    session = WorkoutSession.objects.get(user=completed_user)
    assert response.status_code == 302
    assert response.url == reverse("training:session_active", kwargs={"session_id": session.id})


@pytest.mark.django_db
def test_active_session_records_set_and_redirects(client, completed_user, workout) -> None:
    session = start_workout_session(user=completed_user, plan_workout=workout)
    client.force_login(completed_user)

    response = client.post(
        reverse("training:session_active", kwargs={"session_id": session.id}),
        {"repetitions": "10", "weight_kg": "60.00"},
    )

    assert response.status_code == 302
    assert session.completed_sets.count() == 1


@pytest.mark.django_db
def test_active_session_deduplicates_set_by_client_generated_id(
    client,
    completed_user,
    workout,
) -> None:
    session = start_workout_session(user=completed_user, plan_workout=workout)
    client_id = uuid4()
    client.force_login(completed_user)

    payload = {
        "set_number": "1",
        "client_generated_id": str(client_id),
        "repetitions": "10",
        "weight_kg": "60.00",
    }
    first_response = client.post(
        reverse("training:session_active", kwargs={"session_id": session.id}),
        payload,
    )
    second_response = client.post(
        reverse("training:session_active", kwargs={"session_id": session.id}),
        payload,
    )

    assert first_response.status_code == 302
    assert second_response.status_code == 302
    assert session.completed_sets.count() == 1
    assert SyncOperation.objects.filter(
        user=completed_user,
        client_operation_id=client_id,
        status=SyncOperation.Status.COMPLETED,
    ).exists()


@pytest.mark.django_db
def test_active_session_shows_elapsed_based_rest_timer(client, completed_user, workout) -> None:
    session = start_workout_session(user=completed_user, plan_workout=workout)
    session_exercise = session.exercise_snapshots.get()
    client.force_login(completed_user)
    client.post(
        reverse("training:session_active", kwargs={"session_id": session.id}),
        {"repetitions": "10", "weight_kg": "60.00"},
    )

    response = client.get(reverse("training:session_active", kwargs={"session_id": session.id}))

    assert response.status_code == 200
    content = response.content.decode()
    assert "data-rest-timer" in content
    assert str(session_exercise.rest_seconds_snapshot) in content


@pytest.mark.django_db
def test_active_session_renders_offline_queue_hooks(client, completed_user, workout) -> None:
    session = start_workout_session(user=completed_user, plan_workout=workout)
    client.force_login(completed_user)

    response = client.get(reverse("training:session_active", kwargs={"session_id": session.id}))

    assert response.status_code == 200
    content = response.content.decode()
    assert "data-offline-set-form" in content
    assert "client_generated_id" in content
    assert "offline_workout.js" in content


@pytest.mark.django_db
def test_active_session_can_skip_set(client, completed_user, workout) -> None:
    session = start_workout_session(user=completed_user, plan_workout=workout)
    client.force_login(completed_user)

    response = client.post(reverse("training:session_skip_set", kwargs={"session_id": session.id}))

    assert response.status_code == 302
    completed_set = session.completed_sets.get()
    assert completed_set.status == "skipped"


@pytest.mark.django_db
def test_active_session_can_skip_exercise(client, completed_user, workout) -> None:
    session = start_workout_session(user=completed_user, plan_workout=workout)
    client.force_login(completed_user)

    response = client.post(
        reverse("training:session_skip_exercise", kwargs={"session_id": session.id})
    )

    assert response.status_code == 302
    assert session.exercise_snapshots.get().status == "skipped"


@pytest.mark.django_db
def test_today_prioritizes_open_workout_session(client, completed_user, workout) -> None:
    session = start_workout_session(user=completed_user, plan_workout=workout)
    client.force_login(completed_user)

    response = client.get(reverse("core:home"))

    assert response.status_code == 200
    content = response.content.decode()
    assert "Treino em andamento" in content
    assert str(session.id) in content


@pytest.mark.django_db
def test_session_views_enforce_ownership(
    client,
    django_user_model,
    completed_user,
    workout,
) -> None:
    session = start_workout_session(user=completed_user, plan_workout=workout)
    other_user = django_user_model.objects.create_user(
        "outra@example.com",
        "Senha-Forte-Forge-2026",
    )
    other_user.profile.onboarding_status = "completed"
    other_user.profile.save(update_fields=["onboarding_status"])
    client.force_login(other_user)

    response = client.get(reverse("training:session_active", kwargs={"session_id": session.id}))

    assert response.status_code == 404
