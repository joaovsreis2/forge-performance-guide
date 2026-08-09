from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("forge.api.urls")),
    path("accounts/", include("forge.accounts.urls")),
    path("", include("forge.training.urls")),
    path("", include("forge.progress.urls")),
    path("", include("forge.core.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
