from django.urls import path

from . import views

app_name = "core"

urlpatterns = [
    path("", views.home, name="home"),
    path("health/", views.health, name="health"),
    path("offline/", views.offline, name="offline"),
    path("service-worker.js", views.service_worker, name="service_worker"),
]
