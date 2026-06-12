from notifications.models import Notification


def unread_notifications(request):
    if request.user.is_authenticated:
        count = Notification.objects.filter(
            user=request.user, read_at__isnull=True
        ).count()
        return {'unread_notifications_count': count}
    return {}
