from pathlib import Path

from django.core.management.base import BaseCommand, CommandError, CommandParser

from forge.training.services import import_training_plan_from_csv


class Command(BaseCommand):
    help = "Importa um plano de treino a partir de um CSV administrativo validado."

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument("csv_path")
        parser.add_argument("--email", required=True)
        parser.add_argument("--plan-name", required=True)
        parser.add_argument(
            "--commit",
            action="store_true",
            help="Persiste o plano. Sem esta flag, roda somente a validação.",
        )
        parser.add_argument(
            "--activate",
            action="store_true",
            help="Ativa o plano importado e arquiva o plano ativo anterior do usuário.",
        )

    def handle(self, *args: object, **options: object) -> None:
        result = import_training_plan_from_csv(
            csv_path=Path(str(options["csv_path"])),
            user_email=str(options["email"]),
            plan_name=str(options["plan_name"]),
            dry_run=not bool(options["commit"]),
            activate=bool(options["activate"]),
        )

        if not result.is_valid:
            for error in result.errors:
                location = f"linha {error.row_number}" if error.row_number else "arquivo"
                self.stderr.write(f"{location}: {error.message}")
            raise CommandError("Importação de plano inválida.")

        mode = "validado" if result.dry_run else "importado"
        self.stdout.write(
            self.style.SUCCESS(
                f"Plano {mode}: {result.plan_name} "
                f"({result.workouts_seen} treinos, {result.prescriptions_seen} exercícios)."
            )
        )
        if result.dry_run:
            self.stdout.write("Use --commit para persistir este plano.")
