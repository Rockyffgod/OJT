from rest_framework import generics, permissions
from django.utils import timezone
from .models import Message
from .serializers import MessageSerializer


class MessageListCreateView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer

    def get_queryset(self):
        booking_id = self.request.query_params.get('booking')
        if booking_id:
            return Message.objects.filter(booking_id=booking_id)
        return Message.objects.filter(booking__customer=self.request.user) | \
               Message.objects.filter(booking__provider__user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)


class MessageMarkReadView(generics.UpdateAPIView):
    serializer_class = MessageSerializer

    def get_queryset(self):
        return Message.objects.filter(booking__provider__user=self.request.user) | \
               Message.objects.filter(booking__customer=self.request.user)

    def perform_update(self, serializer):
        serializer.save(read_at=timezone.now())
