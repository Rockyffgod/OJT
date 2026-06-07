from django.urls import path
from . import views

urlpatterns = [
    path('categories/', views.ServiceCategoryListView.as_view(), name='categories'),
    path('categories/create/', views.ServiceCategoryCreateView.as_view(), name='category-create'),
    path('providers/', views.ServiceProviderListView.as_view(), name='providers'),
    path('providers/<uuid:pk>/', views.ServiceProviderDetailView.as_view(), name='provider-detail'),
    path('providers/nearby/', views.NearbyProvidersView.as_view(), name='providers-nearby'),
    path('my-profile/', views.MyProviderProfileView.as_view(), name='my-provider-profile'),
    path('suggest/', views.ServiceSuggestionsView.as_view(), name='service-suggest'),
]
