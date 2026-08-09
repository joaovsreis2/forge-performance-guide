import uuid
from typing import ClassVar

from django.conf import settings
from django.db import models


class SyncOperation(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pendente"
        PROCESSING = "processing", "Processando"
        COMPLETED = "completed", "Concluída"
        CONFLICT = "conflict", "Conflito"
        FAILED = "failed", "Falhou"

    class OperationType(models.TextChoices):
        CREATE = "create", "Criar"
        UPDATE = "update", "Atualizar"
        COMPLETE = "complete", "Concluir"
        CANCEL = "cancel", "Cancelar"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client_operation_id = models.UUIDField()
    client_instance_id = models.CharField(max_length=120, blank=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sync_operations",
    )
    entity_type = models.CharField(max_length=80)
    entity_client_id = models.CharField(max_length=120)
    operation_type = models.CharField(max_length=16, choices=OperationType.choices)
    payload_hash = models.CharField(max_length=128)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING)
    attempt_count = models.PositiveIntegerField(default=0)
    last_error_code = models.CharField(max_length=80, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = "sync_operations"
        ordering = ("-created_at",)
        constraints: ClassVar[list[models.BaseConstraint]] = [
            models.UniqueConstraint(
                fields=("user", "client_operation_id"),
                name="core_sync_operation_user_client_id_unique",
            ),
            models.CheckConstraint(
                condition=~models.Q(entity_type=""),
                name="core_sync_operation_entity_type_not_empty",
            ),
            models.CheckConstraint(
                condition=~models.Q(entity_client_id=""),
                name="core_sync_operation_entity_client_id_not_empty",
            ),
            models.CheckConstraint(
                condition=~models.Q(payload_hash=""),
                name="core_sync_operation_payload_hash_not_empty",
            ),
        ]
        indexes: ClassVar[list[models.Index]] = [
            models.Index(fields=("user", "client_operation_id"), name="core_sync_user_client_idx"),
            models.Index(fields=("status", "created_at"), name="core_sync_status_created_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.operation_type} {self.entity_type}"
