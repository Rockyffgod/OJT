from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('me/', views.MeView.as_view(), name='me'),
    path('emergency-contacts/', views.EmergencyContactListCreateView.as_view(), name='emergency-contacts'),
    path('emergency-contacts/<uuid:pk>/', views.EmergencyContactDetailView.as_view(), name='emergency-contact-detail'),
    path('sos/', views.SOSAlertListCreateView.as_view(), name='sos-list'),
    path('sos/<uuid:pk>/', views.SOSAlertDetailView.as_view(), name='sos-detail'),
]
