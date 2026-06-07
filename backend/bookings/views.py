import json
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from .models import Booking, Dispute, Review
from .serializers import (
    BookingCreateSerializer, BookingListSerializer, BookingDetailSerializer,
    BookingStatusUpdateSerializer, DisputeSerializer, ReviewSerializer,
)
from services.models import ServiceProvider


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


class MockPaymentView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        booking_id = request.data.get('booking_id')
        payment_method = request.data.get('payment_method', 'KHALTI')

        if not booking_id:
            return Response({"error": "booking_id required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            booking = Booking.objects.get(id=booking_id)
        except Booking.DoesNotExist:
            return Response({"error": "Booking not found"}, status=status.HTTP_404_NOT_FOUND)

        if booking.payment_status != 'UNPAID':
            return Response({"error": "Booking already paid"}, status=status.HTTP_400_BAD_REQUEST)

        booking.payment_status = 'PAID'
        booking.payment_method = payment_method
        booking.status = 'CONFIRMED'
        booking.save()

        return Response({
            "success": True,
            "message": f"Payment of NPR {booking.agreed_price} via {payment_method} completed (mock)",
            "booking_id": str(booking.id),
            "payment_status": booking.payment_status,
            "status": booking.status,
            "note": "This is a mock payment. Real Khalti API not integrated (OJT project budget constraints).",
        })
