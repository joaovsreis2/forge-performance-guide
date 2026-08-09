from django.urls import path

from . import views

app_name = "progress"

urlpatterns = [
    path("progress/", views.overview, name="overview"),
    path("progress/recovery/", views.recovery, name="recovery"),
    path("progress/measurement/", views.measurement, name="measurement"),
    path("progress/habits/new/", views.habit_create, name="habit_create"),
    path("progress/habits/<uuid:habit_id>/entry/", views.habit_entry, name="habit_entry"),
]
