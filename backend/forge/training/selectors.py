from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from django.db.models import Prefetch
from django.utils import timezone

from .models import PlanWorkout, TrainingPlan, WorkoutExercise, WorkoutSession


def get_active_training_plan_for_user(user) -> TrainingPlan | None:
    return (
        TrainingPlan.objects.filter(user=user, status=TrainingPlan.Status.ACTIVE)
        .prefetch_related(
            Prefetch(
                "workouts",
                queryset=PlanWorkout.objects.filter(is_active=True)
                .order_by("sequence")
                .prefetch_related(
                    Prefetch(
                        "exercise_prescriptions",
                        queryset=WorkoutExercise.objects.select_related("exercise").order_by(
                            "sequence"
                        ),
                    )
                ),
            )
        )
        .first()
    )


def get_training_plan_for_user(*, user, plan_id) -> TrainingPlan | None:
    return (
        TrainingPlan.objects.filter(user=user, id=plan_id)
        .prefetch_related(
            Prefetch(
                "workouts",
                queryset=PlanWorkout.objects.order_by("sequence").prefetch_related(
                    Prefetch(
                        "exercise_prescriptions",
                        queryset=WorkoutExercise.objects.select_related("exercise").order_by(
                            "sequence"
                        ),
                    )
                ),
            )
        )
        .first()
    )


def get_plan_workout_for_user(*, user, workout_id) -> PlanWorkout | None:
    return (
        PlanWorkout.objects.filter(id=workout_id, training_plan__user=user)
        .select_related("training_plan")
        .prefetch_related(
            Prefetch(
                "exercise_prescriptions",
                queryset=WorkoutExercise.objects.select_related("exercise").order_by("sequence"),
            )
        )
        .first()
    )


def get_open_workout_session_for_user(user) -> WorkoutSession | None:
    return (
        WorkoutSession.objects.filter(
            user=user,
            status__in=(WorkoutSession.Status.ACTIVE, WorkoutSession.Status.PAUSED),
        )
        .prefetch_related("exercise_snapshots__completed_sets")
        .first()
    )


def get_workout_session_for_user(*, user, session_id) -> WorkoutSession | None:
    return (
        WorkoutSession.objects.filter(user=user, id=session_id)
        .select_related("training_plan", "plan_workout")
        .prefetch_related("exercise_snapshots__completed_sets")
        .first()
    )


def get_todays_plan_workout_for_user(user) -> PlanWorkout | None:
    active_plan = get_active_training_plan_for_user(user)
    if active_plan is None:
        return None

    try:
        user_timezone = ZoneInfo(user.preferences.timezone)
    except ZoneInfoNotFoundError:
        user_timezone = timezone.get_default_timezone()

    today = timezone.localdate(value=timezone.now(), timezone=user_timezone)
    return next(
        (workout for workout in active_plan.workouts.all() if workout.weekday == today.weekday()),
        None,
    )
