from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'username', 'first_name', 'last_name', 'account_type', 'is_active', 'is_suspended', 'is_staff', 'date_joined')
    list_filter = ('account_type', 'is_active', 'is_suspended', 'is_staff')
    search_fields = ('email', 'username', 'first_name', 'last_name', 'phone')
    ordering = ('-date_joined',)
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Custom Fields', {'fields': ('account_type', 'phone', 'city', 'profile_photo', 'is_phone_verified', 'is_email_verified', 'is_suspended', 'suspension_reason', 'suspended_at')}),
    )
