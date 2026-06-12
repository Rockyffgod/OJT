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
        customer.profile_photo = None
        customer.set_password('test1234')
        customer.save()
        self.stdout.write(f"{'  Created' if created else '  Found existing'} user: rk1234 (customer)")

        # ── Demo Provider (ram1234) ──
        provider_user, created = User.objects.get_or_create(
            username='ram1234',
            defaults={
                'email': 'ram1234@example.com',
                'phone': '9841234567',
                'account_type': AccountType.PROVIDER,
                'first_name': 'Ram',
                'last_name': 'Sharma',
                'city': 'Kathmandu',
                'name_nepali': 'राम शर्मा',
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
        provider_user.name_nepali = 'राम शर्मा'
        provider_user.city = 'Kathmandu'
        provider_user.profile_photo = None
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
                'service_area': 'Kathmandu',
                'skills': ['pipe repair', 'water heater install', 'drain cleaning'],
                'languages': ['Nepali', 'English', 'Hindi'],
                'is_available': True,
                'latitude': 27.7172,
                'longitude': 85.3240,
            },
        )
        self.stdout.write(f"{'  Created' if created else '  Found existing'} ServiceProvider: ram_sharma")

        # ── Additional providers for browsing ──
        additional_providers = [
            dict(username='anita_cleaner', email='anita.cleaner@karma.com', fn='Anita', ln='KC',
                 phone='9841111111', photo='', name_nepali='अनिता के.सी.',
                 cat=cat_cleaner, prof='Cleaner', rate=250, area='Lalitpur',
                 bio='Experienced cleaner with 150+ jobs completed.'),
            dict(username='bishal_actech', email='bishal.actech@karma.com', fn='Bishal', ln='Poudel',
                 phone='9842222222', photo='bishalpoudel', name_nepali='विशाल पौडेल',
                 cat=cat_ac, prof='AC Technician', rate=800, area='Kathmandu',
                 bio='AC repair and maintenance expert with 10+ years experience.'),
            dict(username='maya_tutor', email='maya.tutor@karma.com', fn='Maya', ln='Tamang',
                 phone='9843333333', photo='', name_nepali='माया तामाङ',
                 cat=cat_tutor, prof='Tutor', rate=300, area='Kathmandu',
                 bio='Mathematics and Science tutor for grades 5-10.'),
            dict(username='rajesh_repair', email='rajesh.repair@karma.com', fn='Rajesh', ln='Hamal',
                 phone='9844444444', photo='rajesh_hamal', name_nepali='राजेश हमाल',
                 cat=cat_repair, prof='Repair Technician', rate=550, area='Kathmandu',
                 bio='Home appliance repair specialist with 7+ years experience.'),
        ]
        for p in additional_providers:
            u, created = User.objects.get_or_create(
                username=p['username'],
                defaults=dict(
                    email=p['email'],
                    phone=p['phone'],
                    account_type=AccountType.PROVIDER,
                    first_name=p['fn'],
                    last_name=p['ln'],
                    city='Kathmandu',
                    name_nepali=p['name_nepali'],
                    is_active=True,
                    is_phone_verified=True,
                    is_email_verified=True,
                ),
            )
            if created:
                u.set_password('demo1234')
            u.name_nepali = p['name_nepali']
            u.city = 'Kathmandu'
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
                    skills=['general service'],
                    languages=['Nepali', 'English'],
                    is_available=True,
                ),
            )
            if sp_created:
                self.stdout.write(f"  Created ServiceProvider: {p['username']}")

        # ── Extra providers for services browsing ──
        extra_providers = [
            dict(username='ram_sharma', email='ram@example.com', fn='Ram', ln='Sharma', cat=cat_plumber, prof='Plumber', rate=500, area='Kathmandu'),
            dict(username='sita_adhikari', email='sita@example.com', fn='Sita', ln='Adhikari', cat=cat_electrician, prof='Electrician', rate=600, area='Lalitpur'),
            dict(username='hari_gurung', email='hari@example.com', fn='Hari', ln='Gurung', cat=cat_carpenter, prof='Carpenter', rate=450, area='Kathmandu'),
            dict(username='gita_rai', email='gita@example.com', fn='Gita', ln='Rai', cat=cat_painter, prof='Painter', rate=350, area='Bhaktapur'),
            dict(username='bishal_poudel', email='bishal@example.com', fn='Bishal', ln='Poudel', cat=cat_ac, prof='AC Tech', rate=800, area='Kathmandu'),
            dict(username='anita_kc', email='anita@example.com', fn='Anita', ln='KC', cat=cat_cleaner, prof='Cleaner', rate=250, area='Lalitpur'),
            dict(username='maya_tamang', email='maya@example.com', fn='Maya', ln='Tamang', cat=cat_tutor, prof='Tutor', rate=300, area='Kathmandu'),
            dict(username='harka_langtang', email='harka@example.com', fn='Harka', ln='Langtang', cat=cat_electrician, prof='Electrician', rate=600, area='Lalitpur'),
            dict(username='kp_ba', email='kp@example.com', fn='KP', ln='Ba', cat=cat_painter, prof='Painter', rate=350, area='Bhaktapur'),
            dict(username='mahesh_khasnet', email='mahesh@example.com', fn='Mahesh', ln='Khasnet', cat=cat_cleaner, prof='Cleaner', rate=250, area='Lalitpur'),
            dict(username='rajesh_hamal', email='rajesh@example.com', fn='Rajesh', ln='Hamal', cat=cat_repair, prof='Repair Tech', rate=550, area='Kathmandu'),
            dict(username='shyam_hamal', email='shyam@example.com', fn='Shyam', ln='Hamal', cat=cat_tutor, prof='Tutor', rate=300, area='Kathmandu'),
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
            u.save()
            self.stdout.write(f"{'  Created' if created else '  Found existing'} user: {p['username']}")

            sp, sp_created = ServiceProvider.objects.get_or_create(
                user=u,
                defaults=dict(
                    category=p['cat'],
                    profession=p['prof'],
                    hourly_rate=p['rate'],
                    service_area=p['area'],
                    skills=[p['prof'], 'Customer Service'],
                    languages=['Nepali', 'English'],
                    is_available=True,
                ),
            )
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
            ),
        )
        if _:
            self.stdout.write('  Created booking: Kitchen sink repair')

        booking2, _ = Booking.objects.get_or_create(
            customer=customer,
            provider=provider_profile,
            job_description='Water heater installation',
            defaults=dict(
                status=BookingStatus.CONFIRMED,
                job_address='Thamel, Kathmandu',
                scheduled_date=now + timezone.timedelta(days=1),
                agreed_price=1500,
            ),
        )
        if _:
            self.stdout.write('  Created booking: Water heater install')

        booking3, _ = Booking.objects.get_or_create(
            customer=customer,
            provider=provider_profile,
            job_description='Bathroom pipe leakage repair',
            defaults=dict(
                status=BookingStatus.IN_PROGRESS,
                job_address='Baneshwor, Kathmandu',
                scheduled_date=now - timezone.timedelta(hours=1),
                agreed_price=800,
            ),
        )
        if _:
            self.stdout.write('  Created booking: Bathroom pipe repair')

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
            ftl1.image = 'kp_ba'
            ftl1.save()
            self.stdout.write('  Created FTL alert: Missing elderly man')
        else:
            ftl1.image = 'kp_ba'
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
            ftl2.image = 'shyam_hamal'
            ftl2.save()
            self.stdout.write('  Created FTL alert: Lost dog')
        else:
            ftl2.image = 'shyam_hamal'
            ftl2.save(update_fields=['image'])

        # ── Demo Notifications ──
        notif_types = [
            ('Booking Confirmed', 'Your booking for kitchen sink repair has been confirmed.', 'booking_confirmed', str(booking1.id)),
            ('Provider Assigned', 'Ram Sharma has been assigned to your booking.', 'provider_assigned', str(booking2.id)),
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
