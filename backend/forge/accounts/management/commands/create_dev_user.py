from django.core.management.base import BaseCommand, CommandError, CommandParser
from django.db import transaction

from forge.accounts.models import User, UserProfile


class Command(BaseCommand):
    help = "Cria ou atualiza uma conta local de desenvolvimento."

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument("--email", required=True)
        parser.add_argument("--password", required=True)
        parser.add_argument("--name", default="Pessoa Forge")
        parser.add_argument(
            "--complete-onboarding",
            action="store_true",
            help="Marca o onboarding como completo para entrar direto no Today.",
        )

    @transaction.atomic
    def handle(self, *args: object, **options: object) -> None:
        email = str(options["email"])
        password = str(options["password"])
        name = str(options["name"])
        complete_onboarding = bool(options["complete_onboarding"])

        if len(password) < 12:
            raise CommandError("Use uma senha de desenvolvimento com pelo menos 12 caracteres.")

        user, created = User.objects.get_or_create(
            email=User.objects.normalize_email(email),
            defaults={"display_name": name},
        )
        user.display_name = name
        user.set_password(password)
        user.save(update_fields=["display_name", "password", "updated_at"])

        if complete_onboarding:
            user.profile.onboarding_status = UserProfile.OnboardingStatus.COMPLETED
            user.profile.save(update_fields=["onboarding_status", "updated_at"])

        action = "criada" if created else "atualizada"
        self.stdout.write(self.style.SUCCESS(f"Conta de desenvolvimento {action}: {user.email}"))
