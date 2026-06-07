from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import User, EmergencyContact, SOSAlert
from .serializers import UserSerializer, RegisterSerializer, EmergencyContactSerializer, SOSAlertSerializer


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
        """Handle PATCH with full_name support"""
        user = self.get_object()
        full_name = request.data.get('full_name')
        if full_name:
            parts = full_name.split(' ', 1)
            user.first_name = parts[0]
            user.last_name = parts[1] if len(parts) > 1 else ''

        phone = request.data.get('phone')
        if phone:
            user.phone = phone

        city = request.data.get('city')
        if city:
            user.city = city

        username = request.data.get('username')
        if username:
            user.username = username

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
