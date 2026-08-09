from uuid import uuid4

from django.urls import resolve, reverse


def test_foundation_urls_are_configured() -> None:
    assert resolve(reverse("core:home")).view_name == "core:home"
    assert resolve(reverse("core:health")).view_name == "core:health"
    assert resolve(reverse("core:offline")).view_name == "core:offline"
    assert resolve(reverse("core:service_worker")).view_name == "core:service_worker"
    assert resolve(reverse("progress:overview")).view_name == "progress:overview"
    assert resolve(reverse("progress:recovery")).view_name == "progress:recovery"
    assert resolve(reverse("progress:measurement")).view_name == "progress:measurement"
    assert resolve(reverse("progress:habit_create")).view_name == "progress:habit_create"
    assert (
        resolve(reverse("progress:habit_entry", kwargs={"habit_id": uuid4()})).view_name
        == "progress:habit_entry"
    )
    assert resolve(reverse("training:plan")).view_name == "training:plan"
    assert (
        resolve(reverse("training:workout_preview", kwargs={"workout_id": uuid4()})).view_name
        == "training:workout_preview"
    )
    assert (
        resolve(reverse("training:workout_start", kwargs={"workout_id": uuid4()})).view_name
        == "training:workout_start"
    )
    assert (
        resolve(reverse("training:session_active", kwargs={"session_id": uuid4()})).view_name
        == "training:session_active"
    )
    assert (
        resolve(reverse("training:session_skip_set", kwargs={"session_id": uuid4()})).view_name
        == "training:session_skip_set"
    )
    assert (
        resolve(reverse("training:session_skip_exercise", kwargs={"session_id": uuid4()})).view_name
        == "training:session_skip_exercise"
    )
    assert (
        resolve(reverse("training:session_summary", kwargs={"session_id": uuid4()})).view_name
        == "training:session_summary"
    )
    assert resolve(reverse("accounts:account")).view_name == "accounts:account"
    assert resolve(reverse("accounts:register")).view_name == "accounts:register"
    assert resolve(reverse("accounts:signin")).view_name == "accounts:signin"
    assert resolve(reverse("accounts:logout")).view_name == "accounts:logout"
    assert resolve(reverse("accounts:password_reset")).view_name == "accounts:password_reset"
    assert (
        resolve(reverse("accounts:password_reset_done")).view_name == "accounts:password_reset_done"
    )
    assert (
        resolve(
            reverse(
                "accounts:password_reset_confirm",
                kwargs={"uidb64": "uid", "token": "token"},
            )
        ).view_name
        == "accounts:password_reset_confirm"
    )
    assert (
        resolve(reverse("accounts:password_reset_complete")).view_name
        == "accounts:password_reset_complete"
    )
    assert resolve(reverse("accounts:onboarding")).view_name == "accounts:onboarding"
    assert (
        resolve(reverse("accounts:onboarding_profile")).view_name == "accounts:onboarding_profile"
    )
    assert resolve(reverse("accounts:onboarding_goal")).view_name == "accounts:onboarding_goal"
    assert (
        resolve(reverse("accounts:onboarding_physical")).view_name == "accounts:onboarding_physical"
    )
    assert resolve(reverse("accounts:onboarding_plan")).view_name == "accounts:onboarding_plan"
    assert resolve(reverse("admin:index")).view_name == "admin:index"
