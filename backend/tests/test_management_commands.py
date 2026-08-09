from unittest.mock import Mock, patch

import pytest
from django.core.management import call_command
from django.core.management.base import CommandError
from django.db import OperationalError


@pytest.mark.django_db
def test_wait_for_database_succeeds() -> None:
    call_command("wait_for_database", timeout=1, interval=0)


def test_wait_for_database_has_bounded_failure() -> None:
    database = Mock()
    database.ensure_connection.side_effect = OperationalError

    with (
        patch(
            "forge.core.management.commands.wait_for_database.connections",
            {"default": database},
        ),
        patch(
            "forge.core.management.commands.wait_for_database.time.monotonic",
            side_effect=[0, 0, 2],
        ),
        patch("forge.core.management.commands.wait_for_database.time.sleep"),
        pytest.raises(CommandError, match="não ficou disponível"),
    ):
        call_command("wait_for_database", timeout=1, interval=0)
