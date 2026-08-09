from django.urls import path

from . import views

app_name = "training"

urlpatterns = [
    path("plan/", views.plan, name="plan"),
    path("plan/<uuid:plan_id>/", views.plan_detail, name="plan_detail"),
    path("workouts/<uuid:workout_id>/", views.workout_preview, name="workout_preview"),
    path("workouts/<uuid:workout_id>/start/", views.workout_start, name="workout_start"),
    path("sessions/<uuid:session_id>/", views.session_active, name="session_active"),
    path("sessions/<uuid:session_id>/skip-set/", views.session_skip_set, name="session_skip_set"),
    path(
        "sessions/<uuid:session_id>/skip-exercise/",
        views.session_skip_exercise,
        name="session_skip_exercise",
    ),
    path("sessions/<uuid:session_id>/pause/", views.session_pause, name="session_pause"),
    path("sessions/<uuid:session_id>/resume/", views.session_resume, name="session_resume"),
    path("sessions/<uuid:session_id>/cancel/", views.session_cancel, name="session_cancel"),
    path("sessions/<uuid:session_id>/complete/", views.session_complete, name="session_complete"),
    path("sessions/<uuid:session_id>/summary/", views.session_summary, name="session_summary"),
]
