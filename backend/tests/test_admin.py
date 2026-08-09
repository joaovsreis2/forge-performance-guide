import pytest
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.urls import reverse

from forge.training.models import Exercise, PlanWorkout, TrainingPlan, WorkoutExercise


def test_custom_user_is_registered_in_admin() -> None:
    assert get_user_model() in admin.site._registry
    assert Exercise in admin.site._registry
    assert TrainingPlan in admin.site._registry
    assert PlanWorkout in admin.site._registry
    assert WorkoutExercise in admin.site._registry


@pytest.mark.django_db
def test_admin_login_page_loads(client) -> None:
    response = client.get(reverse("admin:login"))

    assert response.status_code == 200
    assert "Administração do Django" in response.content.decode()


@pytest.mark.django_db
def test_custom_user_admin_add_page_loads(client) -> None:
    user_model = get_user_model()
    admin_user = user_model.objects.create_superuser(
        "admin@example.com",
        "uma-senha-segura",
    )
    client.force_login(admin_user)

    response = client.get(reverse("admin:accounts_user_add"))

    assert response.status_code == 200
    assert 'name="email"' in response.content.decode()
