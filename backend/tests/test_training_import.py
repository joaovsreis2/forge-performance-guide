from zipfile import ZIP_DEFLATED, ZipFile

import pytest
from django.core.management import call_command
from django.core.management.base import CommandError

from forge.training.models import Exercise, PlanWorkout, TrainingPlan, WorkoutExercise
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


@pytest.mark.django_db
def test_training_plan_import_accepts_structured_xlsx(django_user_model, tmp_path) -> None:
    user = django_user_model.objects.create_user("pessoa@example.com", "Senha-Forte-Forge-2026")
    xlsx_path = tmp_path / "paulo.xlsx"
    _write_minimal_training_xlsx(xlsx_path)

    result = import_training_plan_from_csv(
        csv_path=xlsx_path,
        user_email=user.email,
        plan_name="Plano Paulo",
        dry_run=False,
        activate=True,
    )

    plan = TrainingPlan.objects.get(user=user, name="Plano Paulo")
    workout = plan.workouts.get(sequence=1)
    duration_exercise = WorkoutExercise.objects.get(
        plan_workout__training_plan=plan,
        exercise__name="Prancha isométrica",
    )

    assert result.is_valid
    assert result.workouts_seen == 1
    assert result.prescriptions_seen == 2
    assert plan.status == TrainingPlan.Status.ACTIVE
    assert workout.weekday == PlanWorkout.Weekday.MONDAY
    assert workout.exercise_prescriptions.count() == 2
    assert duration_exercise.exercise.primary_metric == Exercise.PrimaryMetric.DURATION
    assert duration_exercise.target_duration_seconds == 60
    assert "Grupo muscular: Abdômen." in duration_exercise.technical_notes


def _write_minimal_training_xlsx(path) -> None:
    sheet_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    <row r="1">
      <c r="A1" t="inlineStr"><is><t>SEGUNDA — SUPERIOR A — Ênfase Peito</t></is></c>
    </row>
    <row r="2">
      <c r="A2" t="inlineStr"><is><t>Nº</t></is></c>
      <c r="B2" t="inlineStr"><is><t>Grupo Muscular</t></is></c>
      <c r="C2" t="inlineStr"><is><t>Exercício</t></is></c>
      <c r="D2" t="inlineStr"><is><t>Séries</t></is></c>
      <c r="E2" t="inlineStr"><is><t>Repetições</t></is></c>
      <c r="F2" t="inlineStr"><is><t>Descanso</t></is></c>
      <c r="G2" t="inlineStr"><is><t>Carga (kg)</t></is></c>
      <c r="H2" t="inlineStr"><is><t>Observações Técnicas</t></is></c>
    </row>
    <row r="3">
      <c r="A3" t="inlineStr"><is><t>1</t></is></c>
      <c r="B3" t="inlineStr"><is><t>Peito</t></is></c>
      <c r="C3" t="inlineStr"><is><t>Supino máquina</t></is></c>
      <c r="D3" t="inlineStr"><is><t>3</t></is></c>
      <c r="E3" t="inlineStr"><is><t>10-12</t></is></c>
      <c r="F3" t="inlineStr"><is><t>90s</t></is></c>
      <c r="H3" t="inlineStr"><is><t>Controle a descida.</t></is></c>
    </row>
    <row r="4">
      <c r="A4" t="inlineStr"><is><t>2</t></is></c>
      <c r="B4" t="inlineStr"><is><t>Abdômen</t></is></c>
      <c r="C4" t="inlineStr"><is><t>Prancha isométrica</t></is></c>
      <c r="D4" t="inlineStr"><is><t>3</t></is></c>
      <c r="E4" t="inlineStr"><is><t>40-60s</t></is></c>
      <c r="F4" t="inlineStr"><is><t>45s</t></is></c>
      <c r="H4" t="inlineStr"><is><t>Manter postura alinhada.</t></is></c>
    </row>
  </sheetData>
</worksheet>
"""
    with ZipFile(path, "w", ZIP_DEFLATED) as xlsx:
        xlsx.writestr(
            "[Content_Types].xml",
            """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml"
    ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml"
    ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>
""",
        )
        xlsx.writestr(
            "_rels/.rels",
            """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1"
    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"
    Target="xl/workbook.xml"/>
</Relationships>
""",
        )
        xlsx.writestr(
            "xl/workbook.xml",
            """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Segunda" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>
""",
        )
        xlsx.writestr(
            "xl/_rels/workbook.xml.rels",
            """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1"
    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet"
    Target="worksheets/sheet1.xml"/>
</Relationships>
""",
        )
        xlsx.writestr("xl/worksheets/sheet1.xml", sheet_xml)
