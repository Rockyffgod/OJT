from rest_framework import serializers


class JobMatcherInputSerializer(serializers.Serializer):
    query = serializers.CharField(help_text="Free-text job description, e.g. 'Need a plumber to fix a broken pipe in Kathmandu'")


class JobMatcherOutputSerializer(serializers.Serializer):
    profession = serializers.CharField()
    location = serializers.CharField()
    urgency = serializers.CharField()
    description = serializers.CharField()
    matched_providers = serializers.ListField(child=serializers.DictField(), required=False)


class FTLAssistInputSerializer(serializers.Serializer):
    description = serializers.CharField(help_text="Describe what's lost, e.g. 'Lost my brown Labrador near Ratna Park'")


class FTLAssistOutputSerializer(serializers.Serializer):
    type = serializers.CharField()
    title = serializers.CharField()
    description = serializers.CharField()
    last_seen_location = serializers.CharField()
    tags = serializers.ListField(child=serializers.CharField())


class ProfileEnhanceInputSerializer(serializers.Serializer):
    bio = serializers.CharField()
    skills = serializers.ListField(child=serializers.CharField(), required=False, default=[])
