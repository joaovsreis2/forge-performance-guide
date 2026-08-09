from django.contrib import admin

from .models import (
    Achievement,
    BodyMeasurement,
    DailyRecovery,
    ExperienceLedger,
    HabitDefinition,
    HabitEntry,
    PersonalRecord,
    UserAchievement,
    UserProgression,
)


@admin.register(PersonalRecord)
class PersonalRecordAdmin(admin.ModelAdmin):
    list_display = ("exercise", "user", "record_type", "value_numeric", "achieved_at", "is_current")
    list_filter = ("record_type", "is_current")
    search_fields = ("user__email", "exercise__name")
    autocomplete_fields = ("user", "exercise", "completed_set")
    readonly_fields = ("id", "created_at")


@admin.register(DailyRecovery)
class DailyRecoveryAdmin(admin.ModelAdmin):
    list_display = ("user", "recovery_date", "sleep_minutes", "hydration_ml", "cardio_completed")
    list_filter = ("cardio_completed", "sync_status")
    search_fields = ("user__email",)
    autocomplete_fields = ("user",)
    readonly_fields = ("id", "client_generated_id", "created_at", "updated_at")


@admin.register(HabitDefinition)
class HabitDefinitionAdmin(admin.ModelAdmin):
    list_display = ("name", "user", "frequency", "is_active")
    list_filter = ("frequency", "is_active")
    search_fields = ("name", "user__email")
    autocomplete_fields = ("user",)
    readonly_fields = ("id", "created_at", "updated_at", "archived_at")


@admin.register(HabitEntry)
class HabitEntryAdmin(admin.ModelAdmin):
    list_display = ("habit_definition", "user", "entry_date", "status")
    list_filter = ("status", "sync_status")
    search_fields = ("habit_definition__name", "user__email")
    autocomplete_fields = ("habit_definition", "user")
    readonly_fields = ("id", "client_generated_id", "created_at", "updated_at")


@admin.register(BodyMeasurement)
class BodyMeasurementAdmin(admin.ModelAdmin):
    list_display = ("user", "measurement_date", "weight_kg", "body_fat_percentage")
    list_filter = ("sync_status",)
    search_fields = ("user__email",)
    autocomplete_fields = ("user",)
    readonly_fields = ("id", "client_generated_id", "created_at", "updated_at")


@admin.register(ExperienceLedger)
class ExperienceLedgerAdmin(admin.ModelAdmin):
    list_display = ("user", "event_type", "experience_delta", "reason", "occurred_at")
    list_filter = ("event_type", "calculation_version")
    search_fields = ("user__email", "reason", "source_entity_type")
    autocomplete_fields = ("user",)
    readonly_fields = ("id", "created_at")


@admin.register(UserProgression)
class UserProgressionAdmin(admin.ModelAdmin):
    list_display = ("user", "total_experience", "current_level", "updated_at")
    search_fields = ("user__email",)
    autocomplete_fields = ("user",)
    readonly_fields = ("id", "updated_at")


@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "category", "is_active")
    list_filter = ("category", "is_active")
    search_fields = ("name", "code")
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(UserAchievement)
class UserAchievementAdmin(admin.ModelAdmin):
    list_display = ("user", "achievement", "earned_at")
    search_fields = ("user__email", "achievement__name")
    autocomplete_fields = ("user", "achievement")
    readonly_fields = ("id", "created_at")
