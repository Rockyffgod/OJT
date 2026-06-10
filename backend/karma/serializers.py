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
    user_name = serializers.SerializerMethodField()
    user_name_nepali = serializers.SerializerMethodField()
    user_photo = serializers.ImageField(source='user.profile_photo', read_only=True)

    class Meta:
        model = ServiceProvider
        fields = ['id', 'user_name', 'user_name_nepali', 'user_photo', 'profession', 'karma_points',
                  'karma_level', 'average_rating', 'total_jobs_completed']

    def get_user_name(self, obj):
        name = obj.user.get_full_name()
        if not name:
            return obj.user.username.replace('_', ' ').title()
        return name

    def get_user_name_nepali(self, obj):
        name = obj.user.name_nepali
        if not name:
            return self.get_user_name(obj)
        return name
