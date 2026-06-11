from django.urls import path
from . import views

urlpatterns = [
    path('', views.MessageListCreateView.as_view(), name='messages'),
    path('<uuid:pk>/read/', views.MessageMarkReadView.as_view(), name='message-read'),
]
