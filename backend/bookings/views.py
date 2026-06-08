from rest_framework import generics, permissions
from .models import Booking, Dispute, Review
from .serializers import (
    BookingCreateSerializer, BookingListSerializer, BookingDetailSerializer,
    BookingStatusUpdateSerializer, DisputeSerializer, ReviewSerializer,
)


class BookingListCreateView(generics.ListCreateAPIView):
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return BookingCreateSerializer
        return BookingListSerializer

    def get_queryset(self):
        user = self.request.user
        if user.account_type == 'PROVIDER':
            return Booking.objects.filter(provider__user=user)
        return Booking.objects.filter(customer=user)


class BookingDetailView(generics.RetrieveUpdateAPIView):
    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return BookingStatusUpdateSerializer
        return BookingDetailSerializer

    def get_queryset(self):
        user = self.request.user
        if user.account_type == 'PROVIDER':
            return Booking.objects.filter(provider__user=user)
        return Booking.objects.filter(customer=user)


class DisputeCreateView(generics.CreateAPIView):
    serializer_class = DisputeSerializer
    queryset = Dispute.objects.all()

    def perform_create(self, serializer):
        serializer.save(raised_by=self.request.user)


class DisputeListView(generics.ListAPIView):
    serializer_class = DisputeSerializer

    def get_queryset(self):
        user = self.request.user
        if user.account_type == 'ADMIN':
            return Dispute.objects.all()
        if user.account_type == 'PROVIDER':
            return Dispute.objects.filter(booking__provider__user=user)
        return Dispute.objects.filter(raised_by=user)


class ReviewCreateView(generics.CreateAPIView):
    serializer_class = ReviewSerializer
    queryset = Review.objects.all()

    def perform_create(self, serializer):
        booking = serializer.validated_data['booking']
        serializer.save(
            customer=self.request.user,
            provider=booking.provider
        )


class ReviewListView(generics.ListAPIView):
    serializer_class = ReviewSerializer

    def get_queryset(self):
        provider_id = self.request.query_params.get('provider')
        if provider_id:
            return Review.objects.filter(provider_id=provider_id)
        return Review.objects.all()
