from django.urls import path
from . import views

urlpatterns = [
    path('', views.BookingListCreateView.as_view(), name='bookings'),
    path('<uuid:pk>/', views.BookingDetailView.as_view(), name='booking-detail'),
    path('<uuid:pk>/location/', views.BookingLocationUpdateView.as_view(), name='booking-location'),
    path('<uuid:pk>/arrived/', views.BookingArrivedView.as_view(), name='booking-arrived'),
    path('disputes/', views.DisputeListView.as_view(), name='disputes'),
    path('disputes/create/', views.DisputeCreateView.as_view(), name='dispute-create'),
    path('reports/', views.ReportListView.as_view(), name='reports'),
    path('reports/create/', views.ReportCreateView.as_view(), name='report-create'),
    path('reports/<uuid:pk>/', views.ReportDetailView.as_view(), name='report-detail'),
    path('reviews/', views.ReviewListView.as_view(), name='reviews'),
    path('reviews/create/', views.ReviewCreateView.as_view(), name='review-create'),
]
