from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError, CommandParser
from django.db import transaction
from django.utils.text import slugify

from forge.training.models import Exercise, PlanWorkout, TrainingPlan, WorkoutExercise
from forge.training.services import activate_training_plan


class Command(BaseCommand):
    help = "Cria um plano de treino demo para um usuário existente."

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument("--email", required=True)

    @transaction.atomic
    def handle(self, *args: object, **options: object) -> None:
        email = str(options["email"])
        user_model = get_user_model()
        try:
            user = user_model.objects.get(email=user_model.objects.normalize_email(email))
        except user_model.DoesNotExist as error:
            raise CommandError(f"Usuário não encontrado: {email}") from error

        exercises = self.create_exercises()
        plan, _ = TrainingPlan.objects.get_or_create(
            user=user,
            name="Forge Demo — Base de Força",
            defaults={
                "description": "Plano demonstrativo para validar a definição de treino.",
                "source_type": TrainingPlan.SourceType.SYSTEM,
            },
        )
        plan.description = "Plano demonstrativo para validar a definição de treino."
        plan.source_type = TrainingPlan.SourceType.SYSTEM
        plan.source_reference = "seed_demo_plan"
        plan.save(update_fields=["description", "source_type", "source_reference", "updated_at"])

        upper = self.upsert_workout(plan, "Treino A — Superior", 1, PlanWorkout.Weekday.MONDAY)
        lower = self.upsert_workout(plan, "Treino B — Inferior", 2, PlanWorkout.Weekday.THURSDAY)

        self.upsert_prescription(upper, exercises["supino-reto"], 1, 4, 6, 8, Decimal("60.00"), 120)
        self.upsert_prescription(
            upper, exercises["remada-curvada"], 2, 4, 8, 10, Decimal("50.00"), 120
        )
        self.upsert_prescription(
            upper, exercises["desenvolvimento"], 3, 3, 8, 10, Decimal("30.00"), 90
        )
        self.upsert_prescription(lower, exercises["agachamento"], 1, 4, 6, 8, Decimal("80.00"), 150)
        self.upsert_prescription(
            lower, exercises["levantamento-terra"], 2, 3, 5, 5, Decimal("100.00"), 180
        )
        self.upsert_prescription(lower, exercises["prancha"], 3, 3, None, None, None, 60, 45)

        activate_training_plan(plan)

        self.stdout.write(self.style.SUCCESS(f"Plano demo ativo para {user.email}: {plan.name}"))

    def create_exercises(self) -> dict[str, Exercise]:
        definitions = [
            ("Supino reto", Exercise.PrimaryMetric.WEIGHT_REPETITIONS, 120),
            ("Remada curvada", Exercise.PrimaryMetric.WEIGHT_REPETITIONS, 120),
            ("Desenvolvimento", Exercise.PrimaryMetric.WEIGHT_REPETITIONS, 90),
            ("Agachamento", Exercise.PrimaryMetric.WEIGHT_REPETITIONS, 150),
            ("Levantamento terra", Exercise.PrimaryMetric.WEIGHT_REPETITIONS, 180),
            ("Prancha", Exercise.PrimaryMetric.DURATION, 60),
        ]
        exercises = {}
        for name, metric, rest_seconds in definitions:
            exercise, _ = Exercise.objects.update_or_create(
                slug=slugify(name),
                defaults={
                    "name": name,
                    "primary_metric": metric,
                    "default_rest_seconds": rest_seconds,
                    "is_active": True,
                },
            )
            exercises[exercise.slug] = exercise
        return exercises

    def upsert_workout(
        self,
        plan: TrainingPlan,
        name: str,
        sequence: int,
        weekday: PlanWorkout.Weekday,
    ) -> PlanWorkout:
        workout, _ = PlanWorkout.objects.update_or_create(
            training_plan=plan,
            sequence=sequence,
            defaults={
                "name": name,
                "weekday": weekday,
                "estimated_duration_minutes": 55,
                "is_active": True,
            },
        )
        return workout

    def upsert_prescription(
        self,
        workout: PlanWorkout,
        exercise: Exercise,
        sequence: int,
        sets: int,
        reps_min: int | None,
        reps_max: int | None,
        weight: Decimal | None,
        rest_seconds: int,
        duration_seconds: int | None = None,
    ) -> WorkoutExercise:
        prescription, _ = WorkoutExercise.objects.update_or_create(
            plan_workout=workout,
            sequence=sequence,
            defaults={
                "exercise": exercise,
                "target_sets": sets,
                "target_repetitions_min": reps_min,
                "target_repetitions_max": reps_max,
                "target_weight_kg": weight,
                "target_duration_seconds": duration_seconds,
                "rest_seconds": rest_seconds,
            },
        )
        return prescription
