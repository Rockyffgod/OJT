import math, random
from django.db.models import Avg, Sum, Q
from rest_framework import generics, permissions, filters, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.conf import settings
from .models import ServiceCategory, ServiceProvider
from .serializers import (
    ServiceCategorySerializer,
    ServiceProviderListSerializer,
    ServiceProviderDetailSerializer,
    ServiceProviderUpdateSerializer,
)


class NearbyProvidersView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        try:
            lat = float(request.query_params.get('lat', 0))
            lng = float(request.query_params.get('lng', 0))
            radius = float(request.query_params.get('radius', 10))
        except (TypeError, ValueError):
            return Response({"error": "lat, lng, and radius query params required"}, status=400)

        providers = ServiceProvider.objects.filter(
            verification_status='APPROVED',
            is_available=True,
        )

        nearby = []
        for p in providers:
            if p.latitude and p.longitude:
                dlat = math.radians(p.latitude - lat)
                dlng = math.radians(p.longitude - lng)
                a = math.sin(dlat/2)**2 + math.cos(math.radians(lat)) * math.cos(math.radians(p.latitude)) * math.sin(dlng/2)**2
                c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
                dist = 6371 * c
                if dist <= radius:
                    nearby.append({
                        "id": str(p.id),
                        "name": p.user.get_full_name() or p.user.username.replace('_', ' ').title(),
                        "profession": p.profession,
                        "service_area": p.service_area,
                        "hourly_rate": p.hourly_rate,
                        "average_rating": p.average_rating,
                        "total_jobs_completed": p.total_jobs_completed,
                        "karma_level": p.karma_level,
                        "latitude": p.latitude,
                        "longitude": p.longitude,
                        "distance_km": round(dist, 2),
                        "photo_url": request.build_absolute_uri(p.user.profile_photo.url) if p.user.profile_photo else None,
                    })

        nearby.sort(key=lambda x: x['distance_km'])
        return Response(nearby)


class ServiceCategoryListView(generics.ListAPIView):
    queryset = ServiceCategory.objects.filter(is_active=True)
    serializer_class = ServiceCategorySerializer
    permission_classes = [permissions.AllowAny]


class ServiceProviderListView(generics.ListAPIView):
    queryset = ServiceProvider.objects.filter(verification_status='APPROVED', is_available=True)
    serializer_class = ServiceProviderListSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'availability_status', 'karma_level']
    search_fields = ['profession', 'service_area', 'bio', 'skills']
    ordering_fields = ['average_rating', 'karma_points', 'total_jobs_completed', 'hourly_rate']


class ServiceProviderDetailView(generics.RetrieveAPIView):
    queryset = ServiceProvider.objects.all()
    serializer_class = ServiceProviderDetailSerializer
    permission_classes = [permissions.AllowAny]


class MyProviderProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ServiceProviderUpdateSerializer

    def get_object(self):
        return self.request.user.service_provider


class ServiceCategoryCreateView(generics.CreateAPIView):
    queryset = ServiceCategory.objects.all()
    serializer_class = ServiceCategorySerializer
    permission_classes = [permissions.IsAdminUser]


class ServiceSuggestionsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        q = request.query_params.get('q', '').strip().lower()
        if not q:
            return Response([])

        # Substring/prefix match categories
        cats = ServiceCategory.objects.filter(is_active=True)
        suggestions = []

        for c in cats:
            if q in c.name.lower() or (c.name_nepali and q in c.name_nepali.lower()):
                suggestions.append({
                    "type": "category",
                    "text": c.name,
                    "text_nepali": c.name_nepali or c.name,
                    "icon": c.icon
                })

        # Substring match unique professions from ServiceProviders
        providers = ServiceProvider.objects.filter(verification_status='APPROVED')
        professions = set()
        for p in providers:
            if p.profession:
                professions.add(p.profession)

        for prof in professions:
            if q in prof.lower():
                suggestions.append({
                    "type": "profession",
                    "text": prof,
                    "text_nepali": prof,
                    "icon": "💼"
                })

        # De-duplicate by text
        seen = set()
        unique_suggestions = []
        for s in suggestions:
            if s['text'] not in seen:
                seen.add(s['text'])
                unique_suggestions.append(s)

        return Response(unique_suggestions[:10])


class FileUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

        from django.core.files.storage import default_storage
        from django.core.files.base import ContentFile

        path = default_storage.save(f'uploads/{file.name}', ContentFile(file.read()))
        url = request.build_absolute_uri(f'{settings.MEDIA_URL}{path}')
        return Response({'url': url})


class SubmitVerificationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        try:
            provider = request.user.service_provider
        except ServiceProvider.DoesNotExist:
            return Response({'error': 'Only providers can submit verification'}, status=status.HTTP_403_FORBIDDEN)

        document_type = request.data.get('document_type')
        document_front_url = request.data.get('document_front_url', '')
        document_back_url = request.data.get('document_back_url', '')
        selfie_url = request.data.get('selfie_url', '')

        if not document_type:
            return Response({'error': 'document_type is required'}, status=status.HTTP_400_BAD_REQUEST)

        valid_types = ['CITIZENSHIP_CARD', 'NATIONAL_ID', 'BIRTH_CERTIFICATE', 'PASSPORT']
        if document_type not in valid_types:
            return Response({'error': f'Invalid document type. Must be one of: {", ".join(valid_types)}'},
                            status=status.HTTP_400_BAD_REQUEST)

        provider.id_document_type = document_type
        if document_front_url:
            provider.id_document_url = document_front_url
        if selfie_url:
            provider.selfie_url = selfie_url
        provider.verification_status = 'SUBMITTED'
        provider.save()

        return Response({
            'message': 'Verification documents submitted successfully',
            'verification_status': provider.verification_status
        })


class MyProviderStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            provider = request.user.service_provider
        except ServiceProvider.DoesNotExist:
            return Response({'error': 'Only providers can access stats'}, status=status.HTTP_403_FORBIDDEN)

        from bookings.models import Booking, BookingStatus, Review
        bookings = Booking.objects.filter(provider=provider)
        completed = bookings.filter(status=BookingStatus.COMPLETED)
        reviews = Review.objects.filter(provider=provider)

        stats = {
            'total_jobs': bookings.count(),
            'completed_jobs': completed.count(),
            'pending_bookings': bookings.filter(status=BookingStatus.REQUESTED).count(),
            'avg_rating': round(reviews.aggregate(avg=Avg('rating'))['avg'] or 0, 1),
            'review_count': reviews.count(),
            'total_earnings': completed.aggregate(total=Sum('agreed_price'))['total'] or 0,
        }
        return Response(stats)


class RandomMatchView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        category_name = request.query_params.get('category', '').strip()
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')

        qs = ServiceProvider.objects.filter(
            verification_status='APPROVED',
            is_available=True,
        )
        if category_name:
            qs = qs.filter(
                Q(profession__icontains=category_name) |
                Q(category__name__icontains=category_name)
            )

        if not qs.exists():
            return Response({'error': 'No providers found for this category'}, status=status.HTTP_404_NOT_FOUND)

        if lat and lng:
            user_lat, user_lng = float(lat), float(lng)
            scored = []
            for p in qs:
                if p.latitude and p.longitude:
                    dlat = math.radians(float(p.latitude) - user_lat)
                    dlng = math.radians(float(p.longitude) - user_lng)
                    a = math.sin(dlat/2)**2 + math.cos(math.radians(user_lat)) * math.cos(math.radians(float(p.latitude))) * math.sin(dlng/2)**2
                    dist = 6371 * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
                    scored.append((dist, p))
            scored.sort(key=lambda x: x[0])
            candidates = [p for _, p in scored[:5]]
            if not candidates:
                candidates = list(qs)
            provider = random.choice(candidates)
            distance_km = round(scored[0][0], 2) if scored else None
        else:
            provider = random.choice(list(qs))
            distance_km = None

        from .serializers import ServiceProviderListSerializer
        serializer = ServiceProviderListSerializer(provider, context={'request': request})
        data = serializer.data
        if distance_km is not None:
            data['distance_km'] = distance_km
        return Response(data)
