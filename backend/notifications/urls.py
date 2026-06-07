from django.urls import path
from . import views

urlpatterns = [
    path('', views.NotificationListView.as_view(), name='notifications'),
    path('<uuid:pk>/read/', views.NotificationMarkReadView.as_view(), name='notification-read'),
    path('read-all/', views.NotificationMarkAllReadView.as_view(), name='notifications-read-all'),
]
