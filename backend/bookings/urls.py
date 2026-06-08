from django.urls import path
from . import views

urlpatterns = [
    path('', views.BookingListCreateView.as_view(), name='bookings'),
    path('<uuid:pk>/', views.BookingDetailView.as_view(), name='booking-detail'),
    path('disputes/', views.DisputeListView.as_view(), name='disputes'),
    path('disputes/create/', views.DisputeCreateView.as_view(), name='dispute-create'),
    path('reviews/', views.ReviewListView.as_view(), name='reviews'),
    path('reviews/create/', views.ReviewCreateView.as_view(), name='review-create'),
]
