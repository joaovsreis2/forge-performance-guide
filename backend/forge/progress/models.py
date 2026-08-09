import uuid
from typing import ClassVar

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


class PersonalRecord(models.Model):
    class RecordType(models.TextChoices):
        MAXIMUM_WEIGHT = "maximum_weight", "Maior peso"
        MAXIMUM_REPETITIONS = "maximum_repetitions", "Mais repetições"
        MAXIMUM_DISTANCE = "maximum_distance", "Maior distância"
        LONGEST_DURATION = "longest_duration", "Maior duração"
        HIGHEST_VOLUME = "highest_volume", "Maior volume"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="personal_records",
    )
    exercise = models.ForeignKey(
        "training.Exercise",
        on_delete=models.PROTECT,
        related_name="personal_records",
    )
    completed_set = models.ForeignKey(
        "training.CompletedSet",
        on_delete=models.PROTECT,
        related_name="personal_records",
    )
    record_type = models.CharField(max_length=32, choices=RecordType.choices)
    value_numeric = models.DecimalField(max_digits=12, decimal_places=2)
    secondary_value_numeric = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        blank=True,
        null=True,
    )
    achieved_at = models.DateTimeField()
    calculation_version = models.CharField(max_length=32, default="v1")
    is_current = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "personal_records"
        ordering = ("-achieved_at",)
        constraints: ClassVar[list[models.BaseConstraint]] = [
            models.UniqueConstraint(
                fields=("user", "exercise", "record_type"),
                condition=models.Q(is_current=True),
                name="progress_one_current_record_per_type",
            ),
            models.CheckConstraint(
                condition=models.Q(value_numeric__gte=0),
                name="progress_personal_record_value_non_negative",
            ),
        ]
        indexes: ClassVar[list[models.Index]] = [
            models.Index(
                fields=("user", "exercise", "record_type", "is_current"),
                name="progress_record_lookup_idx",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.exercise.name} · {self.record_type}"


class DailyRecovery(models.Model):
    class SyncStatus(models.TextChoices):
        SYNCED = "synced", "Sincronizado"
        PENDING = "pending", "Pendente"
        SYNCING = "syncing", "Sincronizando"
        CONFLICT = "conflict", "Conflito"
        FAILED = "failed", "Falhou"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client_generated_id = models.UUIDField(default=uuid.uuid4)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="daily_recovery_records",
    )
    recovery_date = models.DateField()
    sleep_minutes = models.PositiveIntegerField(blank=True, null=True)
    hydration_ml = models.PositiveIntegerField(blank=True, null=True)
    cardio_completed = models.BooleanField(default=False)
    recovery_score = models.PositiveSmallIntegerField(blank=True, null=True)
    notes = models.TextField(blank=True)
    sync_status = models.CharField(
        max_length=16,
        choices=SyncStatus.choices,
        default=SyncStatus.SYNCED,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "daily_recovery"
        ordering = ("-recovery_date",)
        constraints: ClassVar[list[models.BaseConstraint]] = [
            models.UniqueConstraint(
                fields=("user", "recovery_date"),
                name="progress_daily_recovery_user_date_unique",
            ),
            models.UniqueConstraint(
                fields=("user", "client_generated_id"),
                name="progress_daily_recovery_client_id_unique",
            ),
            models.CheckConstraint(
                condition=models.Q(recovery_score__isnull=True)
                | models.Q(recovery_score__gte=0) & models.Q(recovery_score__lte=100),
                name="progress_daily_recovery_score_range",
            ),
        ]
        indexes: ClassVar[list[models.Index]] = [
            models.Index(fields=("user", "recovery_date"), name="prog_recovery_user_date_idx"),
        ]

    def __str__(self) -> str:
        return f"Recuperação {self.user.email} {self.recovery_date}"


class HabitDefinition(models.Model):
    class Frequency(models.TextChoices):
        DAILY = "daily", "Diária"
        WEEKLY = "weekly", "Semanal"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="habit_definitions",
    )
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    frequency = models.CharField(max_length=16, choices=Frequency.choices, default=Frequency.DAILY)
    target_value = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    unit = models.CharField(max_length=32, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    archived_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = "habit_definitions"
        ordering = ("name",)
        constraints: ClassVar[list[models.BaseConstraint]] = [
            models.CheckConstraint(
                condition=~models.Q(name=""),
                name="progress_habit_definition_name_not_empty",
            ),
            models.CheckConstraint(
                condition=models.Q(target_value__isnull=True) | models.Q(target_value__gte=0),
                name="progress_habit_target_non_negative",
            ),
        ]

    def __str__(self) -> str:
        return self.name


class HabitEntry(models.Model):
    class Status(models.TextChoices):
        COMPLETED = "completed", "Concluído"
        PARTIAL = "partial", "Parcial"
        MISSED = "missed", "Não feito"
        NOT_APPLICABLE = "not_applicable", "Não aplicável"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client_generated_id = models.UUIDField(default=uuid.uuid4)
    habit_definition = models.ForeignKey(
        HabitDefinition,
        on_delete=models.PROTECT,
        related_name="entries",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="habit_entries",
    )
    entry_date = models.DateField()
    status = models.CharField(max_length=24, choices=Status.choices)
    value_numeric = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    notes = models.TextField(blank=True)
    sync_status = models.CharField(
        max_length=16,
        choices=DailyRecovery.SyncStatus.choices,
        default=DailyRecovery.SyncStatus.SYNCED,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "habit_entries"
        ordering = ("-entry_date",)
        constraints: ClassVar[list[models.BaseConstraint]] = [
            models.UniqueConstraint(
                fields=("habit_definition", "entry_date"),
                name="progress_habit_entry_definition_date_unique",
            ),
            models.UniqueConstraint(
                fields=("user", "client_generated_id"),
                name="progress_habit_entry_client_id_unique",
            ),
        ]
        indexes: ClassVar[list[models.Index]] = [
            models.Index(fields=("user", "entry_date"), name="progress_habit_user_date_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.habit_definition.name} {self.entry_date}"


class BodyMeasurement(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client_generated_id = models.UUIDField(default=uuid.uuid4)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="body_measurements",
    )
    measurement_date = models.DateField()
    weight_kg = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)
    body_fat_percentage = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    chest_cm = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)
    waist_cm = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)
    hips_cm = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)
    left_arm_cm = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)
    right_arm_cm = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)
    left_thigh_cm = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)
    right_thigh_cm = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)
    notes = models.TextField(blank=True)
    sync_status = models.CharField(
        max_length=16,
        choices=DailyRecovery.SyncStatus.choices,
        default=DailyRecovery.SyncStatus.SYNCED,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "body_measurements"
        ordering = ("-measurement_date",)
        constraints: ClassVar[list[models.BaseConstraint]] = [
            models.UniqueConstraint(
                fields=("user", "measurement_date"),
                name="progress_body_measurement_user_date_unique",
            ),
            models.UniqueConstraint(
                fields=("user", "client_generated_id"),
                name="progress_body_measurement_client_id_unique",
            ),
            models.CheckConstraint(
                condition=models.Q(weight_kg__isnull=True) | models.Q(weight_kg__gte=0),
                name="progress_body_weight_non_negative",
            ),
            models.CheckConstraint(
                condition=models.Q(body_fat_percentage__isnull=True)
                | models.Q(body_fat_percentage__gte=0) & models.Q(body_fat_percentage__lte=100),
                name="progress_body_fat_range",
            ),
        ]
        indexes: ClassVar[list[models.Index]] = [
            models.Index(
                fields=("user", "measurement_date"),
                name="prog_measure_user_date_idx",
            ),
        ]

    def __str__(self) -> str:
        return f"Medição {self.user.email} {self.measurement_date}"

    def clean(self) -> None:
        super().clean()
        measured_values = (
            self.weight_kg,
            self.body_fat_percentage,
            self.chest_cm,
            self.waist_cm,
            self.hips_cm,
            self.left_arm_cm,
            self.right_arm_cm,
            self.left_thigh_cm,
            self.right_thigh_cm,
        )
        if all(value is None for value in measured_values):
            raise ValidationError("Informe pelo menos uma medida corporal.")


class ExperienceLedger(models.Model):
    class EventType(models.TextChoices):
        WORKOUT_COMPLETION = "workout_completion", "Treino concluído"
        EXERCISE_COMPLETION = "exercise_completion", "Exercício concluído"
        COMPLETED_SET = "completed_set", "Série concluída"
        PERSONAL_RECORD = "personal_record", "Recorde pessoal"
        RECOVERY_REGISTRATION = "recovery_registration", "Recuperação registrada"
        HABIT_COMPLETION = "habit_completion", "Hábito concluído"
        MEASUREMENT_SNAPSHOT = "measurement_snapshot", "Medição registrada"
        ADMIN_ADJUSTMENT = "admin_adjustment", "Ajuste administrativo"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="experience_ledger",
    )
    event_type = models.CharField(max_length=40, choices=EventType.choices)
    source_entity_type = models.CharField(max_length=80)
    source_entity_id = models.UUIDField()
    experience_delta = models.IntegerField()
    reason = models.CharField(max_length=255)
    calculation_version = models.CharField(max_length=32, default="xp_v1")
    occurred_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "experience_ledger"
        ordering = ("-occurred_at", "-created_at")
        constraints: ClassVar[list[models.BaseConstraint]] = [
            models.UniqueConstraint(
                fields=("user", "event_type", "source_entity_type", "source_entity_id"),
                name="progress_experience_source_unique",
            ),
            models.CheckConstraint(
                condition=~models.Q(reason=""),
                name="progress_experience_reason_not_empty",
            ),
        ]
        indexes: ClassVar[list[models.Index]] = [
            models.Index(fields=("user", "-occurred_at"), name="progress_xp_user_time_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.user.email} {self.experience_delta} XP"


class UserProgression(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="progression",
    )
    total_experience = models.PositiveIntegerField(default=0)
    current_level = models.PositiveIntegerField(default=1)
    performance_score = models.PositiveSmallIntegerField(default=0)
    consistency_score = models.PositiveSmallIntegerField(default=0)
    recovery_score = models.PositiveSmallIntegerField(default=0)
    calculation_version = models.CharField(max_length=32, default="level_v1")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "user_progression"
        constraints: ClassVar[list[models.BaseConstraint]] = [
            models.CheckConstraint(
                condition=models.Q(current_level__gte=1),
                name="progress_user_level_positive",
            ),
            models.CheckConstraint(
                condition=models.Q(performance_score__gte=0) & models.Q(performance_score__lte=100),
                name="progress_performance_score_range",
            ),
            models.CheckConstraint(
                condition=models.Q(consistency_score__gte=0) & models.Q(consistency_score__lte=100),
                name="progress_consistency_score_range",
            ),
            models.CheckConstraint(
                condition=models.Q(recovery_score__gte=0) & models.Q(recovery_score__lte=100),
                name="progress_recovery_score_range",
            ),
        ]

    def __str__(self) -> str:
        return f"Nível {self.current_level} · {self.user.email}"


class Achievement(models.Model):
    class Category(models.TextChoices):
        TRAINING = "training", "Treino"
        CONSISTENCY = "consistency", "Consistência"
        PROGRESS = "progress", "Progresso"
        RECOVERY = "recovery", "Recuperação"
        HISTORY = "history", "Histórico"
        RETURN = "return", "Retorno"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.SlugField(max_length=80, unique=True)
    name = models.CharField(max_length=120)
    description = models.CharField(max_length=255)
    category = models.CharField(max_length=24, choices=Category.choices)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "achievements"
        ordering = ("category", "name")

    def __str__(self) -> str:
        return self.name


class UserAchievement(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="achievements",
    )
    achievement = models.ForeignKey(
        Achievement,
        on_delete=models.PROTECT,
        related_name="earned_by",
    )
    source_entity_type = models.CharField(max_length=80)
    source_entity_id = models.UUIDField()
    earned_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "user_achievements"
        ordering = ("-earned_at",)
        constraints: ClassVar[list[models.BaseConstraint]] = [
            models.UniqueConstraint(
                fields=("user", "achievement"),
                name="progress_user_achievement_unique",
            ),
        ]
        indexes: ClassVar[list[models.Index]] = [
            models.Index(fields=("user", "-earned_at"), name="prog_achievement_user_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.user.email} · {self.achievement.name}"
