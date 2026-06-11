import uuid
from django.db import models
from django.utils import timezone
from datetime import timedelta
from accounts.models import User


class FTLType(models.TextChoices):
    PERSON = 'PERSON', 'Person'
    PET = 'PET', 'Pet'
    ITEM = 'ITEM', 'Item'
    VEHICLE = 'VEHICLE', 'Vehicle'


class FTLContactMethod(models.TextChoices):
    PHONE = 'PHONE', 'Phone'
    EMAIL = 'EMAIL', 'Email'
    IN_APP = 'IN_APP', 'In App'


class FTLStatus(models.TextChoices):
    OPEN = 'OPEN', 'Open'
    MATCHED = 'MATCHED', 'Matched'
    CLOSED = 'CLOSED', 'Closed'
    EXPIRED = 'EXPIRED', 'Expired'
    REMOVED = 'REMOVED', 'Removed'


def default_expiry():
    return timezone.now() + timedelta(days=30)


class FTLAlert(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ftl_alerts')
    type = models.CharField(max_length=20, choices=FTLType.choices)
    title = models.CharField(max_length=255, default='')
    description = models.TextField(default='')
    last_seen_location = models.CharField(max_length=255, default='')
    image_url = models.URLField(null=True, blank=True)
    image = models.ImageField(upload_to='ftl/', null=True, blank=True)
    photos = models.JSONField(default=list, blank=True)
    qr_code = models.URLField(null=True, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    contact_method = models.CharField(max_length=20, choices=FTLContactMethod.choices, default=FTLContactMethod.PHONE)
    contact_value = models.CharField(max_length=255, default='', blank=True)
    status = models.CharField(max_length=20, choices=FTLStatus.choices, default=FTLStatus.OPEN)
    expires_at = models.DateTimeField(default=default_expiry, null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_type_display()}: {self.title}"
