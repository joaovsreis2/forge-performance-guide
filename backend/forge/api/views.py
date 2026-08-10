import json
import uuid
from datetime import date
from decimal import Decimal, InvalidOperation
from functools import wraps

from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.forms import PasswordChangeForm, PasswordResetForm, SetPasswordForm
from django.contrib.auth.tokens import default_token_generator
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.http import HttpRequest, JsonResponse
from django.middleware.csrf import get_token
from django.utils import timezone
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_http_methods

from forge.accounts.forms import AccountProfileForm, PublicRegistrationForm, UserPreferenceForm
from forge.accounts.models import User, UserProfile
from forge.accounts.services import (
    acknowledge_plan_setup,
    register_user,
    update_account_profile,
    update_user_preferences,
)
from forge.progress.forms import BodyMeasurementForm, DailyRecoveryForm
from forge.progress.models import BodyMeasurement, HabitEntry
from forge.progress.selectors import (
    get_active_habits_for_user,
    get_body_measurement_for_user,
    get_completed_weight_sets_for_user,
    get_current_personal_records_for_user,
    get_daily_recovery_for_user,
    get_habit_entry_for_user,
    get_latest_body_measurements_for_user,
    get_recent_experience_events_for_user,
    get_recent_workout_sessions_for_user,
    get_user_achievements,
    get_user_progression,
)
from forge.progress.services import (
    award_habit_experience,
    award_measurement_experience,
    award_recovery_experience,
)
from forge.training.models import SessionExercise, WorkoutSession
from forge.training.selectors import (
    get_active_training_plan_for_user,
    get_open_workout_session_for_user,
    get_plan_workout_for_user,
    get_todays_plan_workout_for_user,
    get_workout_session_for_user,
)
from forge.training.services import (
    cancel_workout_session,
    complete_workout_session,
    pause_workout_session,
    record_completed_set,
    resume_workout_session,
    skip_completed_set,
    skip_session_exercise,
    start_workout_session,
)


def _cors(response: JsonResponse) -> JsonResponse:
    response["Access-Control-Allow-Origin"] = getattr(
        settings, "FRONTEND_ORIGIN", "http://localhost:3000"
    )
    response["Access-Control-Allow-Credentials"] = "true"
    response["Access-Control-Allow-Headers"] = "Content-Type, X-CSRFToken"
    response["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response


def _json(data, *, status=200):
    response = _cors(JsonResponse(data, status=status, safe=False))
    response["Cache-Control"] = "no-store"
    return response


def _options(request: HttpRequest):
    if request.method == "OPTIONS":
        return _json({})
    return None


def _body(request: HttpRequest) -> dict:
    if not request.body:
        return {}
    try:
        value = json.loads(request.body)
    except json.JSONDecodeError:
        return {}
    return value if isinstance(value, dict) else {}


def _auth_rate_key(request: HttpRequest, scope: str, identity: str = "") -> str:
    remote_address = request.META.get("REMOTE_ADDR", "unknown")
    normalized_identity = identity.strip().lower()
    return f"forge:auth:{scope}:{remote_address}:{normalized_identity}"


def _auth_throttled(request: HttpRequest, scope: str, identity: str = "") -> bool:
    key = _auth_rate_key(request, scope, identity)
    return int(cache.get(key, 0)) >= settings.AUTH_RATE_LIMIT_ATTEMPTS


def _record_auth_attempt(request: HttpRequest, scope: str, identity: str = "") -> None:
    key = _auth_rate_key(request, scope, identity)
    if cache.add(key, 1, timeout=settings.AUTH_RATE_LIMIT_WINDOW_SECONDS):
        return
    try:
        cache.incr(key)
    except ValueError:
        cache.set(key, 1, timeout=settings.AUTH_RATE_LIMIT_WINDOW_SECONDS)


def _clear_auth_attempts(request: HttpRequest, scope: str, identity: str = "") -> None:
    cache.delete(_auth_rate_key(request, scope, identity))


def _too_many_attempts() -> JsonResponse:
    response = _json(
        {"detail": "Muitas tentativas. Aguarde alguns minutos e tente novamente."}, status=429
    )
    response["Retry-After"] = str(settings.AUTH_RATE_LIMIT_WINDOW_SECONDS)
    return response


def _decimal(value):
    if value in (None, ""):
        return None
    try:
        return Decimal(str(value))
    except InvalidOperation, ValueError:
        return None


def _uuid(value):
    try:
        return uuid.UUID(str(value)) if value else None
    except ValueError, TypeError, AttributeError:
        return None


def _date(value):
    try:
        return date.fromisoformat(str(value)) if value else timezone.localdate()
    except ValueError:
        return timezone.localdate()


def _auth_required(view):
    @wraps(view)
    def wrapped(request, *args, **kwargs):
        if request.method == "OPTIONS":
            return _options(request)
        if not request.user.is_authenticated:
            return _json({"detail": "Autenticação necessária."}, status=401)
        return view(request, *args, **kwargs)

    return wrapped


def _exercise_data(prescription):
    return {
        "id": str(prescription.exercise_id),
        "name": prescription.exercise.name,
        "sets": prescription.target_sets,
        "repLow": prescription.target_repetitions_min,
        "repHigh": prescription.target_repetitions_max,
        "restSeconds": prescription.rest_seconds or prescription.exercise.default_rest_seconds,
        "suggestedWeight": float(prescription.target_weight_kg or 0),
        "note": prescription.technical_notes,
    }


def _workout_data(workout):
    prescriptions = workout.exercise_prescriptions.all()
    return {
        "id": str(workout.id),
        "weekday": workout.get_weekday_display() if workout.weekday is not None else None,
        "name": workout.name,
        "focus": workout.description,
        "kind": "training" if prescriptions else "rest",
        "estimatedMinutes": workout.estimated_duration_minutes or 0,
        "exercises": [_exercise_data(item) for item in prescriptions],
    }


def _session_data(workout_session):
    exercises = list(workout_session.exercise_snapshots.all())
    active = next(
        (item for item in exercises if item.status == SessionExercise.Status.ACTIVE), None
    )
    if active is None:
        active = next(
            (item for item in exercises if item.status == SessionExercise.Status.PENDING), None
        )
    sets = list(workout_session.completed_sets.select_related("session_exercise").all())
    next_set = active.completed_sets.count() + 1 if active else 1
    return {
        "id": str(workout_session.id),
        "status": workout_session.status,
        "name": workout_session.workout_name_snapshot,
        "startedAt": workout_session.started_at.isoformat(),
        "durationSeconds": workout_session.duration_seconds,
        "activeExerciseId": str(active.id) if active else None,
        "nextSetNumber": next_set,
        "exercises": [
            {
                "id": str(item.id),
                "name": item.exercise_name_snapshot,
                "sets": item.target_sets_snapshot,
                "repLow": item.target_repetitions_min_snapshot,
                "repHigh": item.target_repetitions_max_snapshot,
                "restSeconds": item.rest_seconds_snapshot or 90,
                "suggestedWeight": float(item.target_weight_kg_snapshot or 0),
                "note": item.technical_notes_snapshot,
                "status": item.status,
                "completedSets": item.completed_sets.count(),
            }
            for item in exercises
        ],
        "logs": [
            {
                "id": str(item.id),
                "exerciseId": str(item.session_exercise_id),
                "setIndex": item.set_number - 1,
                "weight": float(item.weight_kg or 0),
                "reps": item.repetitions or 0,
                "skipped": item.status == "skipped",
                "at": item.completed_at.isoformat(),
            }
            for item in sets
        ],
    }


def _user_data(user):
    profile = user.profile
    return {
        "id": str(user.id),
        "email": user.email,
        "name": user.display_name,
        "firstName": (user.display_name or user.email).split()[0],
        "goal": profile.get_training_goal_display() if profile.training_goal else None,
        "onboardingCompleted": profile.onboarding_status == UserProfile.OnboardingStatus.COMPLETED,
    }


def _account_data(user):
    profile = user.profile
    preferences = user.preferences
    return {
        **_user_data(user),
        "trainingGoal": profile.training_goal,
        "birthDate": profile.birth_date.isoformat() if profile.birth_date else None,
        "heightCm": float(profile.height_cm) if profile.height_cm is not None else None,
        "currentWeightKg": float(profile.current_weight_kg)
        if profile.current_weight_kg is not None
        else None,
        "timezone": preferences.timezone,
        "weightUnit": preferences.weight_unit,
        "distanceUnit": preferences.distance_unit,
        "appearance": preferences.appearance,
        "soundEnabled": preferences.rest_timer_sound_enabled,
        "vibrationEnabled": preferences.rest_timer_vibration_enabled,
    }


def _form_errors(form):
    return {field: [str(error) for error in errors] for field, errors in form.errors.items()}


def _measurement_data(item):
    def number(value):
        return float(value) if value is not None else None

    return {
        "id": str(item.id),
        "date": item.measurement_date.isoformat(),
        "weightKg": number(item.weight_kg),
        "bodyFatPercentage": number(item.body_fat_percentage),
        "chestCm": number(item.chest_cm),
        "waistCm": number(item.waist_cm),
        "hipsCm": number(item.hips_cm),
        "notes": item.notes,
    }


def _recovery_data(user, recovery_date):
    record = get_daily_recovery_for_user(user=user, recovery_date=recovery_date)
    habits = list(get_active_habits_for_user(user))
    completed_ids = set(
        HabitEntry.objects.filter(
            user=user,
            habit_definition__in=habits,
            entry_date=recovery_date,
            status=HabitEntry.Status.COMPLETED,
        ).values_list("habit_definition_id", flat=True)
    )
    return {
        "date": recovery_date.isoformat(),
        "sleepMinutes": record.sleep_minutes if record else None,
        "hydrationMl": record.hydration_ml if record else None,
        "movementCompleted": record.cardio_completed if record else False,
        "notes": record.notes if record else "",
        "habits": [
            {"id": str(habit.id), "name": habit.name, "completed": habit.id in completed_ids}
            for habit in habits
        ],
    }


@ensure_csrf_cookie
@require_http_methods(["GET", "OPTIONS"])
def csrf(request):
    result = _options(request)
    return result or _json({"csrfToken": get_token(request)})


@require_http_methods(["POST", "OPTIONS"])
def login_api(request):
    result = _options(request)
    if result:
        return result
    payload = _body(request)
    email = payload.get("email", "")
    if _auth_throttled(request, "login", email):
        return _too_many_attempts()
    user = authenticate(request, username=email, password=payload.get("password", ""))
    if user is None:
        _record_auth_attempt(request, "login", email)
        return _json({"detail": "E-mail ou senha inválidos."}, status=400)
    _clear_auth_attempts(request, "login", email)
    login(request, user)
    return _json(_user_data(user))


@require_http_methods(["POST", "OPTIONS"])
def register_api(request):
    result = _options(request)
    if result:
        return result
    payload = _body(request)
    if _auth_throttled(request, "register"):
        return _too_many_attempts()
    _record_auth_attempt(request, "register")
    form = PublicRegistrationForm(
        {
            "email": payload.get("email", ""),
            "display_name": payload.get("name", ""),
            "password1": payload.get("password", ""),
            "password2": payload.get("passwordConfirmation", ""),
            "accepted_terms": payload.get("acceptedTerms", False),
        }
    )
    if not form.is_valid():
        return _json(
            {
                "detail": "Revise os campos informados.",
                "errors": _form_errors(form),
            },
            status=400,
        )
    user = register_user(
        email=form.cleaned_data["email"],
        password=form.cleaned_data["password1"],
        display_name=form.cleaned_data["display_name"],
    )
    login(request, user)
    return _json(_user_data(user), status=201)


@require_http_methods(["POST", "OPTIONS"])
def recover_password(request):
    result = _options(request)
    if result:
        return result
    if not settings.PASSWORD_RECOVERY_ENABLED:
        return _json(
            {"detail": "A recuperação de senha está temporariamente indisponível."},
            status=503,
        )
    email = _body(request).get("email", "")
    if _auth_throttled(request, "recover", email):
        return _too_many_attempts()
    _record_auth_attempt(request, "recover", email)
    form = PasswordResetForm({"email": email})
    if form.is_valid():
        user = next(iter(form.get_users(form.cleaned_data["email"])), None)
        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_url = f"{settings.FRONTEND_ORIGIN}/reset-password/{uid}/{token}"
            send_mail(
                "Redefina sua senha do Forge",
                f"Use este link para definir uma nova senha:\n\n{reset_url}",
                None,
                [user.email],
            )
            payload = {"ok": True}
            if settings.DEBUG:
                payload["debugResetUrl"] = reset_url
            return _json(payload)
    return _json({"ok": True})


@require_http_methods(["POST", "OPTIONS"])
def reset_password(request, uidb64, token):
    result = _options(request)
    if result:
        return result
    try:
        user_id = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=user_id)
    except ValueError, TypeError, OverflowError, User.DoesNotExist:
        user = None
    if user is None or not default_token_generator.check_token(user, token):
        return _json({"detail": "Este link é inválido ou expirou."}, status=400)
    payload = _body(request)
    form = SetPasswordForm(
        user,
        {
            "new_password1": payload.get("password", ""),
            "new_password2": payload.get("passwordConfirmation", ""),
        },
    )
    if not form.is_valid():
        return _json(
            {"detail": "Revise a nova senha.", "errors": _form_errors(form)},
            status=400,
        )
    form.save()
    return _json({"ok": True})


@require_http_methods(["POST", "OPTIONS"])
def logout_api(request):
    result = _options(request)
    if result:
        return result
    logout(request)
    return _json({"ok": True})


@_auth_required
@require_http_methods(["GET", "OPTIONS"])
def me(request):
    return _json(_user_data(request.user))


@_auth_required
@require_http_methods(["GET", "POST", "OPTIONS"])
def account(request):
    if request.method == "GET":
        return _json(_account_data(request.user))

    payload = _body(request)
    profile_form = AccountProfileForm(
        {
            "display_name": payload.get("name", request.user.display_name),
            "training_goal": payload.get("trainingGoal", request.user.profile.training_goal),
            "birth_date": payload.get("birthDate") or "",
            "height_cm": payload.get("heightCm") or "",
            "current_weight_kg": payload.get("currentWeightKg") or "",
        }
    )
    preference_form = UserPreferenceForm(
        {
            "timezone": payload.get("timezone", request.user.preferences.timezone),
            "weight_unit": payload.get("weightUnit", request.user.preferences.weight_unit),
            "distance_unit": payload.get("distanceUnit", request.user.preferences.distance_unit),
            "appearance": payload.get("appearance", request.user.preferences.appearance),
            "rest_timer_sound_enabled": payload.get(
                "soundEnabled", request.user.preferences.rest_timer_sound_enabled
            ),
            "rest_timer_vibration_enabled": payload.get(
                "vibrationEnabled", request.user.preferences.rest_timer_vibration_enabled
            ),
        },
        instance=request.user.preferences,
    )
    if not profile_form.is_valid() or not preference_form.is_valid():
        return _json(
            {
                "detail": "Revise os campos informados.",
                "errors": {
                    **_form_errors(profile_form),
                    **_form_errors(preference_form),
                },
            },
            status=400,
        )
    update_account_profile(user=request.user, **profile_form.cleaned_data)
    update_user_preferences(
        preferences=request.user.preferences,
        cleaned_data=preference_form.cleaned_data,
    )
    return _json(_account_data(request.user))


@_auth_required
@require_http_methods(["POST", "OPTIONS"])
def change_password(request):
    payload = _body(request)
    form = PasswordChangeForm(
        request.user,
        {
            "old_password": payload.get("currentPassword", ""),
            "new_password1": payload.get("password", ""),
            "new_password2": payload.get("passwordConfirmation", ""),
        },
    )
    if not form.is_valid():
        return _json(
            {"detail": "Revise as senhas informadas.", "errors": _form_errors(form)},
            status=400,
        )
    user = form.save()
    login(request, user)
    return _json({"ok": True})


@_auth_required
@require_http_methods(["POST", "OPTIONS"])
def delete_account(request):
    password = _body(request).get("password", "")
    if not request.user.check_password(password):
        return _json({"detail": "Senha incorreta."}, status=400)
    request.user.delete()
    logout(request)
    return _json({"ok": True})


@_auth_required
@require_http_methods(["POST", "OPTIONS"])
def onboarding(request):
    payload = _body(request)
    form = AccountProfileForm(
        {
            "display_name": payload.get("name", ""),
            "training_goal": payload.get("trainingGoal", ""),
            "birth_date": payload.get("birthDate") or "",
            "height_cm": payload.get("heightCm") or "",
            "current_weight_kg": payload.get("currentWeightKg") or "",
        }
    )
    if not form.is_valid():
        return _json(
            {"detail": "Revise os campos informados.", "errors": _form_errors(form)},
            status=400,
        )
    update_account_profile(user=request.user, **form.cleaned_data)
    if payload.get("timezone"):
        preference_form = UserPreferenceForm(
            {
                "timezone": payload["timezone"],
                "weight_unit": request.user.preferences.weight_unit,
                "distance_unit": request.user.preferences.distance_unit,
                "appearance": request.user.preferences.appearance,
                "rest_timer_sound_enabled": request.user.preferences.rest_timer_sound_enabled,
                "rest_timer_vibration_enabled": (
                    request.user.preferences.rest_timer_vibration_enabled
                ),
            },
            instance=request.user.preferences,
        )
        if not preference_form.is_valid():
            return _json(
                {
                    "detail": "Fuso horário inválido.",
                    "errors": _form_errors(preference_form),
                },
                status=400,
            )
        update_user_preferences(
            preferences=request.user.preferences,
            cleaned_data=preference_form.cleaned_data,
        )
    try:
        acknowledge_plan_setup(profile=request.user.profile)
    except ValidationError as error:
        return _json({"detail": "; ".join(error.messages)}, status=400)
    return _json(_user_data(request.user))


@_auth_required
@require_http_methods(["GET", "POST", "OPTIONS"])
def recovery(request):
    today = timezone.localdate()
    if request.method == "GET":
        return _json(_recovery_data(request.user, today))

    payload = _body(request)
    record = get_daily_recovery_for_user(user=request.user, recovery_date=today)
    form = DailyRecoveryForm(
        {
            "sleep_minutes": payload.get("sleepMinutes") or "",
            "hydration_ml": payload.get("hydrationMl") or "",
            "cardio_completed": payload.get("movementCompleted", False),
            "notes": payload.get("notes", ""),
        },
        instance=record,
    )
    if not form.is_valid():
        return _json(
            {"detail": "Revise os campos informados.", "errors": _form_errors(form)},
            status=400,
        )
    saved = form.save(commit=False)
    saved.user = request.user
    saved.recovery_date = today
    saved.full_clean()
    saved.save()
    award_recovery_experience(saved)

    selected = {_uuid(value) for value in payload.get("completedHabitIds", [])}
    for habit in get_active_habits_for_user(request.user):
        entry = get_habit_entry_for_user(user=request.user, habit=habit, entry_date=today)
        entry = entry or HabitEntry(user=request.user, habit_definition=habit, entry_date=today)
        entry.status = (
            HabitEntry.Status.COMPLETED if habit.id in selected else HabitEntry.Status.MISSED
        )
        entry.full_clean()
        entry.save()
        award_habit_experience(entry)
    return _json(_recovery_data(request.user, today))


@_auth_required
@require_http_methods(["GET", "POST", "OPTIONS"])
def measurements(request):
    today = timezone.localdate()
    if request.method == "GET":
        recent = get_latest_body_measurements_for_user(request.user)
        return _json([_measurement_data(item) for item in recent])

    payload = _body(request)
    record = get_body_measurement_for_user(user=request.user, measurement_date=today)
    form = BodyMeasurementForm(
        {
            "weight_kg": payload.get("weightKg") or "",
            "body_fat_percentage": payload.get("bodyFatPercentage") or "",
            "chest_cm": payload.get("chestCm") or "",
            "waist_cm": payload.get("waistCm") or "",
            "hips_cm": payload.get("hipsCm") or "",
            "notes": payload.get("notes", ""),
        },
        instance=record,
    )
    if not form.is_valid():
        return _json(
            {"detail": "Revise os campos informados.", "errors": _form_errors(form)},
            status=400,
        )
    saved: BodyMeasurement = form.save(commit=False)
    saved.user = request.user
    saved.measurement_date = today
    saved.full_clean()
    saved.save()
    award_measurement_experience(saved)
    return _json(_measurement_data(saved), status=201 if record is None else 200)


@_auth_required
@require_http_methods(["GET", "OPTIONS"])
def plan(request):
    active_plan = get_active_training_plan_for_user(request.user)
    today = get_todays_plan_workout_for_user(request.user)
    return _json(
        {
            "id": str(active_plan.id) if active_plan else None,
            "name": active_plan.name if active_plan else None,
            "description": active_plan.description if active_plan else None,
            "todayWorkoutId": str(today.id) if today else None,
            "days": [_workout_data(item) for item in active_plan.workouts.all()]
            if active_plan
            else [],
            "openSession": _session_data(get_open_workout_session_for_user(request.user))
            if get_open_workout_session_for_user(request.user)
            else None,
        }
    )


@_auth_required
@require_http_methods(["GET", "OPTIONS"])
def progress(request):
    progression = get_user_progression(request.user)
    exercise_points = {}
    for item in reversed(list(get_completed_weight_sets_for_user(request.user))):
        exercise = item.session_exercise.source_exercise
        key = str(exercise.id)
        date_key = item.completed_at.date().isoformat()
        series = exercise_points.setdefault(key, {"id": key, "name": exercise.name, "points": {}})
        current = series["points"].get(date_key)
        weight = float(item.weight_kg)
        if current is None or weight > current["weightKg"]:
            series["points"][date_key] = {
                "date": date_key,
                "weightKg": weight,
                "repetitions": item.repetitions or 0,
            }
    return _json(
        {
            "progression": {
                "level": progression.current_level,
                "totalExperience": progression.total_experience,
                "performance": progression.performance_score,
                "consistency": progression.consistency_score,
                "recovery": progression.recovery_score,
            }
            if progression
            else None,
            "sessions": [
                {
                    "id": str(item.id),
                    "name": item.workout_name_snapshot,
                    "status": item.status,
                    "date": item.started_at.date().isoformat(),
                    "durationSeconds": item.duration_seconds,
                }
                for item in get_recent_workout_sessions_for_user(request.user)
            ],
            "records": [
                {
                    "exercise": item.exercise.name,
                    "type": item.get_record_type_display(),
                    "value": float(item.value_numeric),
                    "date": item.achieved_at.date().isoformat(),
                }
                for item in get_current_personal_records_for_user(request.user)
            ],
            "experienceEvents": [
                {
                    "reason": item.reason,
                    "amount": item.experience_delta,
                    "date": item.occurred_at.isoformat(),
                }
                for item in get_recent_experience_events_for_user(request.user)
            ],
            "achievements": [
                {
                    "name": item.achievement.name,
                    "description": item.achievement.description,
                    "earnedAt": item.earned_at.isoformat(),
                }
                for item in get_user_achievements(request.user)
            ],
            "exerciseSeries": [
                {**series, "points": list(series["points"].values())}
                for series in exercise_points.values()
            ],
        }
    )


def _session_or_404(request, session_id):
    return get_workout_session_for_user(user=request.user, session_id=session_id)


@_auth_required
@require_http_methods(["POST", "OPTIONS"])
def start_workout(request, workout_id):
    workout = get_plan_workout_for_user(user=request.user, workout_id=workout_id)
    if workout is None:
        return _json({"detail": "Treino não encontrado."}, status=404)
    try:
        session = start_workout_session(
            user=request.user,
            plan_workout=workout,
            client_generated_id=_uuid(_body(request).get("clientGeneratedId")),
            scheduled_for=_date(_body(request).get("scheduledFor")),
        )
    except Exception as error:
        return _json({"detail": str(error)}, status=400)
    return _json(
        _session_data(get_workout_session_for_user(user=request.user, session_id=session.id)),
        status=201,
    )


def _session_action(request, session_id, action):
    current = _session_or_404(request, session_id)
    if current is None:
        return _json({"detail": "Sessão não encontrada."}, status=404)
    try:
        session = action(user=request.user, session=current)
    except Exception as error:
        return _json({"detail": str(error)}, status=400)
    return _json(
        _session_data(get_workout_session_for_user(user=request.user, session_id=session.id))
    )


@_auth_required
@require_http_methods(["GET", "OPTIONS"])
def session(request, session_id):
    current = _session_or_404(request, session_id)
    return (
        _json(_session_data(current))
        if current
        else _json({"detail": "Sessão não encontrada."}, status=404)
    )


@_auth_required
@require_http_methods(["POST", "OPTIONS"])
def record_set(request, session_id):
    current = _session_or_404(request, session_id)
    if current is None:
        return _json({"detail": "Sessão não encontrada."}, status=404)
    payload = _body(request)
    exercise = current.exercise_snapshots.filter(id=payload.get("sessionExerciseId")).first()
    exercise = (
        exercise or current.exercise_snapshots.filter(status=SessionExercise.Status.ACTIVE).first()
    )
    if exercise is None:
        return _json({"detail": "Nenhum exercício ativo."}, status=400)
    try:
        record_completed_set(
            user=request.user,
            session_exercise=exercise,
            set_number=int(payload.get("setNumber", exercise.completed_sets.count() + 1)),
            client_generated_id=_uuid(payload.get("clientGeneratedId")),
            repetitions=int(payload["repetitions"])
            if payload.get("repetitions") not in (None, "")
            else None,
            weight_kg=_decimal(payload.get("weightKg")),
            duration_seconds=int(payload["durationSeconds"])
            if payload.get("durationSeconds")
            else None,
            distance_meters=int(payload["distanceMeters"])
            if payload.get("distanceMeters")
            else None,
        )
    except Exception as error:
        return _json({"detail": str(error)}, status=400)
    return _json(
        _session_data(get_workout_session_for_user(user=request.user, session_id=current.id))
    )


@_auth_required
@require_http_methods(["POST", "OPTIONS"])
def skip_set(request, session_id):
    current = _session_or_404(request, session_id)
    payload = _body(request)
    exercise = (
        current.exercise_snapshots.filter(status=SessionExercise.Status.ACTIVE).first()
        if current
        else None
    )
    if exercise is None:
        return _json({"detail": "Nenhum exercício ativo."}, status=400)
    try:
        skip_completed_set(
            user=request.user,
            session_exercise=exercise,
            set_number=exercise.completed_sets.count() + 1,
            client_generated_id=_uuid(payload.get("clientGeneratedId")),
        )
    except Exception as error:
        return _json({"detail": str(error)}, status=400)
    return _json(
        _session_data(get_workout_session_for_user(user=request.user, session_id=current.id))
    )


@_auth_required
@require_http_methods(["POST", "OPTIONS"])
def skip_exercise(request, session_id):
    current = _session_or_404(request, session_id)
    payload = _body(request)
    exercise = (
        current.exercise_snapshots.filter(id=payload.get("sessionExerciseId")).first()
        if current
        else None
    )
    exercise = exercise or (
        current.exercise_snapshots.filter(status=SessionExercise.Status.ACTIVE).first()
        if current
        else None
    )
    if exercise and exercise.status == SessionExercise.Status.SKIPPED:
        return _json(_session_data(current))
    if exercise is None:
        return _json({"detail": "Nenhum exercício ativo."}, status=400)
    try:
        skip_session_exercise(user=request.user, session_exercise=exercise)
    except Exception as error:
        return _json({"detail": str(error)}, status=400)
    return _json(
        _session_data(get_workout_session_for_user(user=request.user, session_id=current.id))
    )


@_auth_required
@require_http_methods(["POST", "OPTIONS"])
def pause_session(request, session_id):
    current = _session_or_404(request, session_id)
    if current and current.status == WorkoutSession.Status.PAUSED:
        return _json(_session_data(current))
    return _session_action(request, session_id, pause_workout_session)


@_auth_required
@require_http_methods(["POST", "OPTIONS"])
def resume_session(request, session_id):
    current = _session_or_404(request, session_id)
    if current and current.status == WorkoutSession.Status.ACTIVE:
        return _json(_session_data(current))
    return _session_action(request, session_id, resume_workout_session)


@_auth_required
@require_http_methods(["POST", "OPTIONS"])
def complete_session(request, session_id):
    current = _session_or_404(request, session_id)
    if current and current.status == WorkoutSession.Status.COMPLETED:
        return _json(_session_data(current))
    return _session_action(request, session_id, complete_workout_session)


@_auth_required
@require_http_methods(["POST", "OPTIONS"])
def cancel_session(request, session_id):
    current = _session_or_404(request, session_id)
    if current and current.status == WorkoutSession.Status.CANCELLED:
        return _json(_session_data(current))
    return _session_action(request, session_id, cancel_workout_session)
