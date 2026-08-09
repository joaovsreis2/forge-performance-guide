from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import User, UserPreference, UserProfile


@receiver(post_save, sender=User)
def create_identity_records(
    sender: type[User],
    instance: User,
    created: bool,
    **kwargs: object,
) -> None:
    del sender, kwargs
    if not created:
        return

    UserProfile.objects.get_or_create(user=instance)
    UserPreference.objects.get_or_create(user=instance)
