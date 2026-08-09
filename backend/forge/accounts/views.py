from django.contrib import messages
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.contrib.auth.views import (
    LoginView,
    LogoutView,
    PasswordResetCompleteView,
    PasswordResetConfirmView,
    PasswordResetDoneView,
    PasswordResetView,
)
from django.http import HttpRequest, HttpResponse
from django.shortcuts import redirect, render
from django.urls import reverse, reverse_lazy
from django.views.decorators.http import require_http_methods

from .forms import (
    AccountProfileForm,
    PhysicalInfoForm,
    ProfileSetupForm,
    PublicRegistrationForm,
    TrainingGoalForm,
    UserPreferenceForm,
)
from .models import UserProfile
from .services import (
    acknowledge_plan_setup,
    complete_physical_info_step,
    complete_profile_step,
    complete_training_goal_step,
    register_user,
    update_account_profile,
    update_user_preferences,
)

ONBOARDING_STEP_URLS = {
    UserProfile.OnboardingStatus.PROFILE: "accounts:onboarding_profile",
    UserProfile.OnboardingStatus.TRAINING_GOAL: "accounts:onboarding_goal",
    UserProfile.OnboardingStatus.PHYSICAL_INFO: "accounts:onboarding_physical",
    UserProfile.OnboardingStatus.PLAN_SETUP: "accounts:onboarding_plan",
}


class SignInView(LoginView):
    template_name = "accounts/signin.html"
    redirect_authenticated_user = True

    def get_success_url(self) -> str:
        return reverse("accounts:onboarding")


class SignOutView(LogoutView):
    next_page = reverse_lazy("accounts:signin")


class RecoverPasswordView(PasswordResetView):
    template_name = "accounts/password_reset_form.html"
    email_template_name = "accounts/password_reset_email.txt"
    subject_template_name = "accounts/password_reset_subject.txt"
    success_url = reverse_lazy("accounts:password_reset_done")


class RecoverPasswordDoneView(PasswordResetDoneView):
    template_name = "accounts/password_reset_done.html"


class RecoverPasswordConfirmView(PasswordResetConfirmView):
    template_name = "accounts/password_reset_confirm.html"
    success_url = reverse_lazy("accounts:password_reset_complete")


class RecoverPasswordCompleteView(PasswordResetCompleteView):
    template_name = "accounts/password_reset_complete.html"


@require_http_methods(["GET", "POST"])
def register(request: HttpRequest) -> HttpResponse:
    if request.user.is_authenticated:
        return redirect("accounts:onboarding")

    form = PublicRegistrationForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        user = register_user(
            email=form.cleaned_data["email"],
            password=form.cleaned_data["password1"],
            display_name=form.cleaned_data["display_name"],
        )
        login(request, user)
        return redirect("accounts:onboarding")

    return render(request, "accounts/register.html", {"form": form})


@login_required
def onboarding(request: HttpRequest) -> HttpResponse:
    status = request.user.profile.onboarding_status
    if status == UserProfile.OnboardingStatus.COMPLETED:
        return redirect("core:home")
    return redirect(ONBOARDING_STEP_URLS[status])


@login_required
@require_http_methods(["GET", "POST"])
def onboarding_profile(request: HttpRequest) -> HttpResponse:
    form = ProfileSetupForm(
        request.POST or None,
        initial={"display_name": request.user.display_name},
    )
    if request.method == "POST" and form.is_valid():
        complete_profile_step(user=request.user, display_name=form.cleaned_data["display_name"])
        return redirect("accounts:onboarding")

    return render(
        request,
        "accounts/onboarding_step.html",
        {
            "eyebrow": "Perfil",
            "title": "Como devemos chamar você?",
            "summary": "Use um nome simples para identificar sua conta dentro do Forge.",
            "form": form,
            "submit_label": "Continuar",
        },
    )


@login_required
@require_http_methods(["GET", "POST"])
def onboarding_goal(request: HttpRequest) -> HttpResponse:
    form = TrainingGoalForm(request.POST or None, instance=request.user.profile)
    if request.method == "POST" and form.is_valid():
        complete_training_goal_step(
            profile=request.user.profile,
            training_goal=form.cleaned_data["training_goal"],
        )
        return redirect("accounts:onboarding")

    return render(
        request,
        "accounts/onboarding_step.html",
        {
            "eyebrow": "Objetivo",
            "title": "Qual é o foco agora?",
            "summary": "Isso ajuda o Forge a organizar contexto sem transformar treino em ruído.",
            "form": form,
            "submit_label": "Continuar",
        },
    )


@login_required
@require_http_methods(["GET", "POST"])
def onboarding_physical(request: HttpRequest) -> HttpResponse:
    form = PhysicalInfoForm(request.POST or None, instance=request.user.profile)
    if request.method == "POST" and form.is_valid():
        complete_physical_info_step(
            profile=request.user.profile,
            birth_date=form.cleaned_data["birth_date"],
            height_cm=form.cleaned_data["height_cm"],
            current_weight_kg=form.cleaned_data["current_weight_kg"],
        )
        return redirect("accounts:onboarding")

    return render(
        request,
        "accounts/onboarding_step.html",
        {
            "eyebrow": "Dados físicos",
            "title": "Informações essenciais",
            "summary": "Esses dados são usados com cuidado e podem ser refinados depois.",
            "form": form,
            "submit_label": "Continuar",
        },
    )


@login_required
@require_http_methods(["GET", "POST"])
def onboarding_plan(request: HttpRequest) -> HttpResponse:
    if request.method == "POST":
        acknowledge_plan_setup(profile=request.user.profile)
        return redirect("core:home")

    return render(request, "accounts/onboarding_plan.html")


@login_required
@require_http_methods(["GET", "POST"])
def account(request: HttpRequest) -> HttpResponse:
    profile_initial = {
        "display_name": request.user.display_name,
        "training_goal": request.user.profile.training_goal,
        "birth_date": request.user.profile.birth_date,
        "height_cm": request.user.profile.height_cm,
        "current_weight_kg": request.user.profile.current_weight_kg,
    }
    profile_form = AccountProfileForm(initial=profile_initial, prefix="profile")
    preference_form = UserPreferenceForm(instance=request.user.preferences, prefix="preferences")

    if request.method == "POST":
        if request.POST.get("form") == "profile":
            profile_form = AccountProfileForm(request.POST, prefix="profile")
            if profile_form.is_valid():
                update_account_profile(user=request.user, **profile_form.cleaned_data)
                messages.success(request, "Perfil atualizado.")
                return redirect("accounts:account")
        elif request.POST.get("form") == "preferences":
            preference_form = UserPreferenceForm(
                request.POST,
                instance=request.user.preferences,
                prefix="preferences",
            )
            if preference_form.is_valid():
                update_user_preferences(
                    preferences=request.user.preferences,
                    cleaned_data=preference_form.cleaned_data,
                )
                messages.success(request, "Preferências atualizadas.")
                return redirect("accounts:account")

    return render(
        request,
        "accounts/account.html",
        {
            "profile_form": profile_form,
            "preference_form": preference_form,
        },
    )
