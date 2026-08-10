import csv
import re
import xml.etree.ElementTree as ElementTree
from dataclasses import dataclass, field
from decimal import Decimal, InvalidOperation
from pathlib import Path
from uuid import UUID
from zipfile import BadZipFile, ZipFile

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.utils import timezone
from django.utils.text import slugify

from .models import (
    CompletedSet,
    Exercise,
    PlanWorkout,
    SessionExercise,
    TrainingPlan,
    WorkoutExercise,
)

REQUIRED_IMPORT_COLUMNS = {
    "workout_sequence",
    "workout_name",
    "exercise_sequence",
    "exercise_name",
    "primary_metric",
    "target_sets",
}

XLSX_WORKOUT_SHEETS = {
    "Segunda": (1, PlanWorkout.Weekday.MONDAY),
    "Terça": (2, PlanWorkout.Weekday.TUESDAY),
    "Terca": (2, PlanWorkout.Weekday.TUESDAY),
    "Quinta": (3, PlanWorkout.Weekday.THURSDAY),
    "Sexta": (4, PlanWorkout.Weekday.FRIDAY),
}

SPREADSHEET_XML_NAMESPACE = {
    "main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "rel": "http://schemas.openxmlformats.org/package/2006/relationships",
}


@dataclass(frozen=True)
class TrainingPlanImportError:
    row_number: int
    message: str


@dataclass(frozen=True)
class TrainingPlanImportResult:
    plan_name: str
    user_email: str
    dry_run: bool
    rows_seen: int = 0
    workouts_seen: int = 0
    prescriptions_seen: int = 0
    errors: list[TrainingPlanImportError] = field(default_factory=list)

    @property
    def is_valid(self) -> bool:
        return not self.errors


@transaction.atomic
def activate_training_plan(plan: TrainingPlan) -> TrainingPlan:
    now = timezone.now()
    TrainingPlan.objects.filter(
        user=plan.user,
        status=TrainingPlan.Status.ACTIVE,
    ).exclude(pk=plan.pk).update(
        status=TrainingPlan.Status.ARCHIVED,
        archived_at=now,
        updated_at=now,
    )

    plan.status = TrainingPlan.Status.ACTIVE
    plan.activated_at = now
    plan.archived_at = None
    plan.save(update_fields=["status", "activated_at", "archived_at", "updated_at"])
    return plan


@transaction.atomic
def start_workout_session(
    *,
    user,
    plan_workout: PlanWorkout,
    client_generated_id: UUID | None = None,
    scheduled_for=None,
):
    from .models import WorkoutSession

    if plan_workout.training_plan.user_id != user.id:
        raise ValidationError("Este treino não pertence ao usuário autenticado.")

    if client_generated_id:
        existing_session = WorkoutSession.objects.filter(
            user=user,
            client_generated_id=client_generated_id,
        ).first()
        if existing_session:
            return existing_session

    if (
        WorkoutSession.objects.select_for_update()
        .filter(
            user=user,
            status__in=(WorkoutSession.Status.ACTIVE, WorkoutSession.Status.PAUSED),
        )
        .exists()
    ):
        raise ValidationError("Já existe um treino em andamento.")

    session_values = {
        "user": user,
        "training_plan": plan_workout.training_plan,
        "plan_workout": plan_workout,
        "scheduled_for": scheduled_for,
        "workout_name_snapshot": plan_workout.name,
        "workout_description_snapshot": plan_workout.description,
    }
    if client_generated_id:
        session_values["client_generated_id"] = client_generated_id

    session = WorkoutSession.objects.create(**session_values)
    prescriptions = plan_workout.exercise_prescriptions.select_related("exercise").order_by(
        "sequence"
    )
    for index, prescription in enumerate(prescriptions, start=1):
        status = SessionExercise.Status.ACTIVE if index == 1 else SessionExercise.Status.PENDING
        SessionExercise.objects.create(
            workout_session=session,
            source_workout_exercise=prescription,
            source_exercise=prescription.exercise,
            sequence=prescription.sequence,
            status=status,
            started_at=timezone.now() if status == SessionExercise.Status.ACTIVE else None,
            exercise_name_snapshot=prescription.exercise.name,
            exercise_instructions_snapshot=prescription.exercise.instructions,
            technical_notes_snapshot=prescription.technical_notes,
            primary_metric_snapshot=prescription.exercise.primary_metric,
            target_sets_snapshot=prescription.target_sets,
            target_repetitions_min_snapshot=prescription.target_repetitions_min,
            target_repetitions_max_snapshot=prescription.target_repetitions_max,
            target_weight_kg_snapshot=prescription.target_weight_kg,
            target_duration_seconds_snapshot=prescription.target_duration_seconds,
            target_distance_meters_snapshot=prescription.target_distance_meters,
            rest_seconds_snapshot=prescription.rest_seconds,
        )
    return session


@transaction.atomic
def record_completed_set(
    *,
    user,
    session_exercise: SessionExercise,
    set_number: int,
    client_generated_id: UUID | None = None,
    repetitions: int | None = None,
    weight_kg: Decimal | None = None,
    duration_seconds: int | None = None,
    distance_meters: int | None = None,
    status: str = CompletedSet.Status.COMPLETED,
) -> CompletedSet:
    from .models import WorkoutSession

    workout_session = session_exercise.workout_session
    if workout_session.user_id != user.id:
        raise ValidationError("Este treino não pertence ao usuário autenticado.")
    if workout_session.status != WorkoutSession.Status.ACTIVE:
        raise ValidationError("Séries só podem ser registradas em treinos ativos.")

    if client_generated_id:
        existing_set = CompletedSet.objects.filter(
            workout_session=workout_session,
            client_generated_id=client_generated_id,
        ).first()
        if existing_set:
            return existing_set

    completed_set_values = {
        "workout_session": workout_session,
        "session_exercise": session_exercise,
        "set_number": set_number,
        "status": status,
        "repetitions": repetitions,
        "weight_kg": weight_kg,
        "duration_seconds": duration_seconds,
        "distance_meters": distance_meters,
    }
    if client_generated_id:
        completed_set_values["client_generated_id"] = client_generated_id

    completed_set = CompletedSet(**completed_set_values)
    completed_set.full_clean()
    try:
        completed_set.save()
    except IntegrityError as error:
        raise ValidationError("Esta série já foi registrada.") from error

    _advance_session_exercise(session_exercise)
    return completed_set


def skip_completed_set(
    *,
    user,
    session_exercise: SessionExercise,
    set_number: int,
    client_generated_id: UUID | None = None,
) -> CompletedSet:
    return record_completed_set(
        user=user,
        session_exercise=session_exercise,
        set_number=set_number,
        client_generated_id=client_generated_id,
        status=CompletedSet.Status.SKIPPED,
    )


@transaction.atomic
def skip_session_exercise(*, user, session_exercise: SessionExercise) -> SessionExercise:
    from .models import WorkoutSession

    workout_session = session_exercise.workout_session
    if workout_session.user_id != user.id:
        raise ValidationError("Este treino não pertence ao usuário autenticado.")
    if workout_session.status != WorkoutSession.Status.ACTIVE:
        raise ValidationError("Exercícios só podem ser pulados em treinos ativos.")
    if session_exercise.status in (
        SessionExercise.Status.COMPLETED,
        SessionExercise.Status.SKIPPED,
    ):
        raise ValidationError("Este exercício já saiu do fluxo ativo.")

    now = timezone.now()
    session_exercise.status = SessionExercise.Status.SKIPPED
    session_exercise.skipped_at = now
    session_exercise.save(update_fields=["status", "skipped_at", "updated_at"])

    next_exercise = (
        workout_session.exercise_snapshots.filter(
            sequence__gt=session_exercise.sequence,
            status=SessionExercise.Status.PENDING,
        )
        .order_by("sequence")
        .first()
    )
    if next_exercise:
        next_exercise.status = SessionExercise.Status.ACTIVE
        next_exercise.started_at = now
        next_exercise.save(update_fields=["status", "started_at", "updated_at"])
    return session_exercise


@transaction.atomic
def pause_workout_session(*, user, session):
    from .models import WorkoutSession

    if session.user_id != user.id:
        raise ValidationError("Este treino não pertence ao usuário autenticado.")
    if session.status != WorkoutSession.Status.ACTIVE:
        raise ValidationError("Somente treinos ativos podem ser pausados.")
    session.status = WorkoutSession.Status.PAUSED
    session.paused_at = timezone.now()
    session.save(update_fields=["status", "paused_at", "updated_at"])
    return session


@transaction.atomic
def resume_workout_session(*, user, session):
    from .models import WorkoutSession

    if session.user_id != user.id:
        raise ValidationError("Este treino não pertence ao usuário autenticado.")
    if session.status != WorkoutSession.Status.PAUSED:
        raise ValidationError("Somente treinos pausados podem ser retomados.")
    session.status = WorkoutSession.Status.ACTIVE
    session.paused_at = None
    session.save(update_fields=["status", "paused_at", "updated_at"])
    return session


@transaction.atomic
def cancel_workout_session(*, user, session):
    from .models import WorkoutSession

    if session.user_id != user.id:
        raise ValidationError("Este treino não pertence ao usuário autenticado.")
    if session.is_terminal:
        raise ValidationError("Treinos concluídos ou cancelados não podem voltar ao fluxo ativo.")

    now = timezone.now()
    session.status = WorkoutSession.Status.CANCELLED
    session.cancelled_at = now
    session.duration_seconds = _duration_seconds(session.started_at, now)
    session.save(update_fields=["status", "cancelled_at", "duration_seconds", "updated_at"])
    return session


@transaction.atomic
def complete_workout_session(*, user, session):
    from .models import WorkoutSession

    if session.user_id != user.id:
        raise ValidationError("Este treino não pertence ao usuário autenticado.")
    if session.status not in (WorkoutSession.Status.ACTIVE, WorkoutSession.Status.PAUSED):
        raise ValidationError("Somente treinos em andamento podem ser concluídos.")
    if not session.completed_sets.filter(status=CompletedSet.Status.COMPLETED).exists():
        raise ValidationError("Registre pelo menos uma série antes de concluir o treino.")

    now = timezone.now()
    session.exercise_snapshots.filter(status=SessionExercise.Status.PENDING).update(
        status=SessionExercise.Status.SKIPPED,
        skipped_at=now,
        updated_at=now,
    )
    session.status = WorkoutSession.Status.COMPLETED
    session.completed_at = now
    session.duration_seconds = _duration_seconds(session.started_at, now)
    session.save(update_fields=["status", "completed_at", "duration_seconds", "updated_at"])

    from forge.progress.services import (
        award_personal_record_experience,
        award_workout_completion_experience,
        update_personal_records_for_completed_set,
    )

    personal_records = []
    for completed_set in session.completed_sets.filter(status=CompletedSet.Status.COMPLETED):
        personal_records.extend(update_personal_records_for_completed_set(completed_set))
    award_workout_completion_experience(session)
    award_personal_record_experience(personal_records)
    return session


def _advance_session_exercise(session_exercise: SessionExercise) -> None:
    now = timezone.now()
    recorded_count = session_exercise.completed_sets.count()
    if recorded_count >= session_exercise.target_sets_snapshot:
        session_exercise.status = SessionExercise.Status.COMPLETED
        session_exercise.completed_at = now
        session_exercise.save(update_fields=["status", "completed_at", "updated_at"])
        next_exercise = (
            session_exercise.workout_session.exercise_snapshots.filter(
                sequence__gt=session_exercise.sequence,
                status=SessionExercise.Status.PENDING,
            )
            .order_by("sequence")
            .first()
        )
        if next_exercise:
            next_exercise.status = SessionExercise.Status.ACTIVE
            next_exercise.started_at = now
            next_exercise.save(update_fields=["status", "started_at", "updated_at"])


def _duration_seconds(started_at, ended_at) -> int:
    return max(0, int((ended_at - started_at).total_seconds()))


def import_training_plan_from_csv(
    *,
    csv_path: Path,
    user_email: str,
    plan_name: str,
    dry_run: bool = True,
    activate: bool = False,
) -> TrainingPlanImportResult:
    rows, errors = _read_training_plan_file(csv_path)
    if errors:
        return TrainingPlanImportResult(
            plan_name=plan_name,
            user_email=user_email,
            dry_run=dry_run,
            rows_seen=len(rows),
            errors=errors,
        )

    user_model = get_user_model()
    user = user_model.objects.filter(email=user_model.objects.normalize_email(user_email)).first()
    if user is None:
        return TrainingPlanImportResult(
            plan_name=plan_name,
            user_email=user_email,
            dry_run=dry_run,
            rows_seen=len(rows),
            errors=[TrainingPlanImportError(0, f"Usuário não encontrado: {user_email}")],
        )

    normalized_rows, row_errors = _validate_import_rows(rows)
    result = TrainingPlanImportResult(
        plan_name=plan_name,
        user_email=user.email,
        dry_run=dry_run,
        rows_seen=len(rows),
        workouts_seen=len({row["workout_sequence"] for row in normalized_rows}),
        prescriptions_seen=len(normalized_rows),
        errors=row_errors,
    )
    if row_errors or dry_run:
        return result

    with transaction.atomic():
        plan = TrainingPlan.objects.create(
            user=user,
            name=plan_name,
            status=TrainingPlan.Status.DRAFT,
            source_type=TrainingPlan.SourceType.SPREADSHEET_IMPORT,
            source_reference=str(csv_path),
        )
        workouts: dict[int, PlanWorkout] = {}

        for row in normalized_rows:
            workout_sequence = row["workout_sequence"]
            workout = workouts.get(workout_sequence)
            if workout is None:
                workout = PlanWorkout.objects.create(
                    training_plan=plan,
                    name=row["workout_name"],
                    sequence=workout_sequence,
                    weekday=row["weekday"],
                    estimated_duration_minutes=row["estimated_duration_minutes"],
                )
                workouts[workout_sequence] = workout

            exercise, _ = Exercise.objects.update_or_create(
                slug=slugify(row["exercise_name"]),
                defaults={
                    "name": row["exercise_name"],
                    "primary_metric": row["primary_metric"],
                    "instructions": row["exercise_instructions"],
                    "default_rest_seconds": row["rest_seconds"] or 90,
                    "is_active": True,
                },
            )
            WorkoutExercise.objects.create(
                plan_workout=workout,
                exercise=exercise,
                sequence=row["exercise_sequence"],
                target_sets=row["target_sets"],
                target_repetitions_min=row["target_repetitions_min"],
                target_repetitions_max=row["target_repetitions_max"],
                target_weight_kg=row["target_weight_kg"],
                target_duration_seconds=row["target_duration_seconds"],
                target_distance_meters=row["target_distance_meters"],
                rest_seconds=row["rest_seconds"],
                technical_notes=row["technical_notes"],
            )

        if activate:
            activate_training_plan(plan)

    return result


def assign_default_training_plan(user) -> TrainingPlan | None:
    active_plan = TrainingPlan.objects.filter(
        user=user,
        status=TrainingPlan.Status.ACTIVE,
    ).first()
    if active_plan is not None:
        return active_plan

    plan_path = Path(settings.DEFAULT_TRAINING_PLAN_PATH)
    if not plan_path.exists():
        raise ValidationError(f"Plano base não encontrado: {plan_path}")

    result = import_training_plan_from_csv(
        csv_path=plan_path,
        user_email=user.email,
        plan_name=settings.DEFAULT_TRAINING_PLAN_NAME,
        dry_run=False,
        activate=True,
    )
    if not result.is_valid:
        messages = "; ".join(error.message for error in result.errors)
        raise ValidationError(f"Plano base inválido: {messages}")
    return TrainingPlan.objects.filter(
        user=user,
        status=TrainingPlan.Status.ACTIVE,
    ).first()


def _read_training_plan_file(
    plan_path: Path,
) -> tuple[list[dict[str, str]], list[TrainingPlanImportError]]:
    if not plan_path.exists():
        return [], [TrainingPlanImportError(0, f"Arquivo não encontrado: {plan_path}")]
    if plan_path.suffix.lower() == ".csv":
        return _read_training_plan_csv(plan_path)
    if plan_path.suffix.lower() == ".xlsx":
        return _read_training_plan_xlsx(plan_path)
    return [], [TrainingPlanImportError(0, "A importação aceita arquivos CSV ou XLSX.")]


def _read_training_plan_csv(
    csv_path: Path,
) -> tuple[list[dict[str, str]], list[TrainingPlanImportError]]:
    with csv_path.open(newline="", encoding="utf-8-sig") as csv_file:
        reader = csv.DictReader(csv_file)
        fieldnames = set(reader.fieldnames or [])
        missing_columns = sorted(REQUIRED_IMPORT_COLUMNS - fieldnames)
        if missing_columns:
            return [], [
                TrainingPlanImportError(
                    1,
                    "Colunas obrigatórias ausentes: " + ", ".join(missing_columns),
                )
            ]
        return list(reader), []


def _read_training_plan_xlsx(
    xlsx_path: Path,
) -> tuple[list[dict[str, str]], list[TrainingPlanImportError]]:
    try:
        sheets = _read_xlsx_sheets(xlsx_path)
    except (BadZipFile, ElementTree.ParseError, KeyError, ValueError) as error:
        return [], [TrainingPlanImportError(0, f"Planilha XLSX inválida: {error}")]

    rows = []
    errors = []
    for sheet_name, (workout_sequence, weekday) in XLSX_WORKOUT_SHEETS.items():
        sheet_rows = sheets.get(sheet_name)
        if sheet_rows is None:
            continue

        workout_name = _sheet_workout_name(sheet_rows, fallback=sheet_name)
        header_index = _find_workout_header_index(sheet_rows)
        if header_index is None:
            errors.append(
                TrainingPlanImportError(0, f"Aba {sheet_name}: cabeçalho do treino não encontrado.")
            )
            continue

        for row in sheet_rows[header_index + 1 :]:
            exercise_sequence = _cell_text(row, 0)
            exercise_name = _cell_text(row, 2)
            if not exercise_sequence and not exercise_name:
                continue
            if not exercise_sequence.isdigit():
                continue

            repetitions = _cell_text(row, 4)
            primary_metric = _infer_primary_metric(exercise_name, repetitions)
            reps_min, reps_max = _parse_repetition_range(repetitions)
            duration_seconds = _parse_duration_seconds(repetitions)
            if primary_metric != Exercise.PrimaryMetric.DURATION:
                duration_seconds = None
            else:
                reps_min = None
                reps_max = None

            rows.append(
                {
                    "workout_sequence": str(workout_sequence),
                    "workout_name": workout_name,
                    "weekday": str(int(weekday)),
                    "estimated_duration_minutes": "75",
                    "exercise_sequence": exercise_sequence,
                    "exercise_name": exercise_name,
                    "primary_metric": primary_metric,
                    "target_sets": _cell_text(row, 3),
                    "target_repetitions_min": str(reps_min or ""),
                    "target_repetitions_max": str(reps_max or ""),
                    "target_weight_kg": _cell_text(row, 6),
                    "target_duration_seconds": str(duration_seconds or ""),
                    "target_distance_meters": "",
                    "rest_seconds": str(_parse_duration_seconds(_cell_text(row, 5)) or ""),
                    "technical_notes": _technical_notes_from_xlsx_row(row),
                    "exercise_instructions": _cell_text(row, 7),
                }
            )

    if not rows and not errors:
        errors.append(TrainingPlanImportError(0, "Nenhum treino foi encontrado na planilha XLSX."))
    return rows, errors


def _validate_import_rows(
    rows: list[dict[str, str]],
) -> tuple[list[dict[str, object]], list[TrainingPlanImportError]]:
    normalized_rows = []
    errors = []
    seen_prescriptions: set[tuple[int, int]] = set()
    workout_names: dict[int, str] = {}
    metric_values = {choice.value for choice in Exercise.PrimaryMetric}
    weekday_values = {choice.value for choice in PlanWorkout.Weekday}

    for index, row in enumerate(rows, start=2):
        normalized = {
            "workout_sequence": _parse_positive_int(row, "workout_sequence", index, errors),
            "workout_name": _required_text(row, "workout_name", index, errors),
            "weekday": _parse_optional_int(row, "weekday", index, errors),
            "estimated_duration_minutes": _parse_optional_positive_int(
                row, "estimated_duration_minutes", index, errors
            ),
            "exercise_sequence": _parse_positive_int(row, "exercise_sequence", index, errors),
            "exercise_name": _required_text(row, "exercise_name", index, errors),
            "primary_metric": _required_text(row, "primary_metric", index, errors),
            "target_sets": _parse_positive_int(row, "target_sets", index, errors),
            "target_repetitions_min": _parse_optional_positive_int(
                row, "target_repetitions_min", index, errors
            ),
            "target_repetitions_max": _parse_optional_positive_int(
                row, "target_repetitions_max", index, errors
            ),
            "target_weight_kg": _parse_optional_decimal(row, "target_weight_kg", index, errors),
            "target_duration_seconds": _parse_optional_positive_int(
                row, "target_duration_seconds", index, errors
            ),
            "target_distance_meters": _parse_optional_positive_int(
                row, "target_distance_meters", index, errors
            ),
            "rest_seconds": _parse_optional_positive_int(row, "rest_seconds", index, errors),
            "technical_notes": row.get("technical_notes", "").strip(),
            "exercise_instructions": row.get("exercise_instructions", "").strip(),
        }

        workout_sequence = normalized["workout_sequence"]
        exercise_sequence = normalized["exercise_sequence"]
        workout_name = normalized["workout_name"]
        primary_metric = normalized["primary_metric"]
        reps_min = normalized["target_repetitions_min"]
        reps_max = normalized["target_repetitions_max"]

        if primary_metric and primary_metric not in metric_values:
            errors.append(
                TrainingPlanImportError(index, f"Métrica primária inválida: {primary_metric}")
            )
        if normalized["weekday"] is not None and normalized["weekday"] not in weekday_values:
            errors.append(TrainingPlanImportError(index, "Dia da semana deve estar entre 0 e 6."))
        if reps_min is not None and reps_max is not None and reps_min > reps_max:
            errors.append(
                TrainingPlanImportError(
                    index, "A repetição mínima não pode ser maior que a máxima."
                )
            )
        if workout_sequence and exercise_sequence:
            key = (workout_sequence, exercise_sequence)
            if key in seen_prescriptions:
                errors.append(
                    TrainingPlanImportError(
                        index,
                        "Sequência de exercício duplicada dentro do treino.",
                    )
                )
            seen_prescriptions.add(key)
        if workout_sequence and workout_name:
            previous_name = workout_names.setdefault(workout_sequence, workout_name)
            if previous_name != workout_name:
                errors.append(
                    TrainingPlanImportError(
                        index,
                        "O mesmo treino não pode ter nomes diferentes.",
                    )
                )

        normalized_rows.append(normalized)

    return normalized_rows, errors


def _required_text(
    row: dict[str, str],
    column: str,
    row_number: int,
    errors: list[TrainingPlanImportError],
) -> str:
    value = row.get(column, "").strip()
    if not value:
        errors.append(TrainingPlanImportError(row_number, f"{column} é obrigatório."))
    return value


def _parse_positive_int(
    row: dict[str, str],
    column: str,
    row_number: int,
    errors: list[TrainingPlanImportError],
) -> int | None:
    value = _required_text(row, column, row_number, errors)
    if not value:
        return None
    try:
        parsed = int(value)
    except ValueError:
        errors.append(TrainingPlanImportError(row_number, f"{column} deve ser um inteiro."))
        return None
    if parsed <= 0:
        errors.append(TrainingPlanImportError(row_number, f"{column} deve ser maior que zero."))
    return parsed


def _parse_optional_positive_int(
    row: dict[str, str],
    column: str,
    row_number: int,
    errors: list[TrainingPlanImportError],
) -> int | None:
    value = row.get(column, "").strip()
    if not value:
        return None
    try:
        parsed = int(value)
    except ValueError:
        errors.append(TrainingPlanImportError(row_number, f"{column} deve ser um inteiro."))
        return None
    if parsed <= 0:
        errors.append(TrainingPlanImportError(row_number, f"{column} deve ser maior que zero."))
    return parsed


def _parse_optional_int(
    row: dict[str, str],
    column: str,
    row_number: int,
    errors: list[TrainingPlanImportError],
) -> int | None:
    value = row.get(column, "").strip()
    if not value:
        return None
    try:
        return int(value)
    except ValueError:
        errors.append(TrainingPlanImportError(row_number, f"{column} deve ser um inteiro."))
        return None


def _parse_optional_decimal(
    row: dict[str, str],
    column: str,
    row_number: int,
    errors: list[TrainingPlanImportError],
) -> Decimal | None:
    value = row.get(column, "").strip().replace(",", ".")
    if not value:
        return None
    try:
        parsed = Decimal(value)
    except InvalidOperation:
        errors.append(TrainingPlanImportError(row_number, f"{column} deve ser decimal."))
        return None
    if parsed < 0:
        errors.append(TrainingPlanImportError(row_number, f"{column} não pode ser negativo."))
    return parsed


def _read_xlsx_sheets(xlsx_path: Path) -> dict[str, list[list[str]]]:
    with ZipFile(xlsx_path) as xlsx_file:
        shared_strings = _read_xlsx_shared_strings(xlsx_file)
        workbook = ElementTree.fromstring(xlsx_file.read("xl/workbook.xml"))
        relationships = ElementTree.fromstring(xlsx_file.read("xl/_rels/workbook.xml.rels"))
        relationship_targets = {
            relationship.attrib["Id"]: relationship.attrib["Target"]
            for relationship in relationships.findall("rel:Relationship", SPREADSHEET_XML_NAMESPACE)
        }

        sheets = {}
        for sheet in workbook.findall(
            "main:sheets/main:sheet",
            SPREADSHEET_XML_NAMESPACE,
        ):
            sheet_name = sheet.attrib["name"]
            relationship_id = sheet.attrib[
                "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"
            ]
            target = relationship_targets[relationship_id]
            if not target.startswith("xl/"):
                target = "xl/" + target.lstrip("/")
            sheets[sheet_name] = _read_xlsx_sheet_rows(xlsx_file, target, shared_strings)
        return sheets


def _read_xlsx_shared_strings(xlsx_file: ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in xlsx_file.namelist():
        return []

    root = ElementTree.fromstring(xlsx_file.read("xl/sharedStrings.xml"))
    shared_strings = []
    for shared_item in root.findall("main:si", SPREADSHEET_XML_NAMESPACE):
        text_parts = [
            text_node.text or ""
            for text_node in shared_item.findall(".//main:t", SPREADSHEET_XML_NAMESPACE)
        ]
        shared_strings.append("".join(text_parts))
    return shared_strings


def _read_xlsx_sheet_rows(
    xlsx_file: ZipFile,
    sheet_path: str,
    shared_strings: list[str],
) -> list[list[str]]:
    root = ElementTree.fromstring(xlsx_file.read(sheet_path))
    rows = []
    for row in root.findall("main:sheetData/main:row", SPREADSHEET_XML_NAMESPACE):
        values = []
        for cell in row.findall("main:c", SPREADSHEET_XML_NAMESPACE):
            column_index = _xlsx_column_index(cell.attrib.get("r", ""))
            while len(values) <= column_index:
                values.append("")
            values[column_index] = _xlsx_cell_text(cell, shared_strings)
        if any(value for value in values):
            rows.append(values)
    return rows


def _xlsx_cell_text(cell: ElementTree.Element, shared_strings: list[str]) -> str:
    inline_text = cell.find("main:is/main:t", SPREADSHEET_XML_NAMESPACE)
    if inline_text is not None:
        return (inline_text.text or "").strip()

    value_node = cell.find("main:v", SPREADSHEET_XML_NAMESPACE)
    if value_node is None:
        return ""

    raw_value = (value_node.text or "").strip()
    if cell.attrib.get("t") == "s":
        return shared_strings[int(raw_value)].strip()
    return raw_value


def _xlsx_column_index(cell_reference: str) -> int:
    letters = "".join(character for character in cell_reference if character.isalpha())
    column_number = 0
    for letter in letters:
        column_number = column_number * 26 + ord(letter.upper()) - 64
    return max(0, column_number - 1)


def _sheet_workout_name(rows: list[list[str]], *, fallback: str) -> str:
    if rows and rows[0] and rows[0][0].strip():
        return rows[0][0].strip().title()
    return fallback


def _find_workout_header_index(rows: list[list[str]]) -> int | None:
    for index, row in enumerate(rows):
        normalized = [_normalize_header(cell) for cell in row]
        if "exercicio" in normalized and "series" in normalized and "repeticoes" in normalized:
            return index
    return None


def _normalize_header(value: str) -> str:
    translation = str.maketrans("áàâãéêíóôõúçº", "aaaaeeiooouc_")
    return value.strip().lower().translate(translation)


def _cell_text(row: list[str], index: int) -> str:
    if index >= len(row):
        return ""
    return str(row[index] or "").strip()


def _infer_primary_metric(exercise_name: str, repetitions: str) -> str:
    text = f"{exercise_name} {repetitions}".lower()
    if "prancha" in text or re.search(r"\d+\s*-\s*\d+\s*s\b", text):
        return Exercise.PrimaryMetric.DURATION
    return Exercise.PrimaryMetric.WEIGHT_REPETITIONS


def _parse_repetition_range(repetitions: str) -> tuple[int | None, int | None]:
    numbers = [int(match) for match in re.findall(r"\d+", repetitions)]
    if not numbers:
        return None, None
    if "-" in repetitions and len(numbers) >= 2:
        return numbers[0], numbers[1]
    return numbers[0], numbers[0]


def _parse_duration_seconds(value: str) -> int | None:
    numbers = [int(match) for match in re.findall(r"\d+", value)]
    if not numbers:
        return None
    return max(numbers) if "-" in value else numbers[0]


def _technical_notes_from_xlsx_row(row: list[str]) -> str:
    muscle_group = _cell_text(row, 1)
    notes = _cell_text(row, 7)
    if muscle_group and notes:
        return f"Grupo muscular: {muscle_group}.\n{notes}"
    if muscle_group:
        return f"Grupo muscular: {muscle_group}."
    return notes
