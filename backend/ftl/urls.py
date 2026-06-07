from django.urls import path
from . import views

urlpatterns = [
    path('', views.FTLAlertListCreateView.as_view(), name='ftl-alerts'),
    path('<uuid:pk>/', views.FTLAlertDetailView.as_view(), name='ftl-detail'),
]
