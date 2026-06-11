from django.urls import path
from . import views

urlpatterns = [
    path('match-job/', views.JobMatcherView.as_view(), name='ai-match-job'),
    path('ftl-assist/', views.FTLAssistView.as_view(), name='ai-ftl-assist'),
    path('ftl-search/', views.FTLSearchView.as_view(), name='ai-ftl-search'),
    path('ftl-enhance/', views.FTLEnhanceView.as_view(), name='ai-ftl-enhance'),
    path('enhance-profile/', views.ProfileEnhanceView.as_view(), name='ai-enhance-profile'),
]
