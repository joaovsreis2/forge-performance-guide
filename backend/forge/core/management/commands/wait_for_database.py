import time

from django.core.management.base import BaseCommand, CommandError, CommandParser
from django.db import OperationalError, connections


class Command(BaseCommand):
    help = "Aguarda o PostgreSQL aceitar conexões."

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument("--timeout", type=int, default=60)
        parser.add_argument("--interval", type=float, default=1.0)

    def handle(self, *args: object, **options: object) -> None:
        timeout = options["timeout"]
        interval = options["interval"]
        deadline = time.monotonic() + timeout
        database = connections["default"]

        while time.monotonic() < deadline:
            try:
                database.ensure_connection()
            except OperationalError:
                self.stdout.write("Aguardando PostgreSQL...")
                time.sleep(interval)
            else:
                self.stdout.write(self.style.SUCCESS("PostgreSQL disponível."))
                return

        raise CommandError(f"PostgreSQL não ficou disponível em {timeout} segundos.")
