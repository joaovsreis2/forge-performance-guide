from uuid import uuid4

import pytest
from django.contrib.auth.tokens import default_token_generator
from django.core import mail
from django.core.cache import cache
from django.urls import reverse
from django.utils import timezone
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from forge.progress.models import BodyMeasurement, DailyRecovery
from forge.training.models import (
    CompletedSet,
    Exercise,
    PlanWorkout,
    TrainingPlan,
    WorkoutExercise,
)


@pytest.fixture
def completed_user(django_user_model):
    user = django_user_model.objects.create_user(
        "api@example.com",
        "Senha-Forte-Forge-2026",
        display_name="Pessoa API",
    )
    user.profile.onboarding_status = "completed"
    user.profile.save(update_fields=["onboarding_status"])
    return user


@pytest.fixture
def demo_workout(completed_user):
    plan = TrainingPlan.objects.create(
        user=completed_user,
        name="Plano API",
        status=TrainingPlan.Status.ACTIVE,
    )
    workout = PlanWorkout.objects.create(
        training_plan=plan,
        name="Upper API",
        sequence=1,
        weekday=timezone.localdate().weekday(),
    )
    exercise = Exercise.objects.create(
        name="Supino API",
        slug=f"supino-api-{uuid4().hex}",
        primary_metric=Exercise.PrimaryMetric.WEIGHT_REPETITIONS,
    )
    WorkoutExercise.objects.create(
        plan_workout=workout,
        exercise=exercise,
        sequence=1,
        target_sets=2,
        target_repetitions_min=6,
        target_repetitions_max=8,
        rest_seconds=90,
    )
    return workout


@pytest.mark.django_db
def test_api_requires_authentication(client):
    response = client.get(reverse("api:me"))

    assert response.status_code == 401
    assert response.json()["detail"] == "Autenticação necessária."
    assert response["Cache-Control"] == "no-store"


@pytest.mark.django_db
def test_api_registers_and_authenticates_user(client, django_user_model):
    response = client.post(
        reverse("api:register"),
        data={
            "name": "Pessoa Cadastro",
            "email": "cadastro@example.com",
            "password": "Cadastro-Forge-2026",
            "passwordConfirmation": "Cadastro-Forge-2026",
            "acceptedTerms": True,
        },
        content_type="application/json",
    )

    assert response.status_code == 201
    assert response.json()["name"] == "Pessoa Cadastro"
    assert response.json()["onboardingCompleted"] is False
    assert django_user_model.objects.filter(email="cadastro@example.com").exists()
    assert client.get(reverse("api:me")).status_code == 200


@pytest.mark.django_db
def test_api_login_and_plan(client, completed_user, demo_workout):
    response = client.post(
        reverse("api:login"),
        data={"email": completed_user.email, "password": "Senha-Forte-Forge-2026"},
        content_type="application/json",
    )

    assert response.status_code == 200
    assert response.json()["name"] == "Pessoa API"

    plan_response = client.get(reverse("api:plan"))

    assert plan_response.status_code == 200
    assert plan_response.json()["name"] == "Plano API"
    assert plan_response.json()["todayWorkoutId"] == str(demo_workout.id)


@pytest.mark.django_db
def test_api_limits_repeated_failed_logins(client):
    cache.clear()
    payload = {"email": "rate-limit@example.com", "password": "incorreta"}

    for _ in range(5):
        response = client.post(reverse("api:login"), data=payload, content_type="application/json")
        assert response.status_code == 400

    blocked = client.post(reverse("api:login"), data=payload, content_type="application/json")

    assert blocked.status_code == 429
    assert blocked["Retry-After"] == "300"


@pytest.mark.django_db
def test_api_workout_lifecycle(client, completed_user, demo_workout):
    client.force_login(completed_user)
    start = client.post(
        reverse("api:start_workout", args=[demo_workout.id]), content_type="application/json"
    )

    assert start.status_code == 201
    session_id = start.json()["id"]
    exercise_id = start.json()["activeExerciseId"]

    record = client.post(
        reverse("api:record_set", args=[session_id]),
        data={
            "sessionExerciseId": exercise_id,
            "setNumber": 1,
            "weightKg": 70,
            "repetitions": 8,
            "clientGeneratedId": str(uuid4()),
        },
        content_type="application/json",
    )

    assert record.status_code == 200
    assert record.json()["logs"][0]["reps"] == 8
    assert record.json()["nextSetNumber"] == 2

    progress = client.get(reverse("api:progress"))
    assert progress.status_code == 200
    assert progress.json()["exerciseSeries"][0]["name"] == "Supino API"
    assert progress.json()["exerciseSeries"][0]["points"][0]["weightKg"] == 70.0


@pytest.mark.django_db
def test_api_deduplicates_offline_skipped_set(client, completed_user, demo_workout):
    client.force_login(completed_user)
    start = client.post(
        reverse("api:start_workout", args=[demo_workout.id]), content_type="application/json"
    )
    session_id = start.json()["id"]
    operation_id = str(uuid4())
    payload = {"clientGeneratedId": operation_id}

    first = client.post(
        reverse("api:skip_set", args=[session_id]),
        data=payload,
        content_type="application/json",
    )
    replay = client.post(
        reverse("api:skip_set", args=[session_id]),
        data=payload,
        content_type="application/json",
    )

    assert first.status_code == 200
    assert replay.status_code == 200
    assert (
        CompletedSet.objects.filter(
            workout_session_id=session_id, client_generated_id=operation_id
        ).count()
        == 1
    )


@pytest.mark.django_db
def test_api_updates_account_preferences(client, completed_user):
    client.force_login(completed_user)

    response = client.post(
        reverse("api:account"),
        data={
            "name": "Pessoa Atualizada",
            "trainingGoal": "strength",
            "heightCm": 181,
            "currentWeightKg": 78.4,
            "timezone": "America/Sao_Paulo",
            "weightUnit": "kg",
            "distanceUnit": "m",
            "appearance": "dark",
            "soundEnabled": False,
            "vibrationEnabled": True,
        },
        content_type="application/json",
    )

    assert response.status_code == 200
    assert response.json()["name"] == "Pessoa Atualizada"
    assert response.json()["soundEnabled"] is False


@pytest.mark.django_db
def test_api_saves_recovery_and_measurement(client, completed_user):
    client.force_login(completed_user)

    recovery = client.post(
        reverse("api:recovery"),
        data={"sleepMinutes": 450, "hydrationMl": 2400, "movementCompleted": True},
        content_type="application/json",
    )
    measurement = client.post(
        reverse("api:measurements"),
        data={"weightKg": 78.4, "chestCm": 102, "waistCm": 82.5},
        content_type="application/json",
    )

    assert recovery.status_code == 200
    assert recovery.json()["sleepMinutes"] == 450
    assert DailyRecovery.objects.filter(user=completed_user).count() == 1
    assert measurement.status_code == 201
    assert measurement.json()["weightKg"] == 78.4
    assert BodyMeasurement.objects.filter(user=completed_user).count() == 1


@pytest.mark.django_db
def test_api_completes_onboarding(client, django_user_model):
    user = django_user_model.objects.create_user(
        "onboarding-api@example.com", "Senha-Forte-Forge-2026"
    )
    client.force_login(user)

    response = client.post(
        reverse("api:onboarding"),
        data={
            "name": "Pessoa Nova",
            "trainingGoal": "hypertrophy",
            "heightCm": 170,
            "currentWeightKg": 70,
            "timezone": "America/Sao_Paulo",
        },
        content_type="application/json",
    )

    user.profile.refresh_from_db()
    assert response.status_code == 200
    assert response.json()["onboardingCompleted"] is True
    assert user.profile.training_goal == "hypertrophy"


@pytest.mark.django_db
def test_api_recovers_and_resets_password(client, completed_user):
    recover = client.post(
        reverse("api:recover_password"),
        data={"email": completed_user.email},
        content_type="application/json",
    )
    uid = urlsafe_base64_encode(force_bytes(completed_user.pk))
    token = default_token_generator.make_token(completed_user)
    reset = client.post(
        reverse("api:reset_password", args=[uid, token]),
        data={
            "password": "Nova-Senha-Forge-2026",
            "passwordConfirmation": "Nova-Senha-Forge-2026",
        },
        content_type="application/json",
    )

    completed_user.refresh_from_db()
    assert recover.status_code == 200
    assert len(mail.outbox) == 1
    assert reset.status_code == 200
    assert completed_user.check_password("Nova-Senha-Forge-2026") is True


@pytest.mark.django_db
def test_api_changes_password_and_deletes_account(client, django_user_model):
    user = django_user_model.objects.create_user(
        "security-api@example.com", "Senha-Antiga-Forge-2026"
    )
    client.force_login(user)

    changed = client.post(
        reverse("api:change_password"),
        data={
            "currentPassword": "Senha-Antiga-Forge-2026",
            "password": "Senha-Nova-Forge-2026",
            "passwordConfirmation": "Senha-Nova-Forge-2026",
        },
        content_type="application/json",
    )
    deleted = client.post(
        reverse("api:delete_account"),
        data={"password": "Senha-Nova-Forge-2026"},
        content_type="application/json",
    )

    assert changed.status_code == 200
    assert deleted.status_code == 200
    assert not django_user_model.objects.filter(pk=user.pk).exists()
