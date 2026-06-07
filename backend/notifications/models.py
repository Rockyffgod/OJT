import uuid
from django.db import models
from accounts.models import User


class Notification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255, default='')
    body = models.TextField(default='')
    type = models.CharField(max_length=100, default='')
    data = models.JSONField(null=True, blank=True)
    reference_id = models.CharField(max_length=255, null=True, blank=True)
    link = models.CharField(max_length=500, null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.user.email}"

    @property
    def is_read(self):
        return self.read_at is not None
