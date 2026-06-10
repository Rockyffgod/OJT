import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _


class AccountType(models.TextChoices):
    CUSTOMER = 'CUSTOMER', 'Customer'
    PROVIDER = 'PROVIDER', 'Provider'
    ADMIN = 'ADMIN', 'Admin'


class IdDocumentType(models.TextChoices):
    CITIZENSHIP_CARD = 'CITIZENSHIP_CARD', 'Citizenship Card'
    NATIONAL_ID = 'NATIONAL_ID', 'National ID'
    BIRTH_CERTIFICATE = 'BIRTH_CERTIFICATE', 'Birth Certificate'
    PASSPORT = 'PASSPORT', 'Passport'


class VerificationStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    SUBMITTED = 'SUBMITTED', 'Submitted'
    APPROVED = 'APPROVED', 'Approved'
    VERIFIED = 'VERIFIED', 'Verified'
    REJECTED = 'REJECTED', 'Rejected'


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, unique=True, null=True, blank=True)
    profile_photo = models.ImageField(upload_to='profiles/', null=True, blank=True)
    account_type = models.CharField(max_length=20, choices=AccountType.choices, default=AccountType.CUSTOMER)
    is_phone_verified = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=False)
    city = models.CharField(max_length=100, default='')
    name_nepali = models.CharField(max_length=300, blank=True, default='')
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def save(self, *args, **kwargs):
        if self.account_type == AccountType.ADMIN and not self.is_staff:
            self.is_staff = True
        super().save(*args, **kwargs)

    def __str__(self):
        return self.email


class EmergencyContact(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='emergency_contacts')
    name = models.CharField(max_length=255, default='')
    phone = models.CharField(max_length=20, default='')
    relationship = models.CharField(max_length=100, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Emergency contacts'

    def __str__(self):
        return f"{self.name} ({self.relationship})"


class SOSAlert(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    triggered_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sos_alerts')
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    message = models.TextField(null=True, blank=True)
    resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"SOS by {self.triggered_by.email} at {self.created_at}"
