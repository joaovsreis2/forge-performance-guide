import pytest

from forge.training.models import TrainingPlan
from forge.training.services import activate_training_plan


@pytest.mark.django_db
def test_activate_training_plan_archives_previous_active_plan(django_user_model) -> None:
    user = django_user_model.objects.create_user("pessoa@example.com", "Senha-Forte-Forge-2026")
    previous = TrainingPlan.objects.create(
        user=user,
        name="Plano antigo",
        status=TrainingPlan.Status.ACTIVE,
    )
    next_plan = TrainingPlan.objects.create(user=user, name="Plano novo")

    activate_training_plan(next_plan)
    previous.refresh_from_db()
    next_plan.refresh_from_db()

    assert previous.status == TrainingPlan.Status.ARCHIVED
    assert previous.archived_at is not None
    assert next_plan.status == TrainingPlan.Status.ACTIVE
    assert next_plan.activated_at is not None


@pytest.mark.django_db
def test_activate_training_plan_keeps_other_users_active_plan(django_user_model) -> None:
    first_user = django_user_model.objects.create_user("primeiro@example.com", "Senha-Forte-2026")
    second_user = django_user_model.objects.create_user("segundo@example.com", "Senha-Forte-2026")
    other_plan = TrainingPlan.objects.create(
        user=second_user,
        name="Plano de outra pessoa",
        status=TrainingPlan.Status.ACTIVE,
    )
    next_plan = TrainingPlan.objects.create(user=first_user, name="Plano novo")

    activate_training_plan(next_plan)
    other_plan.refresh_from_db()

    assert other_plan.status == TrainingPlan.Status.ACTIVE
