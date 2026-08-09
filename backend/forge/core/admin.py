from django.contrib import admin

from .models import SyncOperation


@admin.register(SyncOperation)
class SyncOperationAdmin(admin.ModelAdmin):
    list_display = (
        "entity_type",
        "operation_type",
        "user",
        "status",
        "attempt_count",
        "created_at",
    )
    list_filter = ("status", "operation_type", "entity_type")
    search_fields = ("user__email", "entity_type", "entity_client_id", "client_operation_id")
    autocomplete_fields = ("user",)
    readonly_fields = ("id", "created_at", "processed_at")
