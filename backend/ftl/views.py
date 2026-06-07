from rest_framework import generics, permissions
from .models import FTLAlert
from .serializers import FTLAlertSerializer


class FTLAlertListCreateView(generics.ListCreateAPIView):
    serializer_class = FTLAlertSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = FTLAlert.objects.filter(status__in=['OPEN', 'MATCHED']).order_by('-created_at')
        ftl_type = self.request.query_params.get('type')
        if ftl_type:
            qs = qs.filter(type=ftl_type)
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class FTLAlertDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FTLAlertSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        if self.request.method == 'GET':
            return FTLAlert.objects.all()
        user = self.request.user
        if user.account_type == 'ADMIN':
            return FTLAlert.objects.all()
        return FTLAlert.objects.filter(user=user)
