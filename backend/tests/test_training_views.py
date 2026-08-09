import pytest
from django.urls import reverse

from forge.training.models import Exercise, PlanWorkout, TrainingPlan, WorkoutExercise


@pytest.fixture
def completed_user(django_user_model):
    user = django_user_model.objects.create_user("pessoa@example.com", "Senha-Forte-Forge-2026")
    user.profile.onboarding_status = "completed"
    user.profile.save(update_fields=["onboarding_status"])
    return user


@pytest.fixture
def active_plan(completed_user):
    plan = TrainingPlan.objects.create(
        user=completed_user,
        name="Base de força",
        status=TrainingPlan.Status.ACTIVE,
        description="Plano atual.",
    )
    workout = PlanWorkout.objects.create(
        training_plan=plan,
        name="Treino A",
        sequence=1,
        estimated_duration_minutes=50,
    )
    exercise = Exercise.objects.create(
        name="Supino reto",
        slug="supino-reto-view",
        primary_metric=Exercise.PrimaryMetric.WEIGHT_REPETITIONS,
    )
    WorkoutExercise.objects.create(
        plan_workout=workout,
        exercise=exercise,
        sequence=1,
        target_sets=4,
        target_repetitions_min=8,
        target_repetitions_max=10,
        rest_seconds=120,
    )
    return plan


def test_plan_page_requires_authentication(client) -> None:
    response = client.get(reverse("training:plan"))

    assert response.status_code == 302
    assert response.url.startswith(f"{reverse('accounts:signin')}?next=")


@pytest.mark.django_db
def test_plan_page_redirects_incomplete_onboarding(client, django_user_model) -> None:
    user = django_user_model.objects.create_user("pessoa@example.com", "Senha-Forte-Forge-2026")
    client.force_login(user)

    response = client.get(reverse("training:plan"))

    assert response.status_code == 302
    assert response.url == reverse("accounts:onboarding")


@pytest.mark.django_db
def test_plan_page_shows_no_plan_state(client, completed_user) -> None:
    client.force_login(completed_user)

    response = client.get(reverse("training:plan"))

    assert response.status_code == 200
    assert "Nenhum plano ativo" in response.content.decode()


@pytest.mark.django_db
def test_plan_page_shows_active_plan(client, completed_user, active_plan) -> None:
    client.force_login(completed_user)

    response = client.get(reverse("training:plan"))

    assert response.status_code == 200
    assert active_plan.name in response.content.decode()


@pytest.mark.django_db
def test_plan_detail_shows_workouts_and_prescriptions(client, completed_user, active_plan) -> None:
    client.force_login(completed_user)

    response = client.get(reverse("training:plan_detail", kwargs={"plan_id": active_plan.id}))

    assert response.status_code == 200
    assert "Treino A" in response.content.decode()
    assert "Supino reto" in response.content.decode()
    assert "4 séries" in response.content.decode()


@pytest.mark.django_db
def test_plan_detail_enforces_ownership(client, completed_user, django_user_model) -> None:
    other_user = django_user_model.objects.create_user(
        "outro@example.com", "Senha-Forte-Forge-2026"
    )
    other_plan = TrainingPlan.objects.create(
        user=other_user,
        name="Plano de outra pessoa",
        status=TrainingPlan.Status.ACTIVE,
    )
    client.force_login(completed_user)

    response = client.get(reverse("training:plan_detail", kwargs={"plan_id": other_plan.id}))

    assert response.status_code == 404
