import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from accounts.models import User
from services.models import ServiceProvider


class BookingStatus(models.TextChoices):
    REQUESTED = 'REQUESTED', 'Requested'
    CONFIRMED = 'CONFIRMED', 'Confirmed'
    IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
    COMPLETED = 'COMPLETED', 'Completed'
    CANCELLED = 'CANCELLED', 'Cancelled'
    REJECTED = 'REJECTED', 'Rejected'
    DISPUTED = 'DISPUTED', 'Disputed'


class PaymentMethod(models.TextChoices):
    CASH = 'CASH', 'Cash'


class PaymentStatus(models.TextChoices):
    UNPAID = 'UNPAID', 'Unpaid'
    PAID = 'PAID', 'Paid'
    HELD = 'HELD', 'Held'
    RELEASED = 'RELEASED', 'Released'
    REFUNDED = 'REFUNDED', 'Refunded'


class Booking(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='customer_bookings')
    provider = models.ForeignKey(ServiceProvider, on_delete=models.CASCADE, related_name='provider_bookings')
    status = models.CharField(max_length=20, choices=BookingStatus.choices, default=BookingStatus.REQUESTED)
    job_description = models.TextField(default='')
    job_address = models.TextField(default='')
    scheduled_date = models.DateTimeField()
    job_photos = models.JSONField(default=list, blank=True)
    agreed_price = models.IntegerField(null=True, blank=True)
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices, null=True, blank=True)
    payment_status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.UNPAID)
    payment_held = models.IntegerField(null=True, blank=True)
    vat_amount = models.IntegerField(null=True, blank=True)
    commission_amount = models.IntegerField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancel_reason = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    provider_lat = models.FloatField(null=True, blank=True)
    provider_lng = models.FloatField(null=True, blank=True)
    provider_location_updated_at = models.DateTimeField(null=True, blank=True)
    arrived_at = models.DateTimeField(null=True, blank=True)
    customer_lat = models.FloatField(null=True, blank=True)
    customer_lng = models.FloatField(null=True, blank=True)
    customer_location_updated_at = models.DateTimeField(null=True, blank=True)
    destination_lat = models.FloatField(null=True, blank=True)
    destination_lng = models.FloatField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if self.job_address:
            needs_geocode = False
            if not self.destination_lat or not self.destination_lng:
                needs_geocode = True
            elif self.pk:
                try:
                    orig = Booking.objects.get(pk=self.pk)
                    if orig.job_address != self.job_address:
                        needs_geocode = True
                except Booking.DoesNotExist:
                    needs_geocode = True
            if needs_geocode:
                import requests
                try:
                    resp = requests.get(
                        'https://nominatim.openstreetmap.org/search',
                        params={'q': self.job_address, 'format': 'json', 'limit': 1},
                        headers={'User-Agent': 'HamroKarma/1.0'},
                        timeout=5
                    )
                    if resp.ok:
                        results = resp.json()
                        if results:
                            self.destination_lat = float(results[0]['lat'])
                            self.destination_lng = float(results[0]['lon'])
                except Exception:
                    pass
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Booking {self.id} - {self.status}"


class ReportType(models.TextChoices):
    NO_SHOW = 'NO_SHOW', 'No Show'
    POOR_SERVICE = 'POOR_SERVICE', 'Poor Service'
    OVERCHARGED = 'OVERCHARGED', 'Overcharged'
    INAPPROPRIATE = 'INAPPROPRIATE', 'Inappropriate Behavior'
    DIDNT_PAY = 'DIDNT_PAY', 'Did Not Pay'
    DAMAGE_TO_PROPERTY = 'DAMAGE_TO_PROPERTY', 'Damage to Property'
    SCAM = 'SCAM', 'Scam/Fraud'
    FAKE_PROFILE = 'FAKE_PROFILE', 'Fake Profile'
    OTHER = 'OTHER', 'Other'


class ReportStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    REVIEWED = 'REVIEWED', 'Reviewed'
    RESOLVED = 'RESOLVED', 'Resolved'
    DISMISSED = 'DISMISSED', 'Dismissed'


class Report(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reporter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports_filed')
    reported_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports_against')
    booking = models.ForeignKey(Booking, on_delete=models.SET_NULL, null=True, blank=True, related_name='reports')
    report_type = models.CharField(max_length=30, choices=ReportType.choices)
    description = models.TextField(default='')
    status = models.CharField(max_length=20, choices=ReportStatus.choices, default=ReportStatus.PENDING)
    admin_note = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Report {self.id} - {self.report_type} by {self.reporter.email}"


class DisputeReason(models.TextChoices):
    NO_SHOW = 'NO_SHOW', 'No Show'
    POOR_QUALITY = 'POOR_QUALITY', 'Poor Quality'
    OVERCHARGED = 'OVERCHARGED', 'Overcharged'
    INAPPROPRIATE_BEHAVIOR = 'INAPPROPRIATE_BEHAVIOR', 'Inappropriate Behavior'
    DAMAGE_TO_PROPERTY = 'DAMAGE_TO_PROPERTY', 'Damage to Property'
    OTHER = 'OTHER', 'Other'


class DisputeStatus(models.TextChoices):
    OPEN = 'OPEN', 'Open'
    UNDER_REVIEW = 'UNDER_REVIEW', 'Under Review'
    RESOLVED = 'RESOLVED', 'Resolved'
    CLOSED = 'CLOSED', 'Closed'


class Dispute(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='dispute')
    raised_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='raised_disputes')
    reason = models.CharField(max_length=50, choices=DisputeReason.choices)
    description = models.TextField(default='')
    photos = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=20, choices=DisputeStatus.choices, default=DisputeStatus.OPEN)
    resolution = models.TextField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Dispute {self.id} - {self.reason}"


class Review(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='review')
    provider = models.ForeignKey(ServiceProvider, on_delete=models.CASCADE, related_name='reviews')
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews_given')
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(null=True, blank=True)
    provider_reply = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review {self.rating}/5 for {self.provider}"
