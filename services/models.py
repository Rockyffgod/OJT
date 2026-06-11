import uuid
from django.db import models
from accounts.models import User, VerificationStatus, IdDocumentType


class ServiceCategory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    name_nepali = models.CharField(max_length=100, null=True, blank=True)
    icon = models.CharField(max_length=50, default='🔧')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Service categories'

    def __str__(self):
        return self.name


class AvailabilityStatus(models.TextChoices):
    AVAILABLE_NOW = 'AVAILABLE_NOW', 'Available Now'
    BUSY = 'BUSY', 'Busy'
    OFFLINE = 'OFFLINE', 'Offline'


class KarmaLevel(models.TextChoices):
    NONE = 'NONE', 'None'
    BRONZE = 'BRONZE', 'Bronze'
    SILVER = 'SILVER', 'Silver'
    GOLD = 'GOLD', 'Gold'
    PLATINUM = 'PLATINUM', 'Platinum'


class ServiceProvider(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='service_provider')
    bio = models.TextField(null=True, blank=True)
    profession = models.CharField(max_length=100, default='')
    category = models.ForeignKey(ServiceCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='providers')
    experience = models.IntegerField(default=0)
    hourly_rate = models.IntegerField(null=True, blank=True)
    service_area = models.CharField(max_length=200, default='')
    skills = models.JSONField(default=list, blank=True)
    languages = models.JSONField(default=list, blank=True)
    portfolio_photos = models.JSONField(default=list, blank=True)
    id_document_url = models.URLField(null=True, blank=True)
    id_document_type = models.CharField(max_length=50, choices=IdDocumentType.choices, null=True, blank=True)
    selfie_url = models.URLField(null=True, blank=True)
    verification_status = models.CharField(max_length=20, choices=VerificationStatus.choices, default=VerificationStatus.PENDING)
    verified_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(null=True, blank=True)
    is_available = models.BooleanField(default=True)
    availability_status = models.CharField(max_length=20, choices=AvailabilityStatus.choices, default=AvailabilityStatus.OFFLINE)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    karma_points = models.IntegerField(default=0)
    karma_level = models.CharField(max_length=20, choices=KarmaLevel.choices, default=KarmaLevel.NONE)
    average_rating = models.FloatField(default=0)
    total_jobs_completed = models.IntegerField(default=0)
    commission_rate = models.FloatField(default=0.10)
    profile_completion = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email} - {self.profession}"
