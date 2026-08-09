from forge.training.models import CompletedSet, WorkoutSession

from .models import (
    BodyMeasurement,
    DailyRecovery,
    ExperienceLedger,
    HabitDefinition,
    HabitEntry,
    PersonalRecord,
    UserProgression,
)


def get_recent_workout_sessions_for_user(user, limit: int = 5):
    return WorkoutSession.objects.filter(user=user).order_by("-started_at")[:limit]


def get_current_personal_records_for_user(user, limit: int = 8):
    return (
        PersonalRecord.objects.filter(user=user, is_current=True)
        .select_related("exercise")
        .order_by("exercise__name", "record_type")[:limit]
    )


def get_daily_recovery_for_user(*, user, recovery_date):
    return DailyRecovery.objects.filter(user=user, recovery_date=recovery_date).first()


def get_latest_body_measurements_for_user(user, limit: int = 5):
    return BodyMeasurement.objects.filter(user=user).order_by("-measurement_date")[:limit]


def get_body_measurement_for_user(*, user, measurement_date):
    return BodyMeasurement.objects.filter(user=user, measurement_date=measurement_date).first()


def get_active_habits_for_user(user):
    return HabitDefinition.objects.filter(user=user, is_active=True).order_by("name")


def get_habit_for_user(*, user, habit_id):
    return HabitDefinition.objects.filter(user=user, id=habit_id).first()


def get_habit_entry_for_user(*, user, habit, entry_date):
    return HabitEntry.objects.filter(
        user=user,
        habit_definition=habit,
        entry_date=entry_date,
    ).first()


def get_user_progression(user):
    return UserProgression.objects.filter(user=user).first()


def get_recent_experience_events_for_user(user, limit: int = 6):
    return ExperienceLedger.objects.filter(user=user).order_by("-occurred_at", "-created_at")[
        :limit
    ]


def get_completed_weight_sets_for_user(user, limit: int = 200):
    return (
        CompletedSet.objects.filter(
            workout_session__user=user,
            status=CompletedSet.Status.COMPLETED,
            weight_kg__isnull=False,
            session_exercise__source_exercise__isnull=False,
        )
        .select_related("session_exercise__source_exercise")
        .order_by("-completed_at")[:limit]
    )


def get_user_achievements(user):
    return user.achievements.select_related("achievement").order_by("-earned_at")
