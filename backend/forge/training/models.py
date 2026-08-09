import uuid
from typing import ClassVar

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class Exercise(models.Model):
    class PrimaryMetric(models.TextChoices):
        REPETITIONS = "repetitions", "Repetições"
        WEIGHT_REPETITIONS = "weight_repetitions", "Peso e repetições"
        DURATION = "duration", "Duração"
        DISTANCE = "distance", "Distância"
        DISTANCE_DURATION = "distance_duration", "Distância e duração"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=160)
    slug = models.SlugField(max_length=180, unique=True)
    description = models.TextField(blank=True)
    instructions = models.TextField(blank=True)
    primary_metric = models.CharField(max_length=32, choices=PrimaryMetric.choices)
    default_rest_seconds = models.PositiveIntegerField(default=90)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    archived_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = "exercises"
        ordering = ("name",)
        constraints: ClassVar[list[models.BaseConstraint]] = [
            models.CheckConstraint(
                condition=~models.Q(name=""),
                name="training_exercise_name_not_empty",
            ),
            models.CheckConstraint(
                condition=models.Q(default_rest_seconds__gte=0),
                name="training_exercise_default_rest_non_negative",
            ),
        ]

    def __str__(self) -> str:
        return self.name

    def archive(self) -> None:
        self.is_active = False
        self.archived_at = timezone.now()
        self.save(update_fields=["is_active", "archived_at", "updated_at"])


class TrainingPlan(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Rascunho"
        ACTIVE = "active", "Ativo"
        COMPLETED = "completed", "Concluído"
        ARCHIVED = "archived", "Arquivado"

    class SourceType(models.TextChoices):
        ADMIN = "admin", "Administração"
        SPREADSHEET_IMPORT = "spreadsheet_import", "Importação de planilha"
        SYSTEM = "system", "Sistema"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="training_plans",
    )
    name = models.CharField(max_length=160)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.DRAFT)
    source_type = models.CharField(
        max_length=32,
        choices=SourceType.choices,
        default=SourceType.ADMIN,
    )
    source_reference = models.CharField(max_length=255, blank=True)
    starts_on = models.DateField(blank=True, null=True)
    ends_on = models.DateField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    activated_at = models.DateTimeField(blank=True, null=True)
    archived_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = "training_plans"
        ordering = ("user", "name")
        constraints: ClassVar[list[models.BaseConstraint]] = [
            models.CheckConstraint(
                condition=~models.Q(name=""),
                name="training_plan_name_not_empty",
            ),
            models.CheckConstraint(
                condition=models.Q(ends_on__isnull=True)
                | models.Q(starts_on__isnull=True)
                | models.Q(ends_on__gte=models.F("starts_on")),
                name="training_plan_dates_ordered",
            ),
            models.UniqueConstraint(
                fields=("user",),
                condition=models.Q(status="active"),
                name="training_one_active_plan_per_user",
            ),
        ]
        indexes: ClassVar[list[models.Index]] = [
            models.Index(fields=("user", "status"), name="training_plan_user_status_idx"),
        ]

    def __str__(self) -> str:
        return self.name

    def activate(self) -> None:
        self.status = self.Status.ACTIVE
        self.activated_at = timezone.now()
        self.save(update_fields=["status", "activated_at", "updated_at"])

    def archive(self) -> None:
        self.status = self.Status.ARCHIVED
        self.archived_at = timezone.now()
        self.save(update_fields=["status", "archived_at", "updated_at"])


class PlanWorkout(models.Model):
    class Weekday(models.IntegerChoices):
        MONDAY = 0, "Segunda"
        TUESDAY = 1, "Terça"
        WEDNESDAY = 2, "Quarta"
        THURSDAY = 3, "Quinta"
        FRIDAY = 4, "Sexta"
        SATURDAY = 5, "Sábado"
        SUNDAY = 6, "Domingo"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    training_plan = models.ForeignKey(
        TrainingPlan,
        on_delete=models.CASCADE,
        related_name="workouts",
    )
    name = models.CharField(max_length=160)
    description = models.TextField(blank=True)
    sequence = models.PositiveIntegerField()
    weekday = models.PositiveSmallIntegerField(choices=Weekday.choices, blank=True, null=True)
    estimated_duration_minutes = models.PositiveIntegerField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "plan_workouts"
        ordering = ("training_plan", "sequence")
        constraints: ClassVar[list[models.BaseConstraint]] = [
            models.UniqueConstraint(
                fields=("training_plan", "sequence"),
                name="training_plan_workout_sequence_unique",
            ),
            models.CheckConstraint(
                condition=~models.Q(name=""),
                name="training_plan_workout_name_not_empty",
            ),
            models.CheckConstraint(
                condition=models.Q(sequence__gt=0),
                name="training_plan_workout_sequence_positive",
            ),
            models.CheckConstraint(
                condition=models.Q(estimated_duration_minutes__isnull=True)
                | models.Q(estimated_duration_minutes__gt=0),
                name="training_plan_workout_duration_positive",
            ),
        ]
        indexes: ClassVar[list[models.Index]] = [
            models.Index(
                fields=("training_plan", "sequence"),
                name="trn_workout_plan_seq_idx",
            ),
        ]

    def __str__(self) -> str:
        return self.name


class WorkoutExercise(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    plan_workout = models.ForeignKey(
        PlanWorkout,
        on_delete=models.CASCADE,
        related_name="exercise_prescriptions",
    )
    exercise = models.ForeignKey(
        Exercise,
        on_delete=models.PROTECT,
        related_name="workout_prescriptions",
    )
    sequence = models.PositiveIntegerField()
    target_sets = models.PositiveIntegerField()
    target_repetitions_min = models.PositiveIntegerField(blank=True, null=True)
    target_repetitions_max = models.PositiveIntegerField(blank=True, null=True)
    target_weight_kg = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)
    target_duration_seconds = models.PositiveIntegerField(blank=True, null=True)
    target_distance_meters = models.PositiveIntegerField(blank=True, null=True)
    rest_seconds = models.PositiveIntegerField(blank=True, null=True)
    technical_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "workout_exercises"
        ordering = ("plan_workout", "sequence")
        constraints: ClassVar[list[models.BaseConstraint]] = [
            models.UniqueConstraint(
                fields=("plan_workout", "sequence"),
                name="training_workout_exercise_sequence_unique",
            ),
            models.CheckConstraint(
                condition=models.Q(sequence__gt=0),
                name="training_workout_exercise_sequence_positive",
            ),
            models.CheckConstraint(
                condition=models.Q(target_sets__gt=0),
                name="training_workout_exercise_sets_positive",
            ),
            models.CheckConstraint(
                condition=models.Q(target_repetitions_min__isnull=True)
                | models.Q(target_repetitions_max__isnull=True)
                | models.Q(target_repetitions_max__gte=models.F("target_repetitions_min")),
                name="training_workout_exercise_reps_ordered",
            ),
            models.CheckConstraint(
                condition=models.Q(target_weight_kg__isnull=True)
                | models.Q(target_weight_kg__gte=0),
                name="training_workout_exercise_weight_non_negative",
            ),
        ]
        indexes: ClassVar[list[models.Index]] = [
            models.Index(
                fields=("plan_workout", "sequence"),
                name="trn_exercise_workout_seq_idx",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.plan_workout.name} — {self.exercise.name}"

    def clean(self) -> None:
        super().clean()
        if (
            self.target_repetitions_min is not None
            and self.target_repetitions_max is not None
            and self.target_repetitions_min > self.target_repetitions_max
        ):
            raise ValidationError(
                {"target_repetitions_max": "A repetição máxima não pode ser menor que a mínima."}
            )


class WorkoutSession(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Ativo"
        PAUSED = "paused", "Pausado"
        COMPLETED = "completed", "Concluído"
        CANCELLED = "cancelled", "Cancelado"

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
        related_name="workout_sessions",
    )
    training_plan = models.ForeignKey(
        TrainingPlan,
        on_delete=models.SET_NULL,
        related_name="workout_sessions",
        blank=True,
        null=True,
    )
    plan_workout = models.ForeignKey(
        PlanWorkout,
        on_delete=models.SET_NULL,
        related_name="workout_sessions",
        blank=True,
        null=True,
    )
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE)
    scheduled_for = models.DateField(blank=True, null=True)
    started_at = models.DateTimeField(default=timezone.now)
    paused_at = models.DateTimeField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    cancelled_at = models.DateTimeField(blank=True, null=True)
    duration_seconds = models.PositiveIntegerField(blank=True, null=True)
    workout_name_snapshot = models.CharField(max_length=160)
    workout_description_snapshot = models.TextField(blank=True)
    source_revision = models.CharField(max_length=64, blank=True)
    sync_status = models.CharField(
        max_length=16,
        choices=SyncStatus.choices,
        default=SyncStatus.SYNCED,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "workout_sessions"
        ordering = ("-started_at",)
        constraints: ClassVar[list[models.BaseConstraint]] = [
            models.UniqueConstraint(
                fields=("user",),
                condition=models.Q(status__in=("active", "paused")),
                name="training_one_open_workout_session_per_user",
            ),
            models.UniqueConstraint(
                fields=("user", "client_generated_id"),
                name="training_workout_session_client_id_unique",
            ),
            models.CheckConstraint(
                condition=models.Q(duration_seconds__isnull=True)
                | models.Q(duration_seconds__gte=0),
                name="training_workout_session_duration_non_negative",
            ),
            models.CheckConstraint(
                condition=~models.Q(status="completed") | models.Q(completed_at__isnull=False),
                name="training_workout_session_completed_at_required",
            ),
            models.CheckConstraint(
                condition=~models.Q(status="cancelled") | models.Q(cancelled_at__isnull=False),
                name="training_workout_session_cancelled_at_required",
            ),
        ]
        indexes: ClassVar[list[models.Index]] = [
            models.Index(fields=("user", "status"), name="trn_session_user_status_idx"),
            models.Index(fields=("user", "-started_at"), name="trn_session_user_start_idx"),
            models.Index(fields=("user", "-completed_at"), name="trn_session_user_done_idx"),
        ]

    def __str__(self) -> str:
        return self.workout_name_snapshot

    @property
    def is_open(self) -> bool:
        return self.status in {self.Status.ACTIVE, self.Status.PAUSED}

    @property
    def is_terminal(self) -> bool:
        return self.status in {self.Status.COMPLETED, self.Status.CANCELLED}


class SessionExercise(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pendente"
        ACTIVE = "active", "Ativo"
        COMPLETED = "completed", "Concluído"
        SKIPPED = "skipped", "Pulado"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workout_session = models.ForeignKey(
        WorkoutSession,
        on_delete=models.CASCADE,
        related_name="exercise_snapshots",
    )
    source_workout_exercise = models.ForeignKey(
        WorkoutExercise,
        on_delete=models.SET_NULL,
        related_name="session_snapshots",
        blank=True,
        null=True,
    )
    source_exercise = models.ForeignKey(
        Exercise,
        on_delete=models.SET_NULL,
        related_name="session_snapshots",
        blank=True,
        null=True,
    )
    sequence = models.PositiveIntegerField()
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING)
    exercise_name_snapshot = models.CharField(max_length=160)
    exercise_instructions_snapshot = models.TextField(blank=True)
    technical_notes_snapshot = models.TextField(blank=True)
    primary_metric_snapshot = models.CharField(
        max_length=32,
        choices=Exercise.PrimaryMetric.choices,
    )
    target_sets_snapshot = models.PositiveIntegerField()
    target_repetitions_min_snapshot = models.PositiveIntegerField(blank=True, null=True)
    target_repetitions_max_snapshot = models.PositiveIntegerField(blank=True, null=True)
    target_weight_kg_snapshot = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        blank=True,
        null=True,
    )
    target_duration_seconds_snapshot = models.PositiveIntegerField(blank=True, null=True)
    target_distance_meters_snapshot = models.PositiveIntegerField(blank=True, null=True)
    rest_seconds_snapshot = models.PositiveIntegerField(blank=True, null=True)
    started_at = models.DateTimeField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    skipped_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "session_exercises"
        ordering = ("workout_session", "sequence")
        constraints: ClassVar[list[models.BaseConstraint]] = [
            models.UniqueConstraint(
                fields=("workout_session", "sequence"),
                name="training_session_exercise_sequence_unique",
            ),
            models.CheckConstraint(
                condition=models.Q(sequence__gt=0),
                name="training_session_exercise_sequence_positive",
            ),
            models.CheckConstraint(
                condition=models.Q(target_sets_snapshot__gt=0),
                name="training_session_exercise_sets_positive",
            ),
        ]
        indexes: ClassVar[list[models.Index]] = [
            models.Index(
                fields=("workout_session", "sequence"),
                name="trn_session_exercise_seq_idx",
            ),
        ]

    def __str__(self) -> str:
        return self.exercise_name_snapshot


class CompletedSet(models.Model):
    class Status(models.TextChoices):
        COMPLETED = "completed", "Concluído"
        SKIPPED = "skipped", "Pulado"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client_generated_id = models.UUIDField(default=uuid.uuid4)
    workout_session = models.ForeignKey(
        WorkoutSession,
        on_delete=models.CASCADE,
        related_name="completed_sets",
    )
    session_exercise = models.ForeignKey(
        SessionExercise,
        on_delete=models.CASCADE,
        related_name="completed_sets",
    )
    set_number = models.PositiveIntegerField()
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.COMPLETED)
    repetitions = models.PositiveIntegerField(blank=True, null=True)
    weight_kg = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)
    duration_seconds = models.PositiveIntegerField(blank=True, null=True)
    distance_meters = models.PositiveIntegerField(blank=True, null=True)
    perceived_effort = models.PositiveSmallIntegerField(blank=True, null=True)
    completed_at = models.DateTimeField(default=timezone.now)
    sync_status = models.CharField(
        max_length=16,
        choices=WorkoutSession.SyncStatus.choices,
        default=WorkoutSession.SyncStatus.SYNCED,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "completed_sets"
        ordering = ("session_exercise", "set_number")
        constraints: ClassVar[list[models.BaseConstraint]] = [
            models.UniqueConstraint(
                fields=("workout_session", "client_generated_id"),
                name="training_completed_set_client_id_unique",
            ),
            models.UniqueConstraint(
                fields=("session_exercise", "set_number"),
                name="training_completed_set_number_unique",
            ),
            models.CheckConstraint(
                condition=models.Q(set_number__gt=0),
                name="training_completed_set_number_positive",
            ),
            models.CheckConstraint(
                condition=models.Q(status="skipped")
                | models.Q(repetitions__isnull=False)
                | models.Q(weight_kg__isnull=False)
                | models.Q(duration_seconds__isnull=False)
                | models.Q(distance_meters__isnull=False),
                name="training_completed_set_meaningful_data",
            ),
            models.CheckConstraint(
                condition=models.Q(weight_kg__isnull=True) | models.Q(weight_kg__gte=0),
                name="training_completed_set_weight_non_negative",
            ),
            models.CheckConstraint(
                condition=models.Q(perceived_effort__isnull=True)
                | models.Q(perceived_effort__gte=1) & models.Q(perceived_effort__lte=10),
                name="training_completed_set_effort_range",
            ),
        ]
        indexes: ClassVar[list[models.Index]] = [
            models.Index(
                fields=("workout_session", "completed_at"),
                name="trn_set_session_time_idx",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.session_exercise.exercise_name_snapshot} · série {self.set_number}"

    def clean(self) -> None:
        super().clean()
        if self.status != self.Status.COMPLETED:
            return
        if not any(
            value is not None
            for value in (
                self.repetitions,
                self.weight_kg,
                self.duration_seconds,
                self.distance_meters,
            )
        ):
            raise ValidationError("Uma série concluída precisa ter ao menos um dado de execução.")


class SessionNote(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workout_session = models.ForeignKey(
        WorkoutSession,
        on_delete=models.CASCADE,
        related_name="notes",
    )
    session_exercise = models.ForeignKey(
        SessionExercise,
        on_delete=models.CASCADE,
        related_name="notes",
        blank=True,
        null=True,
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="session_notes",
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "session_notes"
        ordering = ("created_at",)
        constraints: ClassVar[list[models.BaseConstraint]] = [
            models.CheckConstraint(
                condition=~models.Q(content=""),
                name="training_session_note_content_not_empty",
            ),
        ]

    def __str__(self) -> str:
        return f"Nota de {self.user.email}"
