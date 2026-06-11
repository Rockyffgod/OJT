from rest_framework import generics, status
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(
            Q(user=self.request.user) | Q(is_global=True)
        )


class NotificationMarkReadView(generics.UpdateAPIView):
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user, is_global=False)

    def perform_update(self, serializer):
        serializer.save(read_at=timezone.now())


class NotificationMarkAllReadView(generics.GenericAPIView):
    def post(self, request):
        Notification.objects.filter(
            user=request.user, read_at__isnull=True, is_global=False
        ).update(read_at=timezone.now())
        return Response({'status': 'all marked as read'}, status=status.HTTP_200_OK)
