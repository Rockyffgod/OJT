from django.contrib import admin
from .models import Booking, Dispute, Review


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('id_short', 'customer', 'provider', 'status', 'payment_status', 'agreed_price', 'scheduled_date', 'created_at')
    list_filter = ('status', 'payment_status', 'payment_method')
    search_fields = ('customer__email', 'provider__user__email', 'job_description', 'job_address')
    readonly_fields = ('id', 'created_at', 'updated_at', 'completed_at', 'cancelled_at')

    def id_short(self, obj):
        return str(obj.id)[:8] + '...'
    id_short.short_description = 'ID'


@admin.register(Dispute)
class DisputeAdmin(admin.ModelAdmin):
    list_display = ('id_short', 'booking', 'raised_by', 'reason', 'status', 'created_at')
    list_filter = ('status', 'reason')
    search_fields = ('booking__id', 'raised_by__email', 'description')
    readonly_fields = ('id', 'created_at', 'resolved_at')

    def id_short(self, obj):
        return str(obj.id)[:8] + '...'
    id_short.short_description = 'ID'


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('id_short', 'provider', 'customer', 'rating', 'created_at')
    list_filter = ('rating',)
    search_fields = ('provider__user__email', 'customer__email', 'comment')
    readonly_fields = ('id', 'created_at')

    def id_short(self, obj):
        return str(obj.id)[:8] + '...'
    id_short.short_description = 'ID'
