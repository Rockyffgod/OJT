from rest_framework import serializers
from .models import KarmaEvent
from services.models import ServiceProvider


class KarmaEventSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = KarmaEvent
        fields = '__all__'
        read_only_fields = ['id', 'user', 'created_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class LeaderboardEntrySerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_photo = serializers.ImageField(source='user.profile_photo', read_only=True)

    class Meta:
        model = ServiceProvider
        fields = ['id', 'user_name', 'user_photo', 'profession', 'karma_points',
                  'karma_level', 'average_rating', 'total_jobs_completed']
