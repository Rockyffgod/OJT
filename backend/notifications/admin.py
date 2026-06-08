from django.contrib import admin
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'type', 'is_read', 'created_at')
    list_filter = ('type', 'read_at')
    search_fields = ('user__email', 'title', 'body')
    readonly_fields = ('id', 'created_at')
