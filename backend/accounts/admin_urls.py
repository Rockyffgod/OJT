from django.urls import path
from . import views
from bookings.views import AdminLocationListView

urlpatterns = [
    path('users/', views.AdminUserListView.as_view(), name='admin-users'),
    path('users/<uuid:pk>/verify/', views.AdminVerifyUserView.as_view(), name='admin-verify-user'),
    path('users/<uuid:pk>/promote/', views.AdminPromoteUserView.as_view(), name='admin-promote-user'),
    path('users/<uuid:pk>/demote/', views.AdminDemoteUserView.as_view(), name='admin-demote-user'),
    path('users/<uuid:pk>/suspend/', views.AdminSuspendUserView.as_view(), name='admin-suspend-user'),
    path('users/<uuid:pk>/unsuspend/', views.AdminUnsuspendUserView.as_view(), name='admin-unsuspend-user'),
    path('providers/', views.AdminProviderListView.as_view(), name='admin-providers'),
    path('providers/<uuid:pk>/suspend/', views.AdminSuspendProviderView.as_view(), name='admin-suspend-provider'),
    path('bookings/', views.AdminBookingListView.as_view(), name='admin-bookings'),
    path('locations/', AdminLocationListView.as_view(), name='admin-locations'),
]
