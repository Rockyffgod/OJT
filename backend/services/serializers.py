from rest_framework import serializers
from .models import ServiceCategory, ServiceProvider


class ServiceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceCategory
        fields = '__all__'


class ServiceProviderListSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    user_photo = serializers.ImageField(source='user.profile_photo', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = ServiceProvider
        fields = ['id', 'user_email', 'user_name', 'user_photo', 'profession', 'category_name',
                  'experience', 'hourly_rate', 'service_area', 'availability_status',
                  'karma_points', 'karma_level', 'average_rating', 'total_jobs_completed',
                  'is_available', 'latitude', 'longitude']

    def get_user_name(self, obj):
        name = obj.user.get_full_name()
        if not name:
            return obj.user.username.replace('_', ' ').title()
        return name


class ServiceProviderDetailSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = ServiceProvider
        fields = '__all__'

    def get_user(self, obj):
        return {
            'id': str(obj.user.id),
            'email': obj.user.email,
            'username': obj.user.username,
            'phone': obj.user.phone,
            'profile_photo': obj.user.profile_photo.url if obj.user.profile_photo else None,
        }


class ServiceProviderUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceProvider
        fields = ['bio', 'profession', 'category', 'experience', 'hourly_rate',
                  'service_area', 'skills', 'languages', 'portfolio_photos',
                  'is_available', 'latitude', 'longitude']
