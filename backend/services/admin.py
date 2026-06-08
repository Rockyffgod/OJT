from django.contrib import admin
from .models import ServiceCategory, ServiceProvider


@admin.register(ServiceCategory)
class ServiceCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'name_nepali', 'icon', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'name_nepali')


@admin.register(ServiceProvider)
class ServiceProviderAdmin(admin.ModelAdmin):
    list_display = ('user', 'profession', 'category', 'verification_status', 'is_available', 'availability_status', 'karma_level', 'average_rating', 'created_at')
    list_filter = ('verification_status', 'is_available', 'availability_status', 'karma_level', 'category')
    search_fields = ('user__email', 'user__username', 'profession', 'service_area')
    readonly_fields = ('id', 'karma_points', 'karma_level', 'average_rating', 'total_jobs_completed', 'created_at', 'updated_at')
    fieldsets = (
        ('User Info', {'fields': ('user', 'profession', 'category', 'bio', 'experience')}),
        ('Pricing & Area', {'fields': ('hourly_rate', 'service_area', 'skills', 'languages')}),
        ('Verification', {'fields': ('verification_status', 'verified_at', 'rejection_reason', 'id_document_type', 'id_document_url', 'selfie_url')}),
        ('Availability', {'fields': ('is_available', 'availability_status', 'latitude', 'longitude')}),
        ('Stats', {'fields': ('karma_points', 'karma_level', 'average_rating', 'total_jobs_completed', 'commission_rate', 'profile_completion')}),
        ('Portfolio', {'fields': ('portfolio_photos',)}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )
