from django.urls import path
from . import views

urlpatterns = [
    path('events/', views.KarmaEventListView.as_view(), name='karma-events'),
    path('leaderboard/', views.LeaderboardView.as_view(), name='leaderboard'),
]
