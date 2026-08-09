from unittest.mock import patch

import pytest
from django.db import DatabaseError, connection
from django.urls import reverse
from django.utils import timezone

from forge.training.models import Exercise, PlanWorkout, TrainingPlan, WorkoutExercise


def test_home_page_requires_authentication(client) -> None:
    response = client.get(reverse("core:home"))

    assert response.status_code == 302
    assert response.url == reverse("accounts:signin")


def test_offline_page_is_available_without_authentication(client) -> None:
    response = client.get(reverse("core:offline"))

    assert response.status_code == 200
    assert "Você está sem conexão" in response.content.decode()


def test_service_worker_is_served_from_root_scope(client) -> None:
    response = client.get(reverse("core:service_worker"))

    assert response.status_code == 200
    assert response.headers["Content-Type"].startswith("application/javascript")
    assert response.headers["Service-Worker-Allowed"] == "/"
    content = response.content.decode()
    assert "forge-shell-v1" in content
    assert reverse("core:offline") in content
    assert "offline_workout.js" in content


@pytest.mark.django_db
def test_home_page_redirects_incomplete_onboarding(client, django_user_model) -> None:
    user = django_user_model.objects.create_user("pessoa@example.com", "Senha-Forte-Forge-2026")
    client.force_login(user)

    response = client.get(reverse("core:home"))

    assert response.status_code == 302
    assert response.url == reverse("accounts:onboarding")


@pytest.mark.django_db
def test_today_page_loads_after_completed_onboarding(client, django_user_model) -> None:
    user = django_user_model.objects.create_user("pessoa@example.com", "Senha-Forte-Forge-2026")
    user.profile.onboarding_status = "completed"
    user.profile.save(update_fields=["onboarding_status"])
    client.force_login(user)

    response = client.get(reverse("core:home"))

    assert response.status_code == 200
    assert "Today" in response.content.decode()
    assert "Aguardando configuração" in response.content.decode()
    assert "test" in response.content.decode()
    assert "site.webmanifest" in response.content.decode()
    assert "pwa.js" in response.content.decode()


@pytest.mark.django_db
def test_today_page_shows_active_training_plan(client, django_user_model) -> None:
    user = django_user_model.objects.create_user("pessoa@example.com", "Senha-Forte-Forge-2026")
    user.profile.onboarding_status = "completed"
    user.profile.save(update_fields=["onboarding_status"])
    TrainingPlan.objects.create(
        user=user,
        name="Base de força",
        status=TrainingPlan.Status.ACTIVE,
    )
    client.force_login(user)

    response = client.get(reverse("core:home"))

    assert response.status_code == 200
    assert "Base de força" in response.content.decode()


@pytest.mark.django_db
def test_today_page_shows_scheduled_workout_for_current_weekday(client, django_user_model) -> None:
    user = django_user_model.objects.create_user("pessoa@example.com", "Senha-Forte-Forge-2026")
    user.profile.onboarding_status = "completed"
    user.profile.save(update_fields=["onboarding_status"])
    plan = TrainingPlan.objects.create(
        user=user,
        name="Base de força",
        status=TrainingPlan.Status.ACTIVE,
    )
    workout = PlanWorkout.objects.create(
        training_plan=plan,
        name="Treino de hoje",
        sequence=1,
        weekday=timezone.localdate().weekday(),
    )
    exercise = Exercise.objects.create(
        name="Supino reto",
        slug="supino-reto-today",
        primary_metric=Exercise.PrimaryMetric.WEIGHT_REPETITIONS,
    )
    WorkoutExercise.objects.create(
        plan_workout=workout,
        exercise=exercise,
        sequence=1,
        target_sets=4,
    )
    client.force_login(user)

    response = client.get(reverse("core:home"))

    assert response.status_code == 200
    content = response.content.decode()
    assert "Treino de hoje" in content
    assert "Ver preparação" in content


@pytest.mark.django_db
def test_today_page_shows_rest_day_when_no_workout_matches_today(client, django_user_model) -> None:
    user = django_user_model.objects.create_user("pessoa@example.com", "Senha-Forte-Forge-2026")
    user.profile.onboarding_status = "completed"
    user.profile.save(update_fields=["onboarding_status"])
    tomorrow_weekday = (timezone.localdate().weekday() + 1) % 7
    plan = TrainingPlan.objects.create(
        user=user,
        name="Base de força",
        status=TrainingPlan.Status.ACTIVE,
    )
    PlanWorkout.objects.create(
        training_plan=plan,
        name="Treino futuro",
        sequence=1,
        weekday=tomorrow_weekday,
    )
    client.force_login(user)

    response = client.get(reverse("core:home"))

    assert response.status_code == 200
    assert "Dia de descanso" in response.content.decode()


@pytest.mark.django_db
def test_health_check_reports_application_and_database(client) -> None:
    response = client.get(reverse("core:health"))

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "ok"}


def test_health_check_hides_database_error_details(client) -> None:
    with patch("forge.core.views.connection.cursor", side_effect=DatabaseError("sensitive")):
        response = client.get(reverse("core:health"))

    assert response.status_code == 503
    assert response.json() == {"status": "error", "database": "unavailable"}
    assert "sensitive" not in response.content.decode()


@pytest.mark.django_db
def test_postgresql_connection() -> None:
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
        row = cursor.fetchone()

    assert row == (1,)
