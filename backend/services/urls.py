from django.urls import path
from . import views

urlpatterns = [
    path('categories/', views.ServiceCategoryListView.as_view(), name='categories'),
    path('categories/create/', views.ServiceCategoryCreateView.as_view(), name='category-create'),
    path('providers/', views.ServiceProviderListView.as_view(), name='providers'),
    path('providers/<uuid:pk>/', views.ServiceProviderDetailView.as_view(), name='provider-detail'),
    path('providers/nearby/', views.NearbyProvidersView.as_view(), name='providers-nearby'),
    path('random-match/', views.RandomMatchView.as_view(), name='random-match'),
    path('my-profile/', views.MyProviderProfileView.as_view(), name='my-provider-profile'),
    path('my-profile/submit-verification/', views.SubmitVerificationView.as_view(), name='submit-verification'),
    path('my-stats/', views.MyProviderStatsView.as_view(), name='my-stats'),
    path('upload/', views.FileUploadView.as_view(), name='file-upload'),
    path('suggest/', views.ServiceSuggestionsView.as_view(), name='service-suggest'),
    path('reverse-geocode/', views.ReverseGeocodeView.as_view(), name='reverse-geocode'),
]
