from rest_framework import serializers
from .models import Message


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'booking', 'sender', 'sender_name', 'text', 'photo_url', 'read_at', 'created_at']
        read_only_fields = ['id', 'sender', 'read_at', 'created_at']
