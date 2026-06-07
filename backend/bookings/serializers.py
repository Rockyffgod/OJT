from rest_framework import serializers
from .models import Booking, Dispute, Review


class BookingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ['provider', 'job_description', 'job_address', 'scheduled_date', 'job_photos', 'agreed_price']

    def create(self, validated_data):
        validated_data['customer'] = self.context['request'].user
        return super().create(validated_data)


class BookingListSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.username', read_only=True)
    provider_name = serializers.CharField(source='provider.user.username', read_only=True)
    provider_profession = serializers.CharField(source='provider.profession', read_only=True)

    class Meta:
        model = Booking
        fields = ['id', 'customer_name', 'provider_name', 'provider_profession',
                  'status', 'job_description', 'scheduled_date', 'agreed_price',
                  'payment_status', 'created_at', 'updated_at']


class BookingDetailSerializer(serializers.ModelSerializer):
    customer = serializers.SerializerMethodField()
    provider = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = '__all__'

    def get_customer(self, obj):
        return {'id': str(obj.customer.id), 'username': obj.customer.username, 'email': obj.customer.email,
                'phone': obj.customer.phone}

    def get_provider(self, obj):
        return {'id': str(obj.provider.id), 'username': obj.provider.user.username,
                'profession': obj.provider.profession, 'phone': obj.provider.user.phone}


class BookingStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ['status', 'cancel_reason']


class DisputeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dispute
        fields = '__all__'
        read_only_fields = ['id', 'raised_by', 'status', 'resolution', 'resolved_at', 'created_at']


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = '__all__'
        read_only_fields = ['id', 'provider', 'customer', 'created_at']
