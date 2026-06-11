from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model

User = get_user_model()

class SuspensionMiddleware(MiddlewareMixin):
    """Block API requests from suspended users."""

    def process_view(self, request, view_func, view_args, view_kwargs):
        # Only check authenticated requests to API endpoints
        if not request.path.startswith('/api/'):
            return None

        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Bearer '):
            return None

        try:
            token = AccessToken(auth_header.split(' ')[1])
            user_id = token.payload.get('user_id')
            if user_id:
                try:
                    user = User.objects.get(id=user_id)
                    if user.is_suspended:
                        return JsonResponse(
                            {
                                'error': 'Account suspended',
                                'detail': 'Your account has been suspended. Please contact support for assistance.',
                                'is_suspended': True,
                                'support_email': 'support@hamrokarma.com',
                                'support_discord': 'https://discord.gg/hb8GuuSsfb',
                            },
                            status=403,
                        )
                except User.DoesNotExist:
                    pass
        except Exception:
            pass

        return None
