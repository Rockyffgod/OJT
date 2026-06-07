import math
from rest_framework import generics, permissions, filters, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
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
