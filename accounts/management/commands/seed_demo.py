from django.core.management.base import BaseCommand
from django.utils import timezone
from accounts.models import User, AccountType
from services.models import ServiceCategory, ServiceProvider
from bookings.models import Booking, BookingStatus
from ftl.models import FTLAlert, FTLType, FTLContactMethod, FTLStatus
from notifications.models import Notification


class Command(BaseCommand):
    help = 'Seed demo users and data for presentation'

    def handle(self, *args, **kwargs):
        from services.models import ServiceProvider
        ServiceProvider.objects.all().delete()
        print("Cleared all ServiceProviders")
        User.objects.filter(username='ram_sharma').delete()
        kept_providers = [
            'sita_adhikari','hari_gurung',
            'gita_rai','bishal_poudel','anita_kc','maya_tamang',
            'harka_langtang','kp_ba','mahesh_khasnet','rajesh_hamal',
            'shyam_hamal','ram1234',
        ]
        deleted, _ = User.objects.filter(account_type=AccountType.PROVIDER).exclude(
            username__in=kept_providers
        ).delete()
        print(f"Cleaned up {deleted} provider users")

        # ── Admin User ──
        admin, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@example.com',
                'account_type': AccountType.ADMIN,
                'first_name': 'Admin',
                'is_active': True,
                'is_staff': True,
                'is_email_verified': True,
            },
        )
        if created:
            admin.set_password('admin1234')
            admin.save()
            self.stdout.write('  Created user: admin')
        else:
            self.stdout.write('  Found existing: admin')

        # ── Service Categories ──
        categories = {
            'Plumber': None,
            'Electrician': None,
            'Carpenter': None,
            'Painter': None,
            'AC Tech': None,
            'Repair': None,
            'Cleaner': None,
            'Tutor': None,
        }
        for name in categories:
            cat, created = ServiceCategory.objects.get_or_create(name=name)
            if created:
                self.stdout.write(f'  Created category: {name}')

        cat_plumber = ServiceCategory.objects.get(name='Plumber')
        cat_electrician = ServiceCategory.objects.get(name='Electrician')
        cat_carpenter = ServiceCategory.objects.get(name='Carpenter')
        cat_cleaner = ServiceCategory.objects.get(name='Cleaner')
        cat_tutor = ServiceCategory.objects.get(name='Tutor')
        cat_repair = ServiceCategory.objects.get(name='Repair')
        cat_ac = ServiceCategory.objects.get(name='AC Tech')
        cat_painter = ServiceCategory.objects.get(name='Painter')

        # ── Demo Customer (rk1234) ──
        customer, created = User.objects.get_or_create(
            username='rk1234',
            defaults={
                'email': 'rk1234@example.com',
                'phone': '9864997037',
                'account_type': AccountType.CUSTOMER,
                'first_name': 'Roshan',
                'last_name': 'Tamang',
                'city': 'Kathmandu',
                'name_nepali': 'रोशन तामाङ',
                'is_active': True,
                'is_phone_verified': True,
                'is_email_verified': True,
            },
        )
        if created:
            customer.set_password('test1234')
        else:
            if customer.account_type != AccountType.CUSTOMER:
                customer.account_type = AccountType.CUSTOMER
        customer.email = 'rk1234@example.com'
        customer.name_nepali = 'रोशन तामाङ'
        customer.profile_photo = 'profiles/rk1234.png'
        customer.set_password('test1234')
        customer.save()
        self.stdout.write(f"{'  Created' if created else '  Found existing'} user: rk1234 (customer)")

        # ── Demo Customer (testcustomer) ──
        test_customer, created = User.objects.get_or_create(
            username='testcustomer',
            defaults={
                'email': 'testcustomer@example.com',
                'phone': '9840000000',
                'account_type': AccountType.CUSTOMER,
                'first_name': 'Test',
                'last_name': 'Customer',
                'city': 'Kathmandu',
                'is_active': True,
                'is_phone_verified': True,
                'is_email_verified': True,
            },
        )
        if created:
            test_customer.set_password('test1234')
        else:
            if test_customer.account_type != AccountType.CUSTOMER:
                test_customer.account_type = AccountType.CUSTOMER
        test_customer.email = 'testcustomer@example.com'
        test_customer.set_password('test1234')
        test_customer.save()
        self.stdout.write(f"{'  Created' if created else '  Found existing'} user: testcustomer (customer)")

        # ── Demo Provider (ram1234) ──
        provider_user, created = User.objects.get_or_create(
            username='ram1234',
            defaults={
                'email': 'ram1234@example.com',
                'phone': '9841234567',
                'account_type': AccountType.PROVIDER,
                'first_name': 'Ram',
                'last_name': 'Karki',
                'city': 'Kathmandu',
                'name_nepali': 'राम कार्की',
                'is_active': True,
                'is_phone_verified': True,
                'is_email_verified': True,
            },
        )
        if created:
            provider_user.set_password('test1234')
        else:
            if provider_user.account_type != AccountType.PROVIDER:
                provider_user.account_type = AccountType.PROVIDER
        provider_user.email = 'ram1234@example.com'
        provider_user.name_nepali = 'राम कार्की'
        provider_user.city = 'Kathmandu'
        provider_user.profile_photo = ''
        provider_user.set_password('test1234')
        provider_user.save()
        self.stdout.write(f"{'  Created' if created else '  Found existing'} user: ram1234 (provider)")

        # ── ServiceProvider profile for ram1234 ──
        provider_profile, created = ServiceProvider.objects.get_or_create(
            user=provider_user,
            defaults={
                'category': cat_plumber,
                'profession': 'Plumber',
                'bio': 'Experienced plumber with 10+ years in Kathmandu valley.',
                'hourly_rate': 500,
                'service_area': 'Patan',
                'skills': ['pipe repair', 'water heater install', 'drain cleaning'],
                'languages': ['Nepali', 'English', 'Hindi'],
                'is_available': False,
                'latitude': 27.7041,
                'longitude': 85.3145,
                'average_rating': 4.5,
                'total_jobs_completed': 120,
                'verification_status': 'APPROVED',
            },
        )
        provider_profile.latitude = 27.7041
        provider_profile.longitude = 85.3145
        provider_profile.service_area = 'Patan'
        provider_profile.average_rating = 4.5
        provider_profile.total_jobs_completed = 120
        provider_profile.verification_status = 'APPROVED'
        provider_profile.save()
        self.stdout.write(f"{'  Created' if created else '  Found existing'} ServiceProvider: ram1234")

        # ── Extra providers for services browsing ──
        extra_providers = [
            dict(username='sita_adhikari', email='sita@example.com', fn='Sita', ln='Adhikari', cat=cat_electrician, prof='Electrician', rate=600, area='Jawalakhel', photo='', lat=27.6933, lng=85.3164, bio='Experienced electrician with 95+ jobs in Lalitpur.', rating=4.8, jobs=95),
            dict(username='hari_gurung', email='hari@example.com', fn='Hari', ln='Gurung', cat=cat_carpenter, prof='Carpenter', rate=450, area='Baneshwor', photo='profiles/hari_gurung.png', lat=27.7192, lng=85.3423, bio='Experienced carpenter with 67+ jobs in Kathmandu.', rating=4.2, jobs=67),
            dict(username='gita_rai', email='gita@example.com', fn='Gita', ln='Rai', cat=cat_painter, prof='Painter', rate=350, area='Bhaktapur', photo='', lat=27.6711, lng=85.4298, bio='Experienced painter with 88+ jobs in Bhaktapur.', rating=4.6, jobs=88),
            dict(username='bishal_poudel', email='bishal@example.com', fn='Bishal', ln='Poudel', cat=cat_ac, prof='AC Tech', rate=800, area='Lazimpat', photo='profiles/bishalpoudel.png', lat=27.7369, lng=85.3306, bio='AC repair and maintenance expert with 10+ years experience.', rating=4.9, jobs=210),
            dict(username='anita_kc', email='anita@example.com', fn='Anita', ln='KC', cat=cat_cleaner, prof='Cleaner', rate=250, area='Jawalakhel', photo='', lat=27.6933, lng=85.3164, bio='Experienced cleaner with 150+ jobs in Lalitpur.', rating=4.3, jobs=150),
            dict(username='maya_tamang', email='maya@example.com', fn='Maya', ln='Tamang', cat=cat_tutor, prof='Tutor', rate=300, area='Kumaripati', photo='', lat=27.7089, lng=85.3217, bio='Mathematics and Science tutor for grades 5-10.', rating=4.7, jobs=45),
            dict(username='harka_langtang', email='harka@example.com', fn='Harka', ln='Langtang', cat=cat_electrician, prof='Electrician', rate=600, area='Jawalakhel', photo='profiles/harka_lamtang.png', lat=27.6933, lng=85.3164, bio='Experienced electrician with 95+ jobs in Lalitpur.', rating=4.8, jobs=95),
            dict(username='kp_ba', email='kp@example.com', fn='KP', ln='Ba', cat=cat_painter, prof='Painter', rate=350, area='Bhaktapur', photo='profiles/kp_ba.png', lat=27.6711, lng=85.4298, bio='Experienced painter with 88+ jobs in Bhaktapur.', rating=4.6, jobs=88),
            dict(username='mahesh_khasnet', email='mahesh@example.com', fn='Mahesh', ln='Khasnet', cat=cat_cleaner, prof='Cleaner', rate=250, area='Jawalakhel', photo='profiles/mahesh_khasnet.png', lat=27.6933, lng=85.3164, bio='Experienced cleaner with 150+ jobs in Lalitpur.', rating=4.3, jobs=150),
            dict(username='rajesh_hamal', email='rajesh@example.com', fn='Rajesh', ln='Hamal', cat=cat_repair, prof='Repair Tech', rate=550, area='Ekantakuna', photo='profiles/rajesh_hamal.png', lat=27.7086, lng=85.3156, bio='Home appliance repair specialist with 7+ years experience.', rating=4.4, jobs=75),
            dict(username='shyam_hamal', email='shyam@example.com', fn='Shyam', ln='Hamal', cat=cat_tutor, prof='Tutor', rate=300, area='Kumaripati', photo='profiles/shyam_hamal.png', lat=27.7089, lng=85.3217, bio='Experienced tutor with 45+ jobs in Kathmandu.', rating=4.7, jobs=45),
        ]
        for p in extra_providers:
            u, created = User.objects.get_or_create(
                username=p['username'],
                defaults=dict(
                    email=p['email'],
                    phone=None,
                    account_type=AccountType.PROVIDER,
                    first_name=p['fn'],
                    last_name=p['ln'],
                    city=p['area'],
                    is_active=True,
                    is_email_verified=True,
                ),
            )
            if created:
                u.set_password('demo1234')
            u.set_password('demo1234')
            if p['photo']:
                u.profile_photo = p['photo']
            u.save()
            self.stdout.write(f"{'  Created' if created else '  Found existing'} user: {p['username']}")

            sp, sp_created = ServiceProvider.objects.get_or_create(
                user=u,
                defaults=dict(
                    category=p['cat'],
                    profession=p['prof'],
                    bio=p['bio'],
                    hourly_rate=p['rate'],
                    service_area=p['area'],
                    skills=[p['prof'], 'Customer Service'],
                    languages=['Nepali', 'English'],
                    is_available=True,
                    latitude=p['lat'],
                    longitude=p['lng'],
                    average_rating=p['rating'],
                    total_jobs_completed=p['jobs'],
                    verification_status='APPROVED',
                ),
            )
            sp.latitude = p['lat']
            sp.longitude = p['lng']
            sp.service_area = p['area']
            sp.average_rating = p['rating']
            sp.total_jobs_completed = p['jobs']
            sp.verification_status = 'APPROVED'
            sp.save()
            if sp_created:
                self.stdout.write(f"  Created ServiceProvider: {p['username']}")

        # ── Demo Bookings ──
        now = timezone.now()

        booking1, _ = Booking.objects.get_or_create(
            customer=customer,
            provider=provider_profile,
            job_description='Need plumbing repair for kitchen sink',
            defaults=dict(
                status=BookingStatus.REQUESTED,
                job_address='Kamal Pokhari, Kathmandu',
                scheduled_date=now + timezone.timedelta(hours=3),
                agreed_price=500,
                provider_lat=27.7041,
                provider_lng=85.3145,
                destination_lat=27.7172,
                destination_lng=85.3240,
            ),
        )
        if _:
            self.stdout.write('  Created booking: Kitchen sink repair')
        booking1.provider_lat = 27.7041
        booking1.provider_lng = 85.3145
        booking1.destination_lat = 27.7172
        booking1.destination_lng = 85.3240
        booking1.save(update_fields=['provider_lat', 'provider_lng', 'destination_lat', 'destination_lng'])

        booking2, _ = Booking.objects.get_or_create(
            customer=customer,
            provider=provider_profile,
            job_description='Water heater installation',
            defaults=dict(
                status=BookingStatus.CONFIRMED,
                job_address='Thamel, Kathmandu',
                scheduled_date=now + timezone.timedelta(days=1),
                agreed_price=1500,
                provider_lat=27.7041,
                provider_lng=85.3145,
                destination_lat=27.7172,
                destination_lng=85.3240,
            ),
        )
        if _:
            self.stdout.write('  Created booking: Water heater install')
        booking2.provider_lat = 27.7041
        booking2.provider_lng = 85.3145
        booking2.destination_lat = 27.7172
        booking2.destination_lng = 85.3240
        booking2.save(update_fields=['provider_lat', 'provider_lng', 'destination_lat', 'destination_lng'])

        booking3, _ = Booking.objects.get_or_create(
            customer=customer,
            provider=provider_profile,
            job_description='Bathroom pipe leakage repair',
            defaults=dict(
                status=BookingStatus.IN_PROGRESS,
                job_address='Baneshwor, Kathmandu',
                scheduled_date=now - timezone.timedelta(hours=1),
                agreed_price=800,
                provider_lat=27.7041,
                provider_lng=85.3145,
                destination_lat=27.7172,
                destination_lng=85.3240,
            ),
        )
        if _:
            self.stdout.write('  Created booking: Bathroom pipe repair')
        booking3.provider_lat = 27.7041
        booking3.provider_lng = 85.3145
        booking3.destination_lat = 27.7172
        booking3.destination_lng = 85.3240
        booking3.save(update_fields=['provider_lat', 'provider_lng', 'destination_lat', 'destination_lng'])

        # ── Demo FTL Alerts ──
        ftl1, _ = FTLAlert.objects.get_or_create(
            user=customer,
            type=FTLType.PERSON,
            title='Missing elderly man near Thamel',
            defaults=dict(
                description='Last seen near Thamel Chowk wearing a brown coat.',
                last_seen_location='Thamel, Kathmandu',
                latitude=27.7172,
                longitude=85.3240,
                contact_method=FTLContactMethod.PHONE,
                contact_value='9864997037',
                status=FTLStatus.OPEN,
            ),
        )
        if _:
            ftl1.image = 'ftl/elder_man.png'
            ftl1.save()
            self.stdout.write('  Created FTL alert: Missing elderly man')
        else:
            ftl1.image = 'ftl/elder_man.png'
            ftl1.save(update_fields=['image'])

        ftl2, _ = FTLAlert.objects.get_or_create(
            user=customer,
            type=FTLType.PET,
            title='Lost brown dog — responds to "Bruno"',
            defaults=dict(
                description='Brown Labrador, last seen near Ratna Park.',
                last_seen_location='Ratna Park, Kathmandu',
                latitude=27.7050,
                longitude=85.3200,
                contact_method=FTLContactMethod.IN_APP,
                status=FTLStatus.OPEN,
            ),
        )
        if _:
            ftl2.image = 'ftl/bruno.png'
            ftl2.save()
            self.stdout.write('  Created FTL alert: Lost dog')
        else:
            ftl2.image = 'ftl/bruno.png'
            ftl2.save(update_fields=['image'])

        # ── Demo Notifications ──
        notif_types = [
            ('Booking Confirmed', 'Your booking for kitchen sink repair has been confirmed.', 'booking_confirmed', str(booking1.id)),
            ('Provider Assigned', 'Ram Karki has been assigned to your booking.', 'provider_assigned', str(booking2.id)),
            ('FTL Alert Created', 'Your FTL alert "Missing elderly man near Thamel" is now live.', 'ftl_created', str(ftl1.id)),
        ]
        for title, body, ntype, ref_id in notif_types:
            n, created = Notification.objects.get_or_create(
                user=customer,
                title=title,
                body=body,
                type=ntype,
                reference_id=ref_id,
                defaults=dict(is_global=False),
            )
            if created:
                self.stdout.write(f'  Created notification: {title}')

        global_notif, _ = Notification.objects.get_or_create(
            user=customer,
            title='🚨 Global Alert: Safety Notice',
            defaults=dict(
                body='Heavy rainfall expected in Kathmandu valley. Stay safe and avoid travel unless necessary.',
                type='global_alert',
                is_global=True,
            ),
        )
        if _:
            self.stdout.write('  Created global notification')

        User.objects.filter(account_type=AccountType.PROVIDER).update(city='Kathmandu')
        self.stdout.write(self.style.SUCCESS('Demo data seeded successfully!'))
