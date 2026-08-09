from django.urls import path

from . import views

app_name = "accounts"

urlpatterns = [
    path("", views.account, name="account"),
    path("register/", views.register, name="register"),
    path("signin/", views.SignInView.as_view(), name="signin"),
    path("logout/", views.SignOutView.as_view(), name="logout"),
    path("password/recover/", views.RecoverPasswordView.as_view(), name="password_reset"),
    path(
        "password/recover/sent/",
        views.RecoverPasswordDoneView.as_view(),
        name="password_reset_done",
    ),
    path(
        "password/reset/<uidb64>/<token>/",
        views.RecoverPasswordConfirmView.as_view(),
        name="password_reset_confirm",
    ),
    path(
        "password/reset/complete/",
        views.RecoverPasswordCompleteView.as_view(),
        name="password_reset_complete",
    ),
    path("onboarding/", views.onboarding, name="onboarding"),
    path("onboarding/profile/", views.onboarding_profile, name="onboarding_profile"),
    path("onboarding/goal/", views.onboarding_goal, name="onboarding_goal"),
    path("onboarding/physical/", views.onboarding_physical, name="onboarding_physical"),
    path("onboarding/plan/", views.onboarding_plan, name="onboarding_plan"),
]
