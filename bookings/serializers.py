from rest_framework import serializers
from .models import Booking, Dispute, Review, Report


class BookingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ['provider', 'job_description', 'job_address', 'scheduled_date', 'job_photos', 'agreed_price',
                  'payment_method', 'commission_amount']

    def create(self, validated_data):
        validated_data['customer'] = self.context['request'].user
        return super().create(validated_data)


class BookingListSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.username', read_only=True)
    customer_id = serializers.UUIDField(source='customer.id', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone', read_only=True)
    customer_email = serializers.EmailField(source='customer.email', read_only=True)
    customer_avatar = serializers.SerializerMethodField()
    customer_full_name = serializers.SerializerMethodField()
    provider_id = serializers.UUIDField(source='provider.id', read_only=True)
    provider_user_id = serializers.UUIDField(source='provider.user.id', read_only=True)
    provider_name = serializers.CharField(source='provider.user.username', read_only=True)
    provider_profession = serializers.CharField(source='provider.profession', read_only=True)
    provider_avatar = serializers.SerializerMethodField()
    provider_full_name = serializers.SerializerMethodField()
    provider_rating = serializers.FloatField(source='provider.average_rating', read_only=True)

    class Meta:
        model = Booking
        fields = ['id', 'customer_name', 'customer_id', 'customer_phone', 'customer_email',
                  'customer_avatar', 'customer_full_name',
                  'provider_id', 'provider_user_id', 'provider_name', 'provider_profession',
                  'provider_avatar', 'provider_full_name', 'provider_rating',
                  'status', 'job_description', 'scheduled_date', 'agreed_price',
                  'payment_status', 'payment_method', 'created_at', 'updated_at',
                  'provider_lat', 'provider_lng', 'provider_location_updated_at',
                  'customer_lat', 'customer_lng', 'customer_location_updated_at',
                  'destination_lat', 'destination_lng',
                  'arrived_at']

    def get_provider_avatar(self, obj):
        photo = obj.provider.user.profile_photo
        return photo.url if photo else None

    def get_provider_full_name(self, obj):
        return obj.provider.user.get_full_name() or obj.provider.user.username

    def get_customer_avatar(self, obj):
        photo = obj.customer.profile_photo
        return photo.url if photo else None

    def get_customer_full_name(self, obj):
        return obj.customer.get_full_name() or obj.customer.username


class BookingDetailSerializer(serializers.ModelSerializer):
    customer = serializers.SerializerMethodField()
    provider = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = '__all__'

    def get_customer(self, obj):
        return {'id': str(obj.customer.id), 'username': obj.customer.username, 'email': obj.customer.email,
                'phone': obj.customer.phone, 'full_name': obj.customer.get_full_name(),
                'city': obj.customer.city, 'avatar_url': obj.customer.profile_photo.url if obj.customer.profile_photo else None}

    def get_provider(self, obj):
        return {'id': str(obj.provider.id), 'username': obj.provider.user.username,
                'profession': obj.provider.profession, 'phone': obj.provider.user.phone,
                'full_name': obj.provider.user.get_full_name(), 'avatar_url': obj.provider.user.profile_photo.url if obj.provider.user.profile_photo else None}


class BookingStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ['status', 'cancel_reason']


class BookingLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ['provider_lat', 'provider_lng', 'provider_location_updated_at', 'arrived_at']
        read_only_fields = ['provider_location_updated_at', 'arrived_at']


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


class ReportSerializer(serializers.ModelSerializer):
    reporter_name = serializers.CharField(source='reporter.get_full_name', read_only=True)
    reported_name = serializers.CharField(source='reported_user.get_full_name', read_only=True)
    reported_email = serializers.EmailField(source='reported_user.email', read_only=True)

    class Meta:
        model = Report
        fields = '__all__'
        read_only_fields = ['id', 'reporter', 'status', 'admin_note', 'created_at']


class ReportCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ['reported_user', 'booking', 'report_type', 'description']

    def validate_report_type(self, value):
        valid = [v.value for v in Report.ReportType]
        if value not in valid:
            raise serializers.ValidationError(f"Invalid report type. Choose from: {', '.join(valid)}")
        return value
