import uuid
from typing import Any, ClassVar
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models.functions import Lower
from django.utils import timezone

from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    display_name = models.CharField(max_length=150, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    EMAIL_FIELD = "email"
    REQUIRED_FIELDS: ClassVar[list[str]] = []

    class Meta:
        db_table = "users"
        ordering = ("email",)
        constraints: ClassVar[list[models.BaseConstraint]] = [
            models.UniqueConstraint(Lower("email"), name="accounts_user_email_ci_unique"),
        ]

    def clean(self) -> None:
        super().clean()
        self.email = type(self).objects.normalize_email(self.email)

    def save(self, *args: Any, **kwargs: Any) -> None:
        self.email = type(self).objects.normalize_email(self.email)
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.email


class UserProfile(models.Model):
    class TrainingGoal(models.TextChoices):
        STRENGTH = "strength", "Força"
        HYPERTROPHY = "hypertrophy", "Hipertrofia"
        ENDURANCE = "endurance", "Resistência"
        GENERAL_FITNESS = "general_fitness", "Condicionamento geral"

    class OnboardingStatus(models.TextChoices):
        PROFILE = "profile", "Perfil"
        TRAINING_GOAL = "training_goal", "Objetivo"
        PHYSICAL_INFO = "physical_info", "Informações físicas"
        PLAN_SETUP = "plan_setup", "Configuração do plano"
        COMPLETED = "completed", "Completo"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    birth_date = models.DateField(blank=True, null=True)
    height_cm = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    current_weight_kg = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)
    training_goal = models.CharField(
        max_length=32,
        choices=TrainingGoal.choices,
        blank=True,
    )
    onboarding_status = models.CharField(
        max_length=32,
        choices=OnboardingStatus.choices,
        default=OnboardingStatus.PROFILE,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "user_profiles"
        constraints: ClassVar[list[models.BaseConstraint]] = [
            models.CheckConstraint(
                condition=models.Q(height_cm__isnull=True) | models.Q(height_cm__gt=0),
                name="accounts_userprofile_height_positive",
            ),
            models.CheckConstraint(
                condition=models.Q(current_weight_kg__isnull=True)
                | models.Q(current_weight_kg__gt=0),
                name="accounts_userprofile_weight_positive",
            ),
        ]

    def __str__(self) -> str:
        return f"Perfil de {self.user.email}"


class UserPreference(models.Model):
    class WeightUnit(models.TextChoices):
        KILOGRAM = "kg", "Quilogramas"
        POUND = "lb", "Libras"

    class DistanceUnit(models.TextChoices):
        METER = "m", "Metros"
        KILOMETER = "km", "Quilômetros"
        MILE = "mi", "Milhas"

    class Appearance(models.TextChoices):
        SYSTEM = "system", "Sistema"
        LIGHT = "light", "Claro"
        DARK = "dark", "Escuro"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="preferences")
    timezone = models.CharField(max_length=64, default="America/Sao_Paulo")
    weight_unit = models.CharField(
        max_length=8,
        choices=WeightUnit.choices,
        default=WeightUnit.KILOGRAM,
    )
    distance_unit = models.CharField(
        max_length=8,
        choices=DistanceUnit.choices,
        default=DistanceUnit.METER,
    )
    appearance = models.CharField(
        max_length=16,
        choices=Appearance.choices,
        default=Appearance.SYSTEM,
    )
    rest_timer_sound_enabled = models.BooleanField(default=True)
    rest_timer_vibration_enabled = models.BooleanField(default=True)
    workout_reminders_enabled = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "user_preferences"

    def __str__(self) -> str:
        return f"Preferências de {self.user.email}"

    def clean(self) -> None:
        super().clean()
        try:
            ZoneInfo(self.timezone)
        except ZoneInfoNotFoundError as error:
            raise ValidationError({"timezone": "Informe um fuso horário IANA válido."}) from error
