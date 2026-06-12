from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from django.shortcuts import redirect
from . import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', lambda r: redirect('login')),
    path('login/', views.login_view, name='login'),
    path('signup/', views.signup_view, name='signup'),
    path('logout/', views.logout_view, name='logout'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('services/', views.services_list, name='services'),
    path('services/provider/<uuid:pk>/', views.provider_detail, name='provider_detail'),
    path('bookings/', views.bookings_list, name='bookings'),
    path('bookings/book/<uuid:provider_pk>/', views.book_booking, name='book_booking'),
    path('bookings/<uuid:pk>/', views.booking_detail, name='booking_detail'),
    path('bookings/<uuid:pk>/checkout/', views.booking_checkout, name='booking_checkout'),
    path('bookings/<uuid:pk>/tracking/', views.booking_tracking, name='booking_tracking'),
    path('bookings/<uuid:pk>/accept/', views.booking_accept, name='booking_accept'),
    path('bookings/<uuid:pk>/reject/', views.booking_reject, name='booking_reject'),
    path('bookings/<uuid:pk>/complete/', views.booking_mark_complete, name='booking_mark_complete'),
    path('profile/', views.profile_view, name='profile'),
    path('profile/edit/', views.profile_edit, name='profile_edit'),
    path('ftl/', views.ftl_list, name='ftl_list'),
    path('ftl/new/', views.ftl_new, name='ftl_new'),
    path('ftl/<uuid:pk>/', views.ftl_detail, name='ftl_detail'),
    path('notifications/', views.notifications_list, name='notifications'),
    path('notifications/<uuid:pk>/read/', views.mark_notification_read, name='mark_notification_read'),
    path('messages/', views.messages_list, name='messages'),
    path('messages/send/', views.send_message, name='send_message'),
    path('admin-panel/', views.admin_panel, name='admin_panel'),
    path('tos/', views.tos, name='tos'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
