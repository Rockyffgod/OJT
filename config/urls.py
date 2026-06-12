from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.shortcuts import redirect
from . import views

urlpatterns = [
    # API routes (existing)
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/accounts/', include('accounts.urls')),
    path('api/admin/', include('accounts.admin_urls')),
    path('api/services/', include('services.urls')),
    path('api/bookings/', include('bookings.urls')),
    path('api/messages/', include('messaging.urls')),
    path('api/karma/', include('karma.urls')),
    path('api/ftl/', include('ftl.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/ai/', include('ai.urls')),
    # Template-based routes
    path('', lambda r: redirect('login')),
    path('login/', views.login_view, name='login'),
    path('signup/', views.signup_view, name='signup'),
    path('logout/', views.logout_view, name='logout'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('services/', views.services_list, name='services'),
    path('bookings/', views.bookings_list, name='bookings'),
    path('bookings/<uuid:pk>/', views.booking_detail, name='booking_detail'),
    path('profile/', views.profile_view, name='profile'),
    path('profile/edit/', views.profile_edit, name='profile_edit'),
    path('ftl/', views.ftl_list, name='ftl_list'),
    path('ftl/new/', views.ftl_new, name='ftl_new'),
    path('ftl/<uuid:pk>/', views.ftl_detail, name='ftl_detail'),
    path('notifications/', views.notifications_list, name='notifications'),
    path('messages/', views.messages_list, name='messages'),
    path('messages/send/', views.send_message, name='send_message'),
    path('admin-panel/', views.admin_panel, name='admin_panel'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
