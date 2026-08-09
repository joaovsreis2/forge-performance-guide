from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .forms import UserChangeForm, UserCreationForm
from .models import User, UserPreference, UserProfile


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    extra = 0
    readonly_fields = ("id", "created_at", "updated_at")


class UserPreferenceInline(admin.StackedInline):
    model = UserPreference
    can_delete = False
    extra = 0
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    add_form = UserCreationForm
    form = UserChangeForm
    model = User

    ordering = ("email",)
    list_display = ("email", "display_name", "is_staff", "is_active", "date_joined")
    list_filter = ("is_staff", "is_superuser", "is_active", "groups")
    search_fields = ("email", "display_name")
    readonly_fields = ("id", "date_joined", "created_at", "updated_at", "last_login")
    filter_horizontal = ("groups", "user_permissions")
    inlines = (UserProfileInline, UserPreferenceInline)

    fieldsets = (
        (None, {"fields": ("id", "email", "password")}),
        ("Identidade", {"fields": ("display_name",)}),
        (
            "Permissões",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Datas", {"fields": ("last_login", "date_joined", "created_at", "updated_at")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "display_name", "password1", "password2"),
            },
        ),
    )
