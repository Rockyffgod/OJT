from django.contrib import admin
from .models import Message


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('sender', 'booking', 'text_preview', 'read_at', 'created_at')
    list_filter = ('read_at',)
    search_fields = ('sender__email', 'text')
    readonly_fields = ('id', 'created_at')

    def text_preview(self, obj):
        return (obj.text or '')[:60]
    text_preview.short_description = 'Text'
