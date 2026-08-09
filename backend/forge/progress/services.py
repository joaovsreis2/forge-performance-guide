from datetime import datetime, time
from decimal import Decimal

from django.db import models, transaction
from django.utils import timezone

from forge.training.models import CompletedSet

from .models import (
    BodyMeasurement,
    DailyRecovery,
    ExperienceLedger,
    HabitEntry,
    PersonalRecord,
    UserProgression,
)

WORKOUT_COMPLETION_XP = 100
EXERCISE_COMPLETION_XP = 5
COMPLETED_SET_XP = 2
SET_REWARD_CAP = 20
PERSONAL_RECORD_XP = 25
RECOVERY_REGISTRATION_XP = 5
HABIT_COMPLETION_XP = 3
HABIT_DAILY_CAP = 15
MEASUREMENT_SNAPSHOT_XP = 10


@transaction.atomic
def update_personal_records_for_completed_set(completed_set: CompletedSet) -> list[PersonalRecord]:
    if completed_set.status != CompletedSet.Status.COMPLETED:
        return []

    session_exercise = completed_set.session_exercise
    if session_exercise.source_exercise is None:
        return []

    user = completed_set.workout_session.user
    exercise = session_exercise.source_exercise
    candidates = _record_candidates(completed_set)
    created_records = []

    for record_type, value, secondary_value in candidates:
        current = PersonalRecord.objects.filter(
            user=user,
            exercise=exercise,
            record_type=record_type,
            is_current=True,
        ).first()
        if current and current.value_numeric >= value:
            continue
        if current:
            current.is_current = False
            current.save(update_fields=["is_current"])
        created_records.append(
            PersonalRecord.objects.create(
                user=user,
                exercise=exercise,
                completed_set=completed_set,
                record_type=record_type,
                value_numeric=value,
                secondary_value_numeric=secondary_value,
                achieved_at=completed_set.completed_at,
            )
        )

    return created_records


@transaction.atomic
def award_workout_completion_experience(session) -> list[ExperienceLedger]:
    if session.status != "completed":
        return []
    awarded = [
        award_experience_once(
            user=session.user,
            event_type=ExperienceLedger.EventType.WORKOUT_COMPLETION,
            source=session,
            experience_delta=WORKOUT_COMPLETION_XP,
            reason="Treino concluído com dados válidos.",
            occurred_at=session.completed_at,
        )
    ]
    completed_exercises = session.exercise_snapshots.filter(status="completed")
    for exercise in completed_exercises:
        awarded.append(
            award_experience_once(
                user=session.user,
                event_type=ExperienceLedger.EventType.EXERCISE_COMPLETION,
                source=exercise,
                experience_delta=EXERCISE_COMPLETION_XP,
                reason="Exercício concluído dentro de um treino finalizado.",
                occurred_at=exercise.completed_at or session.completed_at,
            )
        )
    completed_sets = session.completed_sets.filter(status=CompletedSet.Status.COMPLETED).order_by(
        "completed_at"
    )[:SET_REWARD_CAP]
    for completed_set in completed_sets:
        awarded.append(
            award_experience_once(
                user=session.user,
                event_type=ExperienceLedger.EventType.COMPLETED_SET,
                source=completed_set,
                experience_delta=COMPLETED_SET_XP,
                reason="Série concluída com dados de execução.",
                occurred_at=completed_set.completed_at,
            )
        )
    return awarded


def award_personal_record_experience(records: list[PersonalRecord]) -> list[ExperienceLedger]:
    return [
        award_experience_once(
            user=record.user,
            event_type=ExperienceLedger.EventType.PERSONAL_RECORD,
            source=record,
            experience_delta=PERSONAL_RECORD_XP,
            reason="Novo recorde pessoal validado.",
            occurred_at=record.achieved_at,
        )
        for record in records
    ]


def award_recovery_experience(recovery: DailyRecovery) -> ExperienceLedger | None:
    if not any([recovery.sleep_minutes, recovery.hydration_ml, recovery.cardio_completed]):
        return None
    return award_experience_once(
        user=recovery.user,
        event_type=ExperienceLedger.EventType.RECOVERY_REGISTRATION,
        source=recovery,
        experience_delta=RECOVERY_REGISTRATION_XP,
        reason="Recuperação diária registrada.",
        occurred_at=timezone.now(),
    )


def award_habit_experience(entry: HabitEntry) -> ExperienceLedger | None:
    if entry.status != HabitEntry.Status.COMPLETED or not entry.habit_definition.is_active:
        return None
    awarded_today = (
        ExperienceLedger.objects.filter(
            user=entry.user,
            event_type=ExperienceLedger.EventType.HABIT_COMPLETION,
            occurred_at__date=entry.entry_date,
        ).aggregate(total=models.Sum("experience_delta"))["total"]
        or 0
    )
    remaining = max(0, HABIT_DAILY_CAP - awarded_today)
    if remaining <= 0:
        return None
    occurred_at = timezone.make_aware(
        datetime.combine(entry.entry_date, time(hour=12)),
        timezone.get_current_timezone(),
    )
    return award_experience_once(
        user=entry.user,
        event_type=ExperienceLedger.EventType.HABIT_COMPLETION,
        source=entry,
        experience_delta=min(HABIT_COMPLETION_XP, remaining),
        reason="Hábito concluído.",
        occurred_at=occurred_at,
    )


def award_measurement_experience(measurement: BodyMeasurement) -> ExperienceLedger:
    return award_experience_once(
        user=measurement.user,
        event_type=ExperienceLedger.EventType.MEASUREMENT_SNAPSHOT,
        source=measurement,
        experience_delta=MEASUREMENT_SNAPSHOT_XP,
        reason="Snapshot corporal registrado.",
        occurred_at=timezone.now(),
    )


def award_experience_once(
    *,
    user,
    event_type: str,
    source,
    experience_delta: int,
    reason: str,
    occurred_at,
) -> ExperienceLedger:
    ledger, created = ExperienceLedger.objects.get_or_create(
        user=user,
        event_type=event_type,
        source_entity_type=source.__class__.__name__,
        source_entity_id=source.id,
        defaults={
            "experience_delta": experience_delta,
            "reason": reason,
            "occurred_at": occurred_at or timezone.now(),
        },
    )
    if created:
        refresh_user_progression(user)
    return ledger


def refresh_user_progression(user) -> UserProgression:
    total_experience = (
        ExperienceLedger.objects.filter(user=user).aggregate(total=models.Sum("experience_delta"))[
            "total"
        ]
        or 0
    )
    progression, _ = UserProgression.objects.get_or_create(user=user)
    progression.total_experience = max(0, total_experience)
    progression.current_level = level_for_experience(progression.total_experience)
    progression.performance_score = min(
        100,
        PersonalRecord.objects.filter(user=user, is_current=True).count() * 10,
    )
    progression.consistency_score = min(
        100,
        ExperienceLedger.objects.filter(
            user=user,
            event_type=ExperienceLedger.EventType.WORKOUT_COMPLETION,
        ).count()
        * 10,
    )
    progression.recovery_score = min(
        100,
        ExperienceLedger.objects.filter(
            user=user,
            event_type=ExperienceLedger.EventType.RECOVERY_REGISTRATION,
        ).count()
        * 10,
    )
    progression.save(
        update_fields=[
            "total_experience",
            "current_level",
            "performance_score",
            "consistency_score",
            "recovery_score",
            "updated_at",
        ]
    )
    return progression


def level_for_experience(total_experience: int) -> int:
    level = 1
    while 100 * (level + 1) * level <= total_experience:
        level += 1
    return level


def _record_candidates(completed_set: CompletedSet) -> list[tuple[str, Decimal, Decimal | None]]:
    candidates = []
    if completed_set.weight_kg is not None:
        candidates.append(
            (
                PersonalRecord.RecordType.MAXIMUM_WEIGHT,
                completed_set.weight_kg,
                Decimal(completed_set.repetitions)
                if completed_set.repetitions is not None
                else None,
            )
        )
    if completed_set.repetitions is not None:
        candidates.append(
            (
                PersonalRecord.RecordType.MAXIMUM_REPETITIONS,
                Decimal(completed_set.repetitions),
                completed_set.weight_kg,
            )
        )
    if completed_set.duration_seconds is not None:
        candidates.append(
            (
                PersonalRecord.RecordType.LONGEST_DURATION,
                Decimal(completed_set.duration_seconds),
                None,
            )
        )
    if completed_set.distance_meters is not None:
        candidates.append(
            (
                PersonalRecord.RecordType.MAXIMUM_DISTANCE,
                Decimal(completed_set.distance_meters),
                None,
            )
        )
    if completed_set.weight_kg is not None and completed_set.repetitions is not None:
        candidates.append(
            (
                PersonalRecord.RecordType.HIGHEST_VOLUME,
                completed_set.weight_kg * Decimal(completed_set.repetitions),
                completed_set.weight_kg,
            )
        )
    return candidates
