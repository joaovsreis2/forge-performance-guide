from django.db import transaction

from .models import User, UserPreference, UserProfile


@transaction.atomic
def register_user(*, email: str, password: str, display_name: str = "") -> User:
    return User.objects.create_user(
        email=email,
        password=password,
        display_name=display_name.strip(),
    )


@transaction.atomic
def complete_profile_step(*, user: User, display_name: str) -> None:
    user.display_name = display_name.strip()
    user.save(update_fields=["display_name", "updated_at"])
    user.profile.onboarding_status = UserProfile.OnboardingStatus.TRAINING_GOAL
    user.profile.save(update_fields=["onboarding_status", "updated_at"])


@transaction.atomic
def complete_training_goal_step(*, profile: UserProfile, training_goal: str) -> None:
    profile.training_goal = training_goal
    profile.onboarding_status = UserProfile.OnboardingStatus.PHYSICAL_INFO
    profile.save(update_fields=["training_goal", "onboarding_status", "updated_at"])


@transaction.atomic
def complete_physical_info_step(
    *,
    profile: UserProfile,
    birth_date,
    height_cm,
    current_weight_kg,
) -> None:
    profile.birth_date = birth_date
    profile.height_cm = height_cm
    profile.current_weight_kg = current_weight_kg
    profile.onboarding_status = UserProfile.OnboardingStatus.PLAN_SETUP
    profile.save(
        update_fields=[
            "birth_date",
            "height_cm",
            "current_weight_kg",
            "onboarding_status",
            "updated_at",
        ]
    )


@transaction.atomic
def acknowledge_plan_setup(*, profile: UserProfile) -> None:
    from forge.training.services import assign_default_training_plan

    assign_default_training_plan(profile.user)
    profile.onboarding_status = UserProfile.OnboardingStatus.COMPLETED
    profile.save(update_fields=["onboarding_status", "updated_at"])


@transaction.atomic
def update_account_profile(
    *,
    user: User,
    display_name: str,
    training_goal: str,
    birth_date,
    height_cm,
    current_weight_kg,
) -> None:
    user.display_name = display_name.strip()
    user.save(update_fields=["display_name", "updated_at"])

    profile = user.profile
    profile.training_goal = training_goal
    profile.birth_date = birth_date
    profile.height_cm = height_cm
    profile.current_weight_kg = current_weight_kg
    profile.full_clean()
    profile.save(
        update_fields=[
            "training_goal",
            "birth_date",
            "height_cm",
            "current_weight_kg",
            "updated_at",
        ]
    )


@transaction.atomic
def update_user_preferences(
    *, preferences: UserPreference, cleaned_data: dict[str, object]
) -> None:
    for field, value in cleaned_data.items():
        setattr(preferences, field, value)
    preferences.full_clean()
    preferences.save(
        update_fields=[
            "timezone",
            "weight_unit",
            "distance_unit",
            "appearance",
            "rest_timer_sound_enabled",
            "rest_timer_vibration_enabled",
            "updated_at",
        ]
    )
