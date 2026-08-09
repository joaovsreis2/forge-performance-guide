import hashlib

from django.utils import timezone

from .models import SyncOperation


def payload_hash(payload: dict[str, object]) -> str:
    normalized = "|".join(f"{key}={payload[key]}" for key in sorted(payload))
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def record_completed_sync_operation(
    *,
    user,
    client_operation_id,
    entity_type: str,
    entity_client_id: str,
    operation_type: str,
    payload: dict[str, object],
) -> SyncOperation:
    operation, created = SyncOperation.objects.get_or_create(
        user=user,
        client_operation_id=client_operation_id,
        defaults={
            "entity_type": entity_type,
            "entity_client_id": entity_client_id,
            "operation_type": operation_type,
            "payload_hash": payload_hash(payload),
            "status": SyncOperation.Status.COMPLETED,
            "attempt_count": 1,
            "processed_at": timezone.now(),
        },
    )
    if not created and operation.status != SyncOperation.Status.COMPLETED:
        operation.status = SyncOperation.Status.COMPLETED
        operation.attempt_count += 1
        operation.processed_at = timezone.now()
        operation.save(update_fields=["status", "attempt_count", "processed_at"])
    return operation
