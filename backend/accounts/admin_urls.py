from django.urls import path
from . import views

urlpatterns = [
    path('users/', views.AdminUserListView.as_view(), name='admin-users'),
    path('users/<uuid:pk>/verify/', views.AdminVerifyUserView.as_view(), name='admin-verify-user'),
    path('providers/', views.AdminProviderListView.as_view(), name='admin-providers'),
    path('providers/<uuid:pk>/suspend/', views.AdminSuspendProviderView.as_view(), name='admin-suspend-provider'),
    path('bookings/', views.AdminBookingListView.as_view(), name='admin-bookings'),
]
