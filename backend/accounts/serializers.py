from rest_framework import serializers
from .models import User, EmergencyContact, SOSAlert


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'phone', 'profile_photo', 'account_type',
                  'is_phone_verified', 'is_email_verified', 'city', 'date_joined', 'first_name', 'last_name', 'full_name']
        read_only_fields = ['id', 'date_joined']

    def get_full_name(self, obj):
        return f'{obj.first_name} {obj.last_name}'.strip() or obj.username

    def update(self, instance, validated_data):
        full_name = self.context['request'].data.get('full_name')
        if full_name:
            parts = full_name.split(' ', 1)
            instance.first_name = parts[0]
            instance.last_name = parts[1] if len(parts) > 1 else ''
        return super().update(instance, validated_data)


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    full_name = serializers.CharField(required=False, write_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'password', 'phone', 'account_type', 'first_name', 'last_name', 'full_name']
        extra_kwargs = {
            'username': {'required': False},
        }

    def validate_password(self, value):
        score = 0
        if len(value) >= 8:
            score += 1
        if any(c.isupper() for c in value):
            score += 1
        if any(c.islower() for c in value):
            score += 1
        if any(c.isdigit() for c in value):
            score += 1
        if any(not c.isalnum() for c in value):
            score += 1

        if score <= 2:
            raise serializers.ValidationError(
                "Password is too weak. It must be at least 8 characters and include a mix of uppercase letters, numbers, and symbols."
            )
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        full_name = validated_data.pop('full_name', '')
        first_name = validated_data.pop('first_name', '')
        last_name = validated_data.pop('last_name', '')

        # Auto-generate username from email if not provided
        if not validated_data.get('username'):
            validated_data['username'] = validated_data['email'].split('@')[0]

        user = User(**validated_data)
        user.set_password(password)

        if first_name:
            user.first_name = first_name
        if last_name:
            user.last_name = last_name

        if full_name and not (first_name or last_name):
            parts = full_name.split(' ', 1)
            user.first_name = parts[0]
            user.last_name = parts[1] if len(parts) > 1 else ''

        user.save()
        return user


class EmergencyContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmergencyContact
        fields = '__all__'
        read_only_fields = ['id', 'user', 'created_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class SOSAlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = SOSAlert
        fields = '__all__'
        read_only_fields = ['id', 'triggered_by', 'created_at']

    def create(self, validated_data):
        validated_data['triggered_by'] = self.context['request'].user
        return super().create(validated_data)
