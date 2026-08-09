import pytest
from django.core.management import call_command
from django.core.management.base import CommandError

from forge.training.models import Exercise, TrainingPlan
from forge.training.services import import_training_plan_from_csv

VALID_CSV_HEADER = (
    "workout_sequence,workout_name,weekday,estimated_duration_minutes,"
    "exercise_sequence,exercise_name,primary_metric,target_sets,target_repetitions_min,"
    "target_repetitions_max,target_weight_kg,target_duration_seconds,target_distance_meters,"
    "rest_seconds,technical_notes,exercise_instructions"
)
VALID_CSV = "\n".join(
    [
        VALID_CSV_HEADER,
        (
            "1,Treino A,0,50,1,Supino reto,weight_repetitions,4,8,10,60,,,120,"
            "Controle a descida,Use pegada firme"
        ),
        "1,Treino A,0,50,2,Prancha,duration,3,,,,45,,60,Respire com calma,Contraia o abdome",
        "2,Treino B,3,45,1,Agachamento,weight_repetitions,4,6,8,80,,,150,Amplitude confortável,",
        "",
    ]
)


@pytest.mark.django_db
def test_training_plan_import_dry_run_validates_without_creating_records(
    django_user_model,
    tmp_path,
) -> None:
    user = django_user_model.objects.create_user("pessoa@example.com", "Senha-Forte-Forge-2026")
    csv_path = tmp_path / "plan.csv"
    csv_path.write_text(VALID_CSV, encoding="utf-8")

    result = import_training_plan_from_csv(
        csv_path=csv_path,
        user_email=user.email,
        plan_name="Base importada",
    )

    assert result.is_valid
    assert result.dry_run is True
    assert result.workouts_seen == 2
    assert result.prescriptions_seen == 3
    assert TrainingPlan.objects.count() == 0
    assert Exercise.objects.count() == 0


@pytest.mark.django_db
def test_training_plan_import_creates_and_activates_plan(django_user_model, tmp_path) -> None:
    user = django_user_model.objects.create_user("pessoa@example.com", "Senha-Forte-Forge-2026")
    previous_plan = TrainingPlan.objects.create(
        user=user,
        name="Plano antigo",
        status=TrainingPlan.Status.ACTIVE,
    )
    csv_path = tmp_path / "plan.csv"
    csv_path.write_text(VALID_CSV, encoding="utf-8")

    result = import_training_plan_from_csv(
        csv_path=csv_path,
        user_email=user.email,
        plan_name="Base importada",
        dry_run=False,
        activate=True,
    )

    previous_plan.refresh_from_db()
    plan = TrainingPlan.objects.get(user=user, name="Base importada")

    assert result.is_valid
    assert plan.status == TrainingPlan.Status.ACTIVE
    assert plan.source_type == TrainingPlan.SourceType.SPREADSHEET_IMPORT
    assert previous_plan.status == TrainingPlan.Status.ARCHIVED
    assert plan.workouts.count() == 2
    assert Exercise.objects.filter(slug="supino-reto").exists()
    assert plan.workouts.get(sequence=1).exercise_prescriptions.count() == 2


@pytest.mark.django_db
def test_training_plan_import_reports_row_errors(django_user_model, tmp_path) -> None:
    user = django_user_model.objects.create_user("pessoa@example.com", "Senha-Forte-Forge-2026")
    csv_path = tmp_path / "plan.csv"
    csv_path.write_text(
        VALID_CSV.replace("weight_repetitions,4,8,10", "invalid_metric,0,12,10"),
        encoding="utf-8",
    )

    result = import_training_plan_from_csv(
        csv_path=csv_path,
        user_email=user.email,
        plan_name="Base importada",
    )

    assert not result.is_valid
    messages = [error.message for error in result.errors]
    assert "Métrica primária inválida: invalid_metric" in messages
    assert "target_sets deve ser maior que zero." in messages
    assert "A repetição mínima não pode ser maior que a máxima." in messages


@pytest.mark.django_db
def test_import_training_plan_command_requires_valid_csv(django_user_model, tmp_path) -> None:
    user = django_user_model.objects.create_user("pessoa@example.com", "Senha-Forte-Forge-2026")
    csv_path = tmp_path / "plan.csv"
    csv_path.write_text("workout_sequence,workout_name\n1,Treino A\n", encoding="utf-8")

    with pytest.raises(CommandError, match="Importação de plano inválida"):
        call_command(
            "import_training_plan",
            str(csv_path),
            email=user.email,
            plan_name="Base importada",
        )
