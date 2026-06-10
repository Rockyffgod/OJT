from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta

from notifications.models import Notification
from .models import FTLAlert


FTL_TYPE_LABELS = {
    'PERSON': 'Missing Person',
    'PET': 'Lost Pet',
    'ITEM': 'Lost Item',
    'VEHICLE': 'Vehicle',
}


@receiver(post_save, sender=FTLAlert)
def create_ftl_alert_notification(sender, instance, created, **kwargs):
    if not created:
        return

    # Spam guard: at most one global FTL notification per 30 minutes
    recent = Notification.objects.filter(
        type='ftl_new_alert',
        is_global=True,
        created_at__gte=timezone.now() - timedelta(minutes=30),
    ).exists()
    if recent:
        return

    label = FTL_TYPE_LABELS.get(instance.type, 'Alert')

    Notification.objects.create(
        user=instance.user,
        title=f'New {label}: {instance.title}',
        body=instance.description[:200],
        type='ftl_new_alert',
        is_global=True,
        reference_id=str(instance.id),
        link=f'/ftl/{instance.id}',
        data={
            'ftl_type': instance.type,
            'image_url': instance.image_url or '',
        },
    )
