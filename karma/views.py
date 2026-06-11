from rest_framework import generics, permissions
from .models import KarmaEvent
from .serializers import KarmaEventSerializer, LeaderboardEntrySerializer
from services.models import ServiceProvider


class KarmaEventListView(generics.ListAPIView):
    serializer_class = KarmaEventSerializer

    def get_queryset(self):
        return KarmaEvent.objects.filter(user=self.request.user)


class LeaderboardView(generics.ListAPIView):
    serializer_class = LeaderboardEntrySerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return ServiceProvider.objects.filter(
            verification_status='APPROVED',
            user__profile_photo__isnull=False,
        ).order_by('-karma_points')[:50]
