from typing import ClassVar

from django.contrib import admin

from .models import (
    CompletedSet,
    Exercise,
    PlanWorkout,
    SessionExercise,
    SessionNote,
    TrainingPlan,
    WorkoutExercise,
    WorkoutSession,
)


class WorkoutExerciseInline(admin.TabularInline):
    model = WorkoutExercise
    extra = 0
    ordering = ("sequence",)
    autocomplete_fields = ("exercise",)


class PlanWorkoutInline(admin.TabularInline):
    model = PlanWorkout
    extra = 0
    ordering = ("sequence",)


@admin.register(Exercise)
class ExerciseAdmin(admin.ModelAdmin):
    list_display = ("name", "primary_metric", "default_rest_seconds", "is_active")
    list_filter = ("primary_metric", "is_active")
    search_fields = ("name", "slug")
    prepopulated_fields: ClassVar[dict[str, tuple[str, ...]]] = {"slug": ("name",)}
    readonly_fields = ("id", "created_at", "updated_at", "archived_at")


@admin.register(TrainingPlan)
class TrainingPlanAdmin(admin.ModelAdmin):
    list_display = ("name", "user", "status", "source_type", "starts_on", "ends_on")
    list_filter = ("status", "source_type")
    search_fields = ("name", "user__email")
    autocomplete_fields = ("user",)
    readonly_fields = ("id", "created_at", "updated_at", "activated_at", "archived_at")
    inlines = (PlanWorkoutInline,)


@admin.register(PlanWorkout)
class PlanWorkoutAdmin(admin.ModelAdmin):
    list_display = ("name", "training_plan", "sequence", "weekday", "is_active")
    list_filter = ("is_active", "weekday")
    search_fields = ("name", "training_plan__name", "training_plan__user__email")
    autocomplete_fields = ("training_plan",)
    readonly_fields = ("id", "created_at", "updated_at")
    inlines = (WorkoutExerciseInline,)


@admin.register(WorkoutExercise)
class WorkoutExerciseAdmin(admin.ModelAdmin):
    list_display = ("plan_workout", "exercise", "sequence", "target_sets", "rest_seconds")
    search_fields = ("plan_workout__name", "exercise__name")
    autocomplete_fields = ("plan_workout", "exercise")
    readonly_fields = ("id", "created_at", "updated_at")


class SessionExerciseInline(admin.TabularInline):
    model = SessionExercise
    extra = 0
    ordering = ("sequence",)
    readonly_fields = (
        "id",
        "source_workout_exercise",
        "source_exercise",
        "exercise_name_snapshot",
        "primary_metric_snapshot",
        "created_at",
        "updated_at",
    )
    can_delete = False


class CompletedSetInline(admin.TabularInline):
    model = CompletedSet
    extra = 0
    ordering = ("set_number",)
    readonly_fields = ("id", "client_generated_id", "created_at", "updated_at")


@admin.register(WorkoutSession)
class WorkoutSessionAdmin(admin.ModelAdmin):
    list_display = ("workout_name_snapshot", "user", "status", "sync_status", "started_at")
    list_filter = ("status", "sync_status")
    search_fields = ("workout_name_snapshot", "user__email")
    autocomplete_fields = ("user", "training_plan", "plan_workout")
    readonly_fields = (
        "id",
        "client_generated_id",
        "created_at",
        "updated_at",
    )
    inlines = (SessionExerciseInline,)


@admin.register(SessionExercise)
class SessionExerciseAdmin(admin.ModelAdmin):
    list_display = ("exercise_name_snapshot", "workout_session", "sequence", "status")
    list_filter = ("status", "primary_metric_snapshot")
    search_fields = ("exercise_name_snapshot", "workout_session__workout_name_snapshot")
    autocomplete_fields = ("workout_session", "source_workout_exercise", "source_exercise")
    readonly_fields = ("id", "created_at", "updated_at")
    inlines = (CompletedSetInline,)


@admin.register(CompletedSet)
class CompletedSetAdmin(admin.ModelAdmin):
    list_display = ("session_exercise", "set_number", "status", "completed_at", "sync_status")
    list_filter = ("status", "sync_status")
    search_fields = (
        "session_exercise__exercise_name_snapshot",
        "workout_session__workout_name_snapshot",
        "workout_session__user__email",
    )
    autocomplete_fields = ("workout_session", "session_exercise")
    readonly_fields = ("id", "client_generated_id", "created_at", "updated_at")


@admin.register(SessionNote)
class SessionNoteAdmin(admin.ModelAdmin):
    list_display = ("workout_session", "session_exercise", "user", "created_at")
    search_fields = ("workout_session__workout_name_snapshot", "user__email")
    autocomplete_fields = ("workout_session", "session_exercise", "user")
    readonly_fields = ("id", "created_at", "updated_at")
