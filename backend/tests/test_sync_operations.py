from uuid import uuid4

import pytest
from django.db import IntegrityError, transaction

from forge.core.models import SyncOperation


@pytest.mark.django_db
def test_sync_operation_client_operation_is_unique_per_user(django_user_model) -> None:
    user = django_user_model.objects.create_user("pessoa@example.com", "Senha-Forte-Forge-2026")
    client_operation_id = uuid4()
    SyncOperation.objects.create(
        user=user,
        client_operation_id=client_operation_id,
        entity_type="completed_set",
        entity_client_id=str(uuid4()),
        operation_type=SyncOperation.OperationType.CREATE,
        payload_hash="hash",
    )

    with pytest.raises(IntegrityError), transaction.atomic():
        SyncOperation.objects.create(
            user=user,
            client_operation_id=client_operation_id,
            entity_type="completed_set",
            entity_client_id=str(uuid4()),
            operation_type=SyncOperation.OperationType.CREATE,
            payload_hash="hash",
        )


@pytest.mark.django_db
def test_sync_operation_client_operation_can_repeat_for_different_users(
    django_user_model,
) -> None:
    first_user = django_user_model.objects.create_user(
        "primeira@example.com",
        "Senha-Forte-Forge-2026",
    )
    second_user = django_user_model.objects.create_user(
        "segunda@example.com",
        "Senha-Forte-Forge-2026",
    )
    client_operation_id = uuid4()

    for user in (first_user, second_user):
        SyncOperation.objects.create(
            user=user,
            client_operation_id=client_operation_id,
            entity_type="completed_set",
            entity_client_id=str(uuid4()),
            operation_type=SyncOperation.OperationType.CREATE,
            payload_hash="hash",
        )

    assert SyncOperation.objects.count() == 2
