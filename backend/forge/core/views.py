import logging

from django.conf import settings
from django.db import DatabaseError, connection
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.shortcuts import redirect, render

from forge.accounts.models import UserProfile
from forge.training.selectors import (
    get_active_training_plan_for_user,
    get_open_workout_session_for_user,
    get_todays_plan_workout_for_user,
)

logger = logging.getLogger(__name__)


def home(request: HttpRequest) -> HttpResponse:
    if not request.user.is_authenticated:
        return redirect("accounts:signin")
    if request.user.profile.onboarding_status != UserProfile.OnboardingStatus.COMPLETED:
        return redirect("accounts:onboarding")

    today_workout = get_todays_plan_workout_for_user(request.user)
    today_total_sets = (
        sum(prescription.target_sets for prescription in today_workout.exercise_prescriptions.all())
        if today_workout
        else 0
    )

    return render(
        request,
        "core/home.html",
        {
            "environment": settings.ENVIRONMENT,
            "active_plan": get_active_training_plan_for_user(request.user),
            "open_session": get_open_workout_session_for_user(request.user),
            "today_workout": today_workout,
            "today_total_sets": today_total_sets,
        },
    )


def health(request: HttpRequest) -> JsonResponse:
    del request
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
    except DatabaseError:
        logger.error("PostgreSQL indisponível durante o health check")
        return JsonResponse({"status": "error", "database": "unavailable"}, status=503)

    return JsonResponse({"status": "ok", "database": "ok"})


def offline(request: HttpRequest) -> HttpResponse:
    return render(request, "core/offline.html")


def service_worker(request: HttpRequest) -> HttpResponse:
    response = render(request, "core/service_worker.js", content_type="application/javascript")
    response["Service-Worker-Allowed"] = "/"
    return response
