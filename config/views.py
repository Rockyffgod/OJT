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
        email = request.POST.get('email')
        password = request.POST.get('password')
        user = authenticate(request, email=email, password=password)
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
            return render(request, 'signup.html')
        if len(password1) < 8:
            messages.error(request, 'Password must be at least 8 characters.')
            return render(request, 'signup.html')
        if User.objects.filter(email=email).exists():
            messages.error(request, 'Email already registered.')
            return render(request, 'signup.html')
        if User.objects.filter(username=username).exists():
            messages.error(request, 'Username already taken.')
            return render(request, 'signup.html')

        user = User.objects.create_user(
            username=username, email=email, password=password1,
            first_name=first_name, last_name=last_name,
            phone=phone, city=city, account_type=account_type,
        )
        if account_type == 'PROVIDER':
            service_map = {
                'plumber': 'Plumber', 'electrician': 'Electrician',
                'carpenter': 'Carpenter', 'painter': 'Painter',
                'ac_technician': 'AC Tech', 'appliance_repair': 'Repair',
                'cleaner': 'Cleaner', 'tutor': 'Tutor',
            }
            selected = request.POST.getlist('service_categories')
            if selected:
                first_cat_name = service_map.get(selected[0], '')
                first_cat = ServiceCategory.objects.filter(name=first_cat_name).first()
                skills = [service_map.get(s, s) for s in selected if service_map.get(s)]
                ServiceProvider.objects.create(
                    user=user,
                    profession=first_cat_name,
                    category=first_cat,
                    skills=skills,
                )
        login(request, user)
        messages.success(request, 'Account created successfully!')
        return redirect('dashboard')
    return render(request, 'signup.html')


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
        verification_status='APPROVED', is_available=True
    ).select_related('user', 'category').order_by('-average_rating')

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
    return render(request, 'services.html', {
        'categories': categories,
        'providers': providers,
        'selected_category': category_id,
        'search': search,
    })


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
        elif action == 'accept' and booking.status == BookingStatus.REQUESTED and getattr(user, 'service_provider', None) == booking.provider:
            booking.status = BookingStatus.CONFIRMED
            booking.save()
            messages.success(request, 'Booking accepted.')
        elif action == 'complete' and booking.status in [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS] and getattr(user, 'service_provider', None) == booking.provider:
            booking.status = BookingStatus.COMPLETED
            booking.completed_at = timezone.now()
            booking.save()
            messages.success(request, 'Booking marked complete.')
        elif action == 'arrived' and booking.status in [BookingStatus.CONFIRMED] and getattr(user, 'service_provider', None) == booking.provider:
            booking.arrived_at = timezone.now()
            booking.status = BookingStatus.IN_PROGRESS
            booking.save()
            messages.success(request, 'Arrival confirmed.')
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
