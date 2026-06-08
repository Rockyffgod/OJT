from django.contrib import admin
from .models import KarmaEvent


@admin.register(KarmaEvent)
class KarmaEventAdmin(admin.ModelAdmin):
    list_display = ('event_type', 'user', 'points', 'description', 'reference_id', 'created_at')
    list_filter = ('event_type',)
    search_fields = ('user__email', 'event_type', 'description')
    readonly_fields = ('id', 'created_at')
