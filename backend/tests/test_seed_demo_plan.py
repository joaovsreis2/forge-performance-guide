import pytest
from django.core.management import call_command
from django.core.management.base import CommandError

from forge.training.models import Exercise, TrainingPlan


@pytest.mark.django_db
def test_seed_demo_plan_creates_active_plan_for_existing_user(django_user_model) -> None:
    user = django_user_model.objects.create_user("teste@forge.local", "Senha-Forte-Forge-2026")

    call_command("seed_demo_plan", email=user.email)

    plan = TrainingPlan.objects.get(user=user, status=TrainingPlan.Status.ACTIVE)

    assert plan.name == "Forge Demo — Base de Força"
    assert plan.workouts.count() == 2
    assert Exercise.objects.count() == 6
    assert plan.workouts.first().exercise_prescriptions.count() == 3


@pytest.mark.django_db
def test_seed_demo_plan_rejects_unknown_user() -> None:
    with pytest.raises(CommandError, match="Usuário não encontrado"):
        call_command("seed_demo_plan", email="ausente@example.com")
