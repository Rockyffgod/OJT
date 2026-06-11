import uuid
from django.db import models
from accounts.models import User


class KarmaEvent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='karma_events', null=True, blank=True)
    event_type = models.CharField(max_length=100)
    points = models.IntegerField(default=0)
    description = models.TextField(default='')
    reference_id = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.event_type}: {self.points} pts for {self.user.email}"
