from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import Http404
from django.shortcuts import redirect, render
from django.utils import timezone

from forge.accounts.models import UserProfile

from .forms import BodyMeasurementForm, DailyRecoveryForm, HabitDefinitionForm, HabitEntryForm
from .models import BodyMeasurement, DailyRecovery, HabitDefinition, HabitEntry
from .selectors import (
    get_active_habits_for_user,
    get_body_measurement_for_user,
    get_current_personal_records_for_user,
    get_daily_recovery_for_user,
    get_habit_entry_for_user,
    get_habit_for_user,
    get_latest_body_measurements_for_user,
    get_recent_experience_events_for_user,
    get_recent_workout_sessions_for_user,
    get_user_progression,
)
from .services import (
    award_habit_experience,
    award_measurement_experience,
    award_recovery_experience,
)


def require_completed_onboarding(request):
    if request.user.profile.onboarding_status != UserProfile.OnboardingStatus.COMPLETED:
        return redirect("accounts:onboarding")
    return None


@login_required
def overview(request):
    onboarding_response = require_completed_onboarding(request)
    if onboarding_response:
        return onboarding_response

    today = timezone.localdate()
    return render(
        request,
        "progress/overview.html",
        {
            "recent_sessions": get_recent_workout_sessions_for_user(request.user),
            "personal_records": get_current_personal_records_for_user(request.user),
            "today_recovery": get_daily_recovery_for_user(
                user=request.user,
                recovery_date=today,
            ),
            "measurements": get_latest_body_measurements_for_user(request.user),
            "habits": get_active_habits_for_user(request.user),
            "progression": get_user_progression(request.user),
            "experience_events": get_recent_experience_events_for_user(request.user),
        },
    )


@login_required
def recovery(request):
    onboarding_response = require_completed_onboarding(request)
    if onboarding_response:
        return onboarding_response

    today = timezone.localdate()
    recovery_record = get_daily_recovery_for_user(user=request.user, recovery_date=today)
    if request.method == "POST":
        form = DailyRecoveryForm(request.POST, instance=recovery_record)
        if form.is_valid():
            saved_record: DailyRecovery = form.save(commit=False)
            saved_record.user = request.user
            saved_record.recovery_date = today
            saved_record.full_clean()
            saved_record.save()
            award_recovery_experience(saved_record)
            messages.success(request, "Recuperação registrada.")
            return redirect("progress:overview")
    else:
        form = DailyRecoveryForm(instance=recovery_record)

    return render(request, "progress/recovery.html", {"form": form, "recovery_date": today})


@login_required
def measurement(request):
    onboarding_response = require_completed_onboarding(request)
    if onboarding_response:
        return onboarding_response

    today = timezone.localdate()
    measurement_record = get_body_measurement_for_user(user=request.user, measurement_date=today)
    if request.method == "POST":
        form = BodyMeasurementForm(request.POST, instance=measurement_record)
        if form.is_valid():
            saved_record: BodyMeasurement = form.save(commit=False)
            saved_record.user = request.user
            saved_record.measurement_date = today
            saved_record.full_clean()
            saved_record.save()
            award_measurement_experience(saved_record)
            messages.success(request, "Medição registrada.")
            return redirect("progress:overview")
    else:
        form = BodyMeasurementForm(instance=measurement_record)

    return render(request, "progress/measurement.html", {"form": form, "measurement_date": today})


@login_required
def habit_create(request):
    onboarding_response = require_completed_onboarding(request)
    if onboarding_response:
        return onboarding_response

    if request.method == "POST":
        form = HabitDefinitionForm(request.POST)
        if form.is_valid():
            habit: HabitDefinition = form.save(commit=False)
            habit.user = request.user
            habit.full_clean()
            habit.save()
            messages.success(request, "Hábito criado.")
            return redirect("progress:overview")
    else:
        form = HabitDefinitionForm()

    return render(request, "progress/habit_form.html", {"form": form})


@login_required
def habit_entry(request, habit_id):
    onboarding_response = require_completed_onboarding(request)
    if onboarding_response:
        return onboarding_response

    habit = get_habit_for_user(user=request.user, habit_id=habit_id)
    if habit is None:
        raise Http404("Hábito não encontrado.")
    today = timezone.localdate()
    entry = get_habit_entry_for_user(user=request.user, habit=habit, entry_date=today)
    if request.method == "POST":
        form = HabitEntryForm(request.POST, instance=entry)
        if form.is_valid():
            saved_entry: HabitEntry = form.save(commit=False)
            saved_entry.user = request.user
            saved_entry.habit_definition = habit
            saved_entry.entry_date = today
            saved_entry.full_clean()
            saved_entry.save()
            award_habit_experience(saved_entry)
            messages.success(request, "Hábito registrado.")
            return redirect("progress:overview")
    else:
        form = HabitEntryForm(instance=entry)

    return render(
        request,
        "progress/habit_entry.html",
        {"form": form, "habit": habit, "entry_date": today},
    )
