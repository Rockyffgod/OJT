from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.utils import timezone
from .models import User, EmergencyContact, SOSAlert
from .serializers import UserSerializer, RegisterSerializer, EmergencyContactSerializer, SOSAlertSerializer
from bookings.models import Booking
from services.models import ServiceProvider
from bookings.serializers import BookingListSerializer
from services.serializers import ServiceProviderListSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer


import requests
from rest_framework_simplejwt.tokens import RefreshToken

class LoginView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        # Try standard Django login first
        try:
            res = super().post(request, *args, **kwargs)
            if res.status_code == 200:
                user = User.objects.get(email=request.data.get('email'))
                res.data['id'] = str(user.id)
                res.data['email'] = user.email
                res.data['account_type'] = user.account_type
            return res
        except Exception:
            # Login failed. Check if user is in Supabase!
            email = request.data.get('email')
            password = request.data.get('password')
            if not email or not password:
                raise

            try:
                sb_url = "https://fgazceatncfgmzdtogxe.supabase.co"
                auth_res = requests.post(
                    f"{sb_url}/auth/v1/token?grant_type=password",
                    headers={
                        "apikey": "sb_publishable_JcbfO9Oc1wkyJo1ANnGwDw_pn8bNA_T",
                        "Content-Type": "application/json",
                    },
                    json={"email": email, "password": password},
                    timeout=8
                )
                if auth_res.status_code == 200:
                    auth_data = auth_res.json()
                    user_uuid = auth_data['user']['id']
                    access_token = auth_data['access_token']

                    # Fetch user's profile details from Supabase profiles table
                    profile_res = requests.get(
                        f"{sb_url}/rest/v1/profiles?id=eq.{user_uuid}",
                        headers={
                            "apikey": "sb_publishable_JcbfO9Oc1wkyJo1ANnGwDw_pn8bNA_T",
                            "Authorization": f"Bearer {access_token}",
                        },
                        timeout=8
                    )
                    
                    full_name = ""
                    account_type = "CUSTOMER"
                    phone = None
                    city = ""

                    if profile_res.status_code == 200:
                        profile_data = profile_res.json()
                        if profile_data and len(profile_data) > 0:
                            p = profile_data[0]
                            full_name = p.get('full_name', '')
                            account_type = p.get('account_type', 'CUSTOMER')
                            phone = p.get('phone')
                            city = p.get('city', '')

                    # Auto-provision user in Django DB
                    user, created = User.objects.get_or_create(
                        email=email,
                        defaults={
                            'id': user_uuid,
                            'username': email.split('@')[0],
                            'account_type': account_type,
                            'phone': phone,
                            'city': city or '',
                        }
                    )
                    user.set_password(password)
                    if full_name:
                        parts = full_name.split(' ', 1)
                        user.first_name = parts[0]
                        user.last_name = parts[1] if len(parts) > 1 else ''
                    user.save()

                    # Generate simplejwt token
                    refresh = RefreshToken.for_user(user)
                    return Response({
                        'refresh': str(refresh),
                        'access': str(refresh.access_token),
                    })
            except Exception as e:
                print("Supabase login provision error:", e)

            raise


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

    def patch(self, request, *args, **kwargs):
        """Handle PATCH with full_name, email, and profile_photo support"""
        user = self.get_object()
        full_name = request.data.get('full_name')
        if full_name:
            parts = full_name.split(' ', 1)
            user.first_name = parts[0]
            user.last_name = parts[1] if len(parts) > 1 else ''

        phone = request.data.get('phone')
        if phone is not None:
            user.phone = phone

        city = request.data.get('city')
        if city is not None:
            user.city = city

        username = request.data.get('username')
        if username is not None:
            user.username = username

        email = request.data.get('email')
        if email is not None:
            user.email = email

        if 'profile_photo' in request.FILES:
            user.profile_photo = request.FILES['profile_photo']

        user.save()
        serializer = self.get_serializer(user)
        return Response(serializer.data)


class EmergencyContactListCreateView(generics.ListCreateAPIView):
    serializer_class = EmergencyContactSerializer

    def get_queryset(self):
        return EmergencyContact.objects.filter(user=self.request.user)


class EmergencyContactDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = EmergencyContactSerializer

    def get_queryset(self):
        return EmergencyContact.objects.filter(user=self.request.user)


class SOSAlertListCreateView(generics.ListCreateAPIView):
    serializer_class = SOSAlertSerializer

    def get_queryset(self):
        return SOSAlert.objects.filter(triggered_by=self.request.user)


class SOSAlertDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SOSAlertSerializer

    def get_queryset(self):
        return SOSAlert.objects.filter(triggered_by=self.request.user)


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not old_password or not new_password:
            return Response({'error': 'Both old and new passwords are required'}, status=status.HTTP_400_BAD_REQUEST)

        if not user.check_password(old_password):
            return Response({'error': 'Current password is incorrect'}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 8:
            return Response({'error': 'Password must be at least 8 characters'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({'message': 'Password changed successfully'})


class AdminUserListView(generics.ListAPIView):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]


class AdminProviderListView(generics.ListAPIView):
    queryset = ServiceProvider.objects.select_related('user', 'category').all().order_by('-created_at')
    serializer_class = ServiceProviderListSerializer
    permission_classes = [permissions.IsAdminUser]


class AdminBookingListView(generics.ListAPIView):
    queryset = Booking.objects.select_related('customer', 'provider').all().order_by('-created_at')
    serializer_class = BookingListSerializer
    permission_classes = [permissions.IsAdminUser]


class AdminVerifyUserView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def patch(self, request, pk):
        try:
            provider = ServiceProvider.objects.get(user__id=pk)
        except ServiceProvider.DoesNotExist:
            return Response({'error': 'Provider not found'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('verification_status', 'APPROVED')
        from accounts.models import VerificationStatus
        if new_status not in [v.value for v in VerificationStatus]:
            return Response({'error': 'Invalid verification status'}, status=status.HTTP_400_BAD_REQUEST)

        provider.verification_status = new_status
        if new_status in ('APPROVED', 'VERIFIED'):
            provider.verified_at = timezone.now()
            provider.rejection_reason = None
        elif new_status == 'REJECTED':
            provider.rejection_reason = request.data.get('rejection_reason', '')
        provider.save()
        return Response({'message': f'Provider verification status updated to {new_status}'})


class AdminSuspendProviderView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def patch(self, request, pk):
        try:
            provider = ServiceProvider.objects.get(user__id=pk)
        except ServiceProvider.DoesNotExist:
            return Response({'error': 'Provider not found'}, status=status.HTTP_404_NOT_FOUND)

        is_available = request.data.get('is_available', False)
        if not isinstance(is_available, bool):
            return Response({'error': 'is_available must be a boolean'}, status=status.HTTP_400_BAD_REQUEST)

        provider.is_available = is_available
        provider.availability_status = 'AVAILABLE_NOW' if is_available else 'OFFLINE'
        provider.save()
        user = provider.user
        user.is_active = is_available
        user.save()
        return Response({
            'message': 'Provider unsuspended' if is_available else 'Provider suspended',
            'is_available': provider.is_available
        })
