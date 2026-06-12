from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Q
from django.urls import reverse
from django.utils import timezone
from accounts.models import User, AccountType
from services.models import ServiceCategory, ServiceProvider
from bookings.models import Booking, BookingStatus
from ftl.models import FTLAlert, FTLType, FTLStatus
from notifications.models import Notification
from messaging.models import Message


def login_view(request):
    if request.user.is_authenticated:
        return redirect('dashboard')
    if request.method == 'POST':
        username_input = request.POST.get('email')
        password = request.POST.get('password')
        user = authenticate(request, username=username_input, password=password)
        if not user:
            try:
                u = User.objects.get(email=username_input)
                user = authenticate(request, username=u.username, password=password)
            except User.DoesNotExist:
                pass
        if user is not None:
            if user.is_suspended:
                messages.error(request, 'Your account has been suspended.')
                return render(request, 'login.html')
            login(request, user)
            return redirect('dashboard')
        messages.error(request, 'Invalid email or password.')
    return render(request, 'login.html')


def signup_view(request):
    if request.user.is_authenticated:
        return redirect('dashboard')
    services = ServiceCategory.objects.all()
    if request.method == 'POST':
        email = request.POST.get('email')
        username = request.POST.get('username')
        password1 = request.POST.get('password1')
        password2 = request.POST.get('password2')
        account_type = request.POST.get('account_type', 'CUSTOMER')
        first_name = request.POST.get('first_name', '')
        last_name = request.POST.get('last_name', '')
        phone = request.POST.get('phone', '')
        city = request.POST.get('city', '')

        if password1 != password2:
            messages.error(request, 'Passwords do not match.')
            return render(request, 'signup.html', {'services': services})
        if len(password1) < 8:
            messages.error(request, 'Password must be at least 8 characters.')
            return render(request, 'signup.html', {'services': services})
        if User.objects.filter(email=email).exists():
            messages.error(request, 'Email already registered.')
            return render(request, 'signup.html', {'services': services})
        if User.objects.filter(username=username).exists():
            messages.error(request, 'Username already taken.')
            return render(request, 'signup.html', {'services': services})

        user = User.objects.create_user(
            username=username, email=email, password=password1,
            first_name=first_name, last_name=last_name,
            phone=phone, city=city, account_type=account_type,
        )
        if account_type == 'PROVIDER':
            selected_ids = request.POST.getlist('service_categories')
            if selected_ids:
                categories = ServiceCategory.objects.filter(id__in=selected_ids)
                first_cat = categories.first()
                skills = [c.name for c in categories]
                ServiceProvider.objects.create(
                    user=user,
                    profession=first_cat.name if first_cat else '',
                    category=first_cat,
                    skills=skills,
                )
        login(request, user)
        messages.success(request, 'Account created successfully!')
        return redirect('dashboard')
    return render(request, 'signup.html', {'services': services})


def logout_view(request):
    logout(request)
    return redirect('login')


@login_required
def dashboard(request):
    user = request.user
    if user.account_type == AccountType.PROVIDER:
        try:
            provider = user.service_provider
            bookings = Booking.objects.filter(provider=provider).order_by('-created_at')[:5]
            stats = {
                'total_jobs': Booking.objects.filter(provider=provider).count(),
                'completed_jobs': Booking.objects.filter(provider=provider, status=BookingStatus.COMPLETED).count(),
                'pending_bookings': Booking.objects.filter(provider=provider, status=BookingStatus.REQUESTED).count(),
                'avg_rating': round(provider.average_rating or 0, 1),
            }
        except ServiceProvider.DoesNotExist:
            provider = None
            bookings = []
            stats = {}
        context = {'provider': provider, 'bookings': bookings, 'stats': stats}
    else:
        bookings = Booking.objects.filter(customer=user).order_by('-created_at')[:5]
        context = {'bookings': bookings}

    top_providers = ServiceProvider.objects.filter(
        verification_status='APPROVED'
    ).order_by('-karma_points')[:5]
    notifs = Notification.objects.filter(
        Q(user=user) | Q(is_global=True), read_at__isnull=True
    ).order_by('-created_at')[:5]

    context.update({
        'top_providers': top_providers,
        'recent_notifications': notifs,
        'user': user,
    })
    return render(request, 'dashboard.html', context)


@login_required
def services_list(request):
    categories = ServiceCategory.objects.filter(is_active=True)
    providers = ServiceProvider.objects.filter(
        is_available=True
    ).select_related('user', 'category').order_by('-average_rating').distinct()

    category_id = request.GET.get('category')
    search = request.GET.get('search')
    if category_id:
        providers = providers.filter(category_id=category_id)
    if search:
        providers = providers.filter(
            Q(profession__icontains=search) |
            Q(service_area__icontains=search) |
            Q(user__first_name__icontains=search)
        )
    providers_data = [
        {
            'pk': str(sp.pk),
            'name': sp.user.get_full_name() or sp.user.username,
            'photo': sp.user.profile_photo.url if sp.user.profile_photo else '',
            'prof': sp.profession,
            'rate': f'Rs.{sp.hourly_rate}/hr',
            'rating': float(sp.average_rating or 0),
            'area': sp.service_area or '',
            'lat': float(sp.latitude),
            'lng': float(sp.longitude),
            'profile_url': reverse('provider_detail', args=[str(sp.pk)]),
        }
        for sp in providers
        if sp.latitude and sp.longitude
    ]
    return render(request, 'services.html', {
        'categories': categories,
        'providers': providers,
        'providers_data': providers_data,
        'selected_category': category_id,
        'search': search,
    })


@login_required
def provider_detail(request, pk):
    sp = get_object_or_404(ServiceProvider.objects.select_related('user', 'category'), pk=pk)
    return render(request, 'provider_detail.html', {'sp': sp})


@login_required
def book_booking(request, provider_pk):
    provider = get_object_or_404(ServiceProvider.objects.select_related('user'), pk=provider_pk)
    if request.method == 'POST':
        scheduled_date = request.POST.get('scheduled_date')
        scheduled_time = request.POST.get('scheduled_time')
        address = request.POST.get('address')
        description = request.POST.get('description')
        if not all([scheduled_date, scheduled_time, address, description]):
            messages.error(request, 'All fields are required.')
        else:
            from datetime import datetime
            dt = datetime.strptime(f'{scheduled_date} {scheduled_time}', '%Y-%m-%d %H:%M')
            from django.utils import timezone as tz
            dt = tz.make_aware(dt)
            booking = Booking.objects.create(
                customer=request.user,
                provider=provider,
                job_description=description,
                job_address=address,
                scheduled_date=dt,
                agreed_price=provider.hourly_rate,
                status=BookingStatus.REQUESTED,
                provider_lat=provider.latitude,
                provider_lng=provider.longitude,
                destination_lat=27.7172,
                destination_lng=85.3240,
            )
            messages.success(request, 'Booking submitted! Waiting for provider to accept.')
            return redirect('booking_detail', pk=booking.id)
    return render(request, 'bookings/book_booking.html', {'provider': provider, 'now': timezone.now()})

@login_required
def booking_checkout(request, pk):
    booking = get_object_or_404(Booking, pk=pk, customer=request.user)
    if booking.status != BookingStatus.CONFIRMED:
        messages.error(request, 'Checkout is only available after the provider accepts your booking.')
        return redirect('booking_detail', pk=pk)
    if request.method == 'POST':
        method = request.POST.get('payment_method')
        if method == 'CASH':
            booking.payment_method = method
            booking.status = BookingStatus.PAID
            booking.save()
            messages.success(request, 'Payment confirmed! You can now track your provider.')
            return redirect('booking_tracking', pk=pk)
    platform_fee = 10
    total = (booking.agreed_price or 0) + platform_fee
    return render(request, 'bookings/checkout.html', {'booking': booking, 'platform_fee': platform_fee, 'total': total})

@login_required
def booking_tracking(request, pk):
    booking = get_object_or_404(Booking, pk=pk, customer=request.user)
    if booking.status != BookingStatus.PAID:
        messages.error(request, 'Tracking is only available after payment is confirmed.')
        return redirect('booking_detail', pk=pk)
    return render(request, 'bookings/tracking.html', {'booking': booking})

@login_required
def booking_accept(request, pk):
    booking = get_object_or_404(Booking, id=pk, status=BookingStatus.REQUESTED)
    if getattr(request.user, 'service_provider', None) != booking.provider:
        messages.error(request, 'You do not have permission to accept this booking.')
        return redirect('bookings')
    booking.status = BookingStatus.CONFIRMED
    booking.save()
    provider_name = booking.provider.user.get_full_name() or booking.provider.user.username
    Notification.objects.create(
        user=booking.customer,
        title='Booking Accepted',
        body=f'Your booking has been accepted by {provider_name}.',
        type='booking_accepted',
        reference_id=str(booking.id),
    )
    messages.success(request, 'Booking accepted.')
    return redirect('bookings')


@login_required
def booking_reject(request, pk):
    booking = get_object_or_404(Booking, id=pk, status=BookingStatus.REQUESTED)
    if getattr(request.user, 'service_provider', None) != booking.provider:
        messages.error(request, 'You do not have permission to reject this booking.')
        return redirect('bookings')
    booking.status = BookingStatus.REJECTED
    booking.save()
    provider_name = booking.provider.user.get_full_name() or booking.provider.user.username
    Notification.objects.create(
        user=booking.customer,
        title='Booking Rejected',
        body=f'Your booking was rejected by {provider_name}.',
        type='booking_rejected',
        reference_id=str(booking.id),
    )
    messages.success(request, 'Booking rejected.')
    return redirect('bookings')


@login_required
def booking_mark_complete(request, pk):
    booking = get_object_or_404(Booking, id=pk, status=BookingStatus.PAID)
    if getattr(request.user, 'service_provider', None) != booking.provider:
        messages.error(request, 'Only the provider can mark a booking as complete.')
        return redirect('bookings')
    booking.status = BookingStatus.COMPLETED
    booking.save()
    Notification.objects.create(
        user=booking.customer,
        title='Booking Completed',
        body=f'Your booking with {booking.provider.user.get_full_name() or booking.provider.user.username} has been marked as complete.',
        type='booking_completed',
        reference_id=str(booking.id),
    )
    messages.success(request, 'Booking marked as complete.')
    return redirect('bookings')


@login_required
def bookings_list(request):
    user = request.user
    if user.account_type == AccountType.PROVIDER:
        try:
            provider = user.service_provider
            bookings = Booking.objects.filter(provider=provider).select_related('customer').order_by('-created_at')
        except ServiceProvider.DoesNotExist:
            bookings = []
    else:
        bookings = Booking.objects.filter(customer=user).select_related('provider__user').order_by('-created_at')
    return render(request, 'bookings.html', {'bookings': bookings})


@login_required
def booking_detail(request, pk):
    user = request.user
    booking = get_object_or_404(Booking, id=pk)
    if not (booking.customer == user or getattr(user, 'service_provider', None) == booking.provider or user.account_type == AccountType.ADMIN):
        messages.error(request, 'You do not have access to this booking.')
        return redirect('bookings')

    if request.method == 'POST':
        action = request.POST.get('action')
        if action == 'cancel' and booking.status in [BookingStatus.REQUESTED, BookingStatus.CONFIRMED]:
            booking.status = BookingStatus.CANCELLED
            booking.cancelled_at = timezone.now()
            booking.cancel_reason = request.POST.get('reason', '')
            booking.save()
            messages.success(request, 'Booking cancelled.')
        return redirect('booking_detail', pk=booking.id)

    messages_list = Message.objects.filter(booking=booking).order_by('created_at')
    is_provider = getattr(user, 'service_provider', None) == booking.provider
    return render(request, 'booking_detail.html', {
        'booking': booking,
        'messages_list': messages_list,
        'is_provider': is_provider,
        'is_customer': booking.customer == user,
    })


@login_required
def profile_view(request):
    user = request.user
    provider = getattr(user, 'service_provider', None)
    return render(request, 'profile.html', {'user': user, 'provider': provider})

@login_required
def profile_edit(request):
    user = request.user
    provider = getattr(user, 'service_provider', None)

    if request.method == 'POST':
        user.first_name = request.POST.get('first_name', user.first_name)
        user.last_name = request.POST.get('last_name', user.last_name)
        user.email = request.POST.get('email', user.email)
        user.phone = request.POST.get('phone', user.phone)
        user.city = request.POST.get('city', user.city)
        user.name_nepali = request.POST.get('name_nepali', user.name_nepali)
        if 'profile_photo' in request.FILES:
            user.profile_photo = request.FILES['profile_photo']
        user.save()

        if provider:
            provider.bio = request.POST.get('bio', provider.bio)
            provider.profession = request.POST.get('profession', provider.profession)
            provider.hourly_rate = request.POST.get('hourly_rate', provider.hourly_rate)
            provider.service_area = request.POST.get('service_area', provider.service_area)
            provider.experience = request.POST.get('experience', provider.experience)
            provider.save()

        messages.success(request, 'Profile updated.')
        return redirect('profile')

    return render(request, 'profile_edit.html', {'user': user, 'provider': provider})


@login_required
def ftl_list(request):
    alerts = FTLAlert.objects.filter(status__in=['OPEN', 'MATCHED']).order_by('-created_at')
    ftl_type = request.GET.get('type')
    if ftl_type:
        alerts = alerts.filter(type=ftl_type)
    return render(request, 'ftl_list.html', {'alerts': alerts, 'ftl_types': FTLType.choices})


@login_required
def ftl_detail(request, pk):
    alert = get_object_or_404(FTLAlert, id=pk)
    is_owner = alert.user == request.user
    if request.method == 'POST' and is_owner:
        action = request.POST.get('action')
        if action == 'matched' and alert.status == FTLStatus.OPEN:
            alert.status = FTLStatus.MATCHED
            alert.save()
            messages.success(request, 'Alert marked as matched.')
        elif action == 'close':
            alert.status = FTLStatus.CLOSED
            alert.save()
            messages.success(request, 'Alert closed.')
        elif action == 'delete':
            alert.delete()
            messages.success(request, 'Alert deleted.')
            return redirect('ftl_list')
        return redirect('ftl_detail', pk=alert.id)
    return render(request, 'ftl_detail.html', {'alert': alert, 'is_owner': is_owner})


@login_required
def ftl_new(request):
    if request.method == 'POST':
        FTLAlert.objects.create(
            user=request.user,
            title=request.POST.get('title', ''),
            description=request.POST.get('description', ''),
            type=request.POST.get('type', 'ITEM'),
            last_seen_location=request.POST.get('last_seen_location', ''),
            contact_method=request.POST.get('contact_method', 'PHONE'),
            contact_value=request.POST.get('contact_value', ''),
        )
        messages.success(request, 'FTL alert created.')
        return redirect('ftl_list')
    return render(request, 'ftl_new.html', {'ftl_types': FTLType.choices})


@login_required
def notifications_list(request):
    notifs = Notification.objects.filter(
        Q(user=request.user) | Q(is_global=True)
    ).order_by('-created_at')
    if request.method == 'POST':
        notifs.filter(read_at__isnull=True, is_global=False).update(read_at=timezone.now())
        return redirect('notifications')
    unread_count = notifs.filter(read_at__isnull=True).count()
    return render(request, 'notifications.html', {'notifications_list': notifs, 'unread_count': unread_count})


@login_required
def mark_notification_read(request, pk):
    if request.method == 'POST':
        n = get_object_or_404(Notification, pk=pk, user=request.user)
        n.read_at = timezone.now()
        n.save()
    return redirect('notifications')


@login_required
def messages_list(request):
    user = request.user
    if user.account_type == AccountType.PROVIDER:
        try:
            provider = user.service_provider
            booking_ids = list(Message.objects.filter(booking__provider=provider).values_list('booking_id', flat=True).distinct())
            convos = Booking.objects.filter(id__in=booking_ids).select_related('customer').order_by('-updated_at')
        except ServiceProvider.DoesNotExist:
            convos = []
    else:
        booking_ids = list(Message.objects.filter(booking__customer=user).values_list('booking_id', flat=True).distinct())
        convos = Booking.objects.filter(id__in=booking_ids).select_related('provider__user').order_by('-updated_at')

    booking_id = request.GET.get('booking')
    current_messages = []
    current_booking = None
    if booking_id:
        current_booking = get_object_or_404(Booking, id=booking_id)
        if current_booking.customer == user or getattr(user, 'service_provider', None) == current_booking.provider:
            current_messages = Message.objects.filter(booking=current_booking).order_by('created_at')
    return render(request, 'messages.html', {
        'conversation_bookings': convos,
        'current_messages': current_messages,
        'current_booking': current_booking,
    })


@login_required
def send_message(request):
    if request.method == 'POST':
        booking_id = request.POST.get('booking_id')
        text = request.POST.get('text')
        if booking_id and text:
            booking = get_object_or_404(Booking, id=booking_id)
            Message.objects.create(booking=booking, sender=request.user, text=text)
        return redirect(f"{reverse('messages')}?booking={booking_id}")
    return redirect('messages')


@login_required
def admin_panel(request):
    if request.user.account_type != AccountType.ADMIN and not request.user.is_staff:
        messages.error(request, 'Access denied.')
        return redirect('dashboard')
    return render(request, 'admin_panel.html', {
        'total_users': User.objects.count(),
        'total_providers': ServiceProvider.objects.count(),
        'total_bookings': Booking.objects.count(),
        'pending_verifications': ServiceProvider.objects.filter(verification_status='SUBMITTED').count(),
        'recent_users': User.objects.order_by('-date_joined')[:10],
        'recent_bookings': Booking.objects.select_related('customer', 'provider__user').order_by('-created_at')[:10],
    })


def tos(request):
    return render(request, 'tos.html')


def tac(request):
    return render(request, 'tac.html')
