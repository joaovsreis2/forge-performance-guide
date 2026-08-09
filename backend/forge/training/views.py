from uuid import UUID

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ValidationError
from django.http import Http404, HttpRequest, HttpResponse
from django.shortcuts import redirect, render
from django.views.decorators.http import require_POST

from forge.accounts.models import UserProfile
from forge.core.models import SyncOperation
from forge.core.services import record_completed_sync_operation

from .forms import CompletedSetForm
from .models import SessionExercise, WorkoutSession
from .selectors import (
    get_active_training_plan_for_user,
    get_open_workout_session_for_user,
    get_plan_workout_for_user,
    get_training_plan_for_user,
    get_workout_session_for_user,
)
from .services import (
    cancel_workout_session,
    complete_workout_session,
    pause_workout_session,
    record_completed_set,
    resume_workout_session,
    skip_completed_set,
    skip_session_exercise,
    start_workout_session,
)


def require_completed_onboarding(request: HttpRequest) -> HttpResponse | None:
    if request.user.profile.onboarding_status != UserProfile.OnboardingStatus.COMPLETED:
        return redirect("accounts:onboarding")
    return None


@login_required
def plan(request: HttpRequest) -> HttpResponse:
    onboarding_response = require_completed_onboarding(request)
    if onboarding_response:
        return onboarding_response

    return render(
        request,
        "training/plan.html",
        {"active_plan": get_active_training_plan_for_user(request.user)},
    )


@login_required
def plan_detail(request: HttpRequest, plan_id) -> HttpResponse:
    onboarding_response = require_completed_onboarding(request)
    if onboarding_response:
        return onboarding_response

    training_plan = get_training_plan_for_user(user=request.user, plan_id=plan_id)
    if training_plan is None:
        raise Http404("Plano não encontrado.")
    return render(request, "training/plan_detail.html", {"training_plan": training_plan})


@login_required
def workout_preview(request: HttpRequest, workout_id) -> HttpResponse:
    onboarding_response = require_completed_onboarding(request)
    if onboarding_response:
        return onboarding_response

    workout = get_plan_workout_for_user(user=request.user, workout_id=workout_id)
    if workout is None:
        raise Http404("Treino não encontrado.")
    open_session = get_open_workout_session_for_user(request.user)
    return render(
        request,
        "training/workout_preview.html",
        {"workout": workout, "open_session": open_session},
    )


@require_POST
@login_required
def workout_start(request: HttpRequest, workout_id) -> HttpResponse:
    onboarding_response = require_completed_onboarding(request)
    if onboarding_response:
        return onboarding_response

    workout = get_plan_workout_for_user(user=request.user, workout_id=workout_id)
    if workout is None:
        raise Http404("Treino não encontrado.")
    try:
        session = start_workout_session(user=request.user, plan_workout=workout)
    except ValidationError as error:
        open_session = get_open_workout_session_for_user(request.user)
        if open_session:
            messages.info(request, "Você já tem um treino em andamento.")
            return redirect("training:session_active", session_id=open_session.id)
        messages.error(request, error.messages[0])
        return redirect("training:workout_preview", workout_id=workout.id)

    return redirect("training:session_active", session_id=session.id)


@login_required
def session_active(request: HttpRequest, session_id) -> HttpResponse:
    onboarding_response = require_completed_onboarding(request)
    if onboarding_response:
        return onboarding_response

    session = get_workout_session_for_user(user=request.user, session_id=session_id)
    if session is None:
        raise Http404("Sessão não encontrada.")
    if session.status == WorkoutSession.Status.COMPLETED:
        return redirect("training:session_summary", session_id=session.id)

    active_exercise = _get_active_session_exercise(session)
    latest_set = session.completed_sets.order_by("-completed_at").first()
    form = CompletedSetForm()
    if request.method == "POST" and active_exercise is not None:
        form = CompletedSetForm(request.POST)
        if form.is_valid():
            try:
                client_generated_id = _posted_client_generated_id(request)
                record_completed_set(
                    user=request.user,
                    session_exercise=active_exercise,
                    set_number=_posted_set_number(request, active_exercise),
                    client_generated_id=client_generated_id,
                    repetitions=form.cleaned_data["repetitions"],
                    weight_kg=form.cleaned_data["weight_kg"],
                    duration_seconds=form.cleaned_data["duration_seconds"],
                    distance_meters=form.cleaned_data["distance_meters"],
                )
                if client_generated_id:
                    record_completed_sync_operation(
                        user=request.user,
                        client_operation_id=client_generated_id,
                        entity_type="completed_set",
                        entity_client_id=str(client_generated_id),
                        operation_type=SyncOperation.OperationType.CREATE,
                        payload=dict(request.POST.items()),
                    )
            except ValidationError as error:
                form.add_error(None, error.messages[0])
            else:
                messages.success(request, "Série registrada.")
                return redirect("training:session_active", session_id=session.id)

    return render(
        request,
        "training/session_active.html",
        {
            "session": session,
            "active_exercise": active_exercise,
            "latest_set": latest_set,
            "rest_seconds": latest_set.session_exercise.rest_seconds_snapshot
            if latest_set
            else None,
            "next_set_number": active_exercise.completed_sets.count() + 1
            if active_exercise
            else None,
            "form": form,
        },
    )


@require_POST
@login_required
def session_pause(request: HttpRequest, session_id) -> HttpResponse:
    return _session_lifecycle_action(
        request,
        session_id,
        pause_workout_session,
        "Treino pausado.",
    )


@require_POST
@login_required
def session_skip_set(request: HttpRequest, session_id) -> HttpResponse:
    onboarding_response = require_completed_onboarding(request)
    if onboarding_response:
        return onboarding_response

    session = get_workout_session_for_user(user=request.user, session_id=session_id)
    if session is None:
        raise Http404("Sessão não encontrada.")
    active_exercise = _get_active_session_exercise(session)
    if active_exercise is None:
        messages.error(request, "Nenhuma série ativa para pular.")
        return redirect("training:session_active", session_id=session.id)
    try:
        client_generated_id = _posted_client_generated_id(request)
        skip_completed_set(
            user=request.user,
            session_exercise=active_exercise,
            set_number=_posted_set_number(request, active_exercise),
            client_generated_id=client_generated_id,
        )
        if client_generated_id:
            record_completed_sync_operation(
                user=request.user,
                client_operation_id=client_generated_id,
                entity_type="completed_set",
                entity_client_id=str(client_generated_id),
                operation_type=SyncOperation.OperationType.CREATE,
                payload=dict(request.POST.items()),
            )
    except ValidationError as error:
        messages.error(request, error.messages[0])
    else:
        messages.success(request, "Série pulada.")
    return redirect("training:session_active", session_id=session.id)


@require_POST
@login_required
def session_skip_exercise(request: HttpRequest, session_id) -> HttpResponse:
    onboarding_response = require_completed_onboarding(request)
    if onboarding_response:
        return onboarding_response

    session = get_workout_session_for_user(user=request.user, session_id=session_id)
    if session is None:
        raise Http404("Sessão não encontrada.")
    active_exercise = _get_active_session_exercise(session)
    if active_exercise is None:
        messages.error(request, "Nenhum exercício ativo para pular.")
        return redirect("training:session_active", session_id=session.id)
    try:
        skip_session_exercise(user=request.user, session_exercise=active_exercise)
    except ValidationError as error:
        messages.error(request, error.messages[0])
    else:
        messages.success(request, "Exercício pulado.")
    return redirect("training:session_active", session_id=session.id)


@require_POST
@login_required
def session_resume(request: HttpRequest, session_id) -> HttpResponse:
    return _session_lifecycle_action(
        request,
        session_id,
        resume_workout_session,
        "Treino retomado.",
    )


@require_POST
@login_required
def session_cancel(request: HttpRequest, session_id) -> HttpResponse:
    response = _session_lifecycle_action(
        request,
        session_id,
        cancel_workout_session,
        "Treino cancelado. Seus registros foram preservados.",
    )
    if response.status_code == 302:
        return redirect("core:home")
    return response


@require_POST
@login_required
def session_complete(request: HttpRequest, session_id) -> HttpResponse:
    onboarding_response = require_completed_onboarding(request)
    if onboarding_response:
        return onboarding_response

    session = get_workout_session_for_user(user=request.user, session_id=session_id)
    if session is None:
        raise Http404("Sessão não encontrada.")
    try:
        complete_workout_session(user=request.user, session=session)
    except ValidationError as error:
        messages.error(request, error.messages[0])
        return redirect("training:session_active", session_id=session.id)
    return redirect("training:session_summary", session_id=session.id)


@login_required
def session_summary(request: HttpRequest, session_id) -> HttpResponse:
    onboarding_response = require_completed_onboarding(request)
    if onboarding_response:
        return onboarding_response

    session = get_workout_session_for_user(user=request.user, session_id=session_id)
    if session is None:
        raise Http404("Sessão não encontrada.")
    return render(request, "training/session_summary.html", {"session": session})


def _session_lifecycle_action(request, session_id, action, success_message: str) -> HttpResponse:
    onboarding_response = require_completed_onboarding(request)
    if onboarding_response:
        return onboarding_response

    session = get_workout_session_for_user(user=request.user, session_id=session_id)
    if session is None:
        raise Http404("Sessão não encontrada.")
    try:
        action(user=request.user, session=session)
    except ValidationError as error:
        messages.error(request, error.messages[0])
    else:
        messages.success(request, success_message)
    return redirect("training:session_active", session_id=session.id)


def _get_active_session_exercise(session: WorkoutSession) -> SessionExercise | None:
    exercises = list(session.exercise_snapshots.all())
    active = next(
        (exercise for exercise in exercises if exercise.status == SessionExercise.Status.ACTIVE),
        None,
    )
    if active:
        return active
    return next(
        (exercise for exercise in exercises if exercise.status == SessionExercise.Status.PENDING),
        None,
    )


def _posted_set_number(request: HttpRequest, active_exercise: SessionExercise) -> int:
    try:
        return int(request.POST.get("set_number", ""))
    except ValueError:
        return active_exercise.completed_sets.count() + 1


def _posted_client_generated_id(request: HttpRequest) -> UUID | None:
    value = request.POST.get("client_generated_id", "").strip()
    if not value:
        return None
    try:
        return UUID(value)
    except ValueError as error:
        raise ValidationError("Identificador offline inválido.") from error
