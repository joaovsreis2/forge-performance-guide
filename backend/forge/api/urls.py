from django.urls import path

from . import views

app_name = "api"

urlpatterns = [
    path("csrf/", views.csrf, name="csrf"),
    path("auth/login/", views.login_api, name="login"),
    path("auth/register/", views.register_api, name="register"),
    path("auth/password/recover/", views.recover_password, name="recover_password"),
    path(
        "auth/password/reset/<uidb64>/<token>/",
        views.reset_password,
        name="reset_password",
    ),
    path("auth/logout/", views.logout_api, name="logout"),
    path("me/", views.me, name="me"),
    path("account/", views.account, name="account"),
    path("account/password/", views.change_password, name="change_password"),
    path("account/delete/", views.delete_account, name="delete_account"),
    path("onboarding/", views.onboarding, name="onboarding"),
    path("plan/", views.plan, name="plan"),
    path("progress/", views.progress, name="progress"),
    path("recovery/", views.recovery, name="recovery"),
    path("measurements/", views.measurements, name="measurements"),
    path("workouts/<uuid:workout_id>/start/", views.start_workout, name="start_workout"),
    path("sessions/<uuid:session_id>/", views.session, name="session"),
    path("sessions/<uuid:session_id>/sets/", views.record_set, name="record_set"),
    path("sessions/<uuid:session_id>/skip-set/", views.skip_set, name="skip_set"),
    path("sessions/<uuid:session_id>/skip-exercise/", views.skip_exercise, name="skip_exercise"),
    path("sessions/<uuid:session_id>/pause/", views.pause_session, name="pause_session"),
    path("sessions/<uuid:session_id>/resume/", views.resume_session, name="resume_session"),
    path("sessions/<uuid:session_id>/complete/", views.complete_session, name="complete_session"),
    path("sessions/<uuid:session_id>/cancel/", views.cancel_session, name="cancel_session"),
]
