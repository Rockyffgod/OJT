from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    is_read = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ['id', 'user', 'title', 'body', 'type', 'data',
                  'reference_id', 'link', 'read_at', 'is_read', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']

    def get_is_read(self, obj):
        return obj.read_at is not None
