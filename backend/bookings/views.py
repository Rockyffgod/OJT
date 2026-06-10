from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Q
from .models import Booking, Dispute, Review, Report
from .serializers import (
    BookingCreateSerializer, BookingListSerializer, BookingDetailSerializer,
    BookingStatusUpdateSerializer, BookingLocationSerializer,
    DisputeSerializer, ReviewSerializer,
    ReportSerializer, ReportCreateSerializer,
)
from accounts.views import IsSuperAdmin


class BookingListCreateView(generics.ListCreateAPIView):
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return BookingCreateSerializer
        return BookingListSerializer

    def get_queryset(self):
        user = self.request.user
        return Booking.objects.filter(
            Q(customer=user) | Q(provider__user=user)
        ).order_by('-created_at')


class BookingDetailView(generics.RetrieveUpdateAPIView):
    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return BookingStatusUpdateSerializer
        return BookingDetailSerializer

    def get_queryset(self):
        user = self.request.user
        return Booking.objects.filter(
            Q(customer=user) | Q(provider__user=user)
        )


class BookingLocationUpdateView(APIView):
    def get(self, request, pk):
        """Return the other party's current location."""
        try:
            booking = Booking.objects.get(id=pk)
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        is_provider = booking.provider.user == user
        is_customer = booking.customer == user
        is_admin = user.account_type == 'ADMIN' or user.email == 'admin@example.com'
        if not is_provider and not is_customer and not is_admin:
            return Response({'error': 'Not part of this booking'}, status=status.HTTP_403_FORBIDDEN)

        data = {
            'arrived_at': booking.arrived_at,
            'destination_lat': booking.destination_lat,
            'destination_lng': booking.destination_lng,
        }
        if is_customer or is_admin:
            data['lat'] = booking.provider_lat
            data['lng'] = booking.provider_lng
            data['updated_at'] = booking.provider_location_updated_at
            data['other_type'] = 'provider'
        if is_provider or is_admin:
            data['customer_lat'] = booking.customer_lat
            data['customer_lng'] = booking.customer_lng
            data['customer_updated_at'] = booking.customer_location_updated_at
        return Response(data)

    def patch(self, request, pk):
        try:
            booking = Booking.objects.get(id=pk)
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        is_provider = booking.provider.user == user
        is_customer = booking.customer == user
        if not is_provider and not is_customer:
            return Response({'error': 'Not part of this booking'}, status=status.HTTP_403_FORBIDDEN)

        if booking.status not in ('REQUESTED', 'CONFIRMED', 'IN_PROGRESS'):
            return Response({'error': 'Booking is not active'}, status=status.HTTP_400_BAD_REQUEST)

        lat = request.data.get('lat')
        lng = request.data.get('lng')
        if lat is None or lng is None:
            return Response({'error': 'lat and lng are required'}, status=status.HTTP_400_BAD_REQUEST)

        if is_provider:
            booking.provider_lat = lat
            booking.provider_lng = lng
            booking.provider_location_updated_at = timezone.now()
        else:
            booking.customer_lat = lat
            booking.customer_lng = lng
            booking.customer_location_updated_at = timezone.now()

        booking.save()
        return Response({
            'lat': lat,
            'lng': lng,
            'updated_at': timezone.now().isoformat()
        })


class BookingArrivedView(APIView):
    def post(self, request, pk):
        try:
            booking = Booking.objects.get(id=pk)
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)

        if booking.provider.user != request.user:
            return Response({'error': 'Only the provider can mark arrival'}, status=status.HTTP_403_FORBIDDEN)

        if booking.status not in ('CONFIRMED', 'IN_PROGRESS'):
            return Response({'error': 'Booking is not active'}, status=status.HTTP_400_BAD_REQUEST)

        booking.arrived_at = timezone.now()
        if booking.status == 'CONFIRMED':
            booking.status = 'IN_PROGRESS'
            booking.save(update_fields=['arrived_at', 'status', 'updated_at'])
        else:
            booking.save(update_fields=['arrived_at', 'updated_at'])

        return Response({'message': 'Arrival confirmed', 'arrived_at': booking.arrived_at})


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


class ReportCreateView(generics.CreateAPIView):
    serializer_class = ReportCreateSerializer
    queryset = Report.objects.all()

    def perform_create(self, serializer):
        serializer.save(reporter=self.request.user)


class ReportListView(generics.ListAPIView):
    serializer_class = ReportSerializer

    def get_queryset(self):
        user = self.request.user
        if user.account_type == 'ADMIN' or user.email == 'admin@example.com':
            return Report.objects.all().order_by('-created_at')
        return Report.objects.filter(reporter=user).order_by('-created_at')


class ReportDetailView(APIView):
    permission_classes = [IsSuperAdmin]

    def patch(self, request, pk):
        try:
            report = Report.objects.get(id=pk)
        except Report.DoesNotExist:
            return Response({'error': 'Report not found'}, status=status.HTTP_404_NOT_FOUND)

        status_val = request.data.get('status')
        admin_note = request.data.get('admin_note')
        if status_val:
            from .models import ReportStatus
            if status_val not in [v.value for v in ReportStatus]:
                return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
            report.status = status_val
        if admin_note is not None:
            report.admin_note = admin_note
        report.save()
        return Response({'message': 'Report updated'})


class AdminLocationListView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        bookings = Booking.objects.filter(
            status__in=['CONFIRMED', 'IN_PROGRESS']
        ).select_related('customer', 'provider__user').order_by('-updated_at')

        data = []
        for b in bookings:
            booking_data = {
                'id': str(b.id),
                'status': b.status,
                'arrived_at': b.arrived_at,
                'destination_lat': b.destination_lat,
                'destination_lng': b.destination_lng,
                'customer': {
                    'id': str(b.customer.id),
                    'name': b.customer.get_full_name() or b.customer.username,
                    'email': b.customer.email,
                    'phone': b.customer.phone,
                    'lat': b.customer_lat,
                    'lng': b.customer_lng,
                    'location_updated_at': b.customer_location_updated_at,
                },
                'provider': {
                    'id': str(b.provider.id),
                    'name': b.provider.user.get_full_name() or b.provider.user.username,
                    'email': b.provider.user.email,
                    'phone': b.provider.user.phone,
                    'profession': b.provider.profession,
                    'lat': b.provider_lat,
                    'lng': b.provider_lng,
                    'location_updated_at': b.provider_location_updated_at,
                },
                'job_description': b.job_description[:100] if b.job_description else '',
                'scheduled_date': b.scheduled_date,
            }
            data.append(booking_data)

        return Response(data)
