from django.contrib import admin
from .models import FTLAlert


@admin.register(FTLAlert)
class FTLAlertAdmin(admin.ModelAdmin):
    list_display = ('title', 'type', 'status', 'last_seen_location', 'contact_method', 'created_at', 'user')
    list_filter = ('type', 'status', 'contact_method')
    search_fields = ('title', 'description', 'last_seen_location')
    readonly_fields = ('id', 'created_at', 'resolved_at')
