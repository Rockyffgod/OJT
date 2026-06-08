from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from services.models import ServiceCategory, ServiceProvider
from accounts.models import AccountType, VerificationStatus

User = get_user_model()

PROVIDERS = [
    {"name": "Ram Sharma", "email": "ram@example.com", "profession": "Plumber", "category": "Plumber",
     "lat": 27.7172, "lng": 85.3240, "area": "Kathmandu", "rate": 500, "rating": 4.5, "jobs": 120, "karma": "GOLD", "karma_pts": 850},
    {"name": "Sita Adhikari", "email": "sita@example.com", "profession": "Electrician", "category": "Electrician",
     "lat": 27.6850, "lng": 85.3350, "area": "Lalitpur", "rate": 600, "rating": 4.8, "jobs": 95, "karma": "GOLD", "karma_pts": 920},
    {"name": "Hari Gurung", "email": "hari@example.com", "profession": "Carpenter", "category": "Carpenter",
     "lat": 27.7050, "lng": 85.3100, "area": "Kathmandu", "rate": 450, "rating": 4.2, "jobs": 67, "karma": "SILVER", "karma_pts": 450},
    {"name": "Gita Rai", "email": "gita@example.com", "profession": "Painter", "category": "Painter",
     "lat": 27.7300, "lng": 85.3400, "area": "Bhaktapur", "rate": 350, "rating": 4.6, "jobs": 88, "karma": "SILVER", "karma_pts": 520},
    {"name": "Bishal Thapa", "email": "bishal@example.com", "profession": "AC Technician", "category": "AC Tech",
     "lat": 27.6900, "lng": 85.3000, "area": "Kathmandu", "rate": 800, "rating": 4.9, "jobs": 210, "karma": "PLATINUM", "karma_pts": 1500},
    {"name": "Anita KC", "email": "anita@example.com", "profession": "Cleaner", "category": "Cleaner",
     "lat": 27.7200, "lng": 85.3550, "area": "Lalitpur", "rate": 250, "rating": 4.3, "jobs": 150, "karma": "SILVER", "karma_pts": 380},
    {"name": "Prakash Poudel", "email": "prakash@example.com", "profession": "Repair Technician", "category": "Repair",
     "lat": 27.7100, "lng": 85.2900, "area": "Kathmandu", "rate": 550, "rating": 4.4, "jobs": 75, "karma": "BRONZE", "karma_pts": 280},
    {"name": "Maya Tamang", "email": "maya@example.com", "profession": "Tutor", "category": "Tutor",
     "lat": 27.6950, "lng": 85.3250, "area": "Kathmandu", "rate": 300, "rating": 4.7, "jobs": 45, "karma": "BRONZE", "karma_pts": 200},
    {"name": "Raju Maharjan", "email": "raju@example.com", "profession": "Plumber", "category": "Plumber",
     "lat": 27.6800, "lng": 85.3450, "area": "Lalitpur", "rate": 400, "rating": 4.1, "jobs": 55, "karma": "SILVER", "karma_pts": 310},
    {"name": "Sunita Sharma", "email": "sunita@example.com", "profession": "Electrician", "category": "Electrician",
     "lat": 27.7250, "lng": 85.3150, "area": "Bhaktapur", "rate": 650, "rating": 4.6, "jobs": 80, "karma": "GOLD", "karma_pts": 780},
]


class Command(BaseCommand):
    help = 'Seed test provider data into Django'

    def handle(self, *args, **options):
        for cat_name in ["Plumber", "Electrician", "Carpenter", "Painter", "AC Tech", "Repair", "Cleaner", "Tutor"]:
            ServiceCategory.objects.get_or_create(name=cat_name, defaults={"icon": "🔧"})

        for p in PROVIDERS:
            user = User.objects.filter(email=p["email"]).first()
            if not user:
                user = User(email=p["email"])

            username = p["name"].lower().replace(" ", "_")
            user.username = username
            user.account_type = AccountType.PROVIDER
            user.city = p["area"]
            parts = p["name"].split(' ', 1)
            user.first_name = parts[0]
            user.last_name = parts[1] if len(parts) > 1 else ''
            user.set_password("password123")
            user.save()

            category = ServiceCategory.objects.filter(name=p["category"]).first()

            ServiceProvider.objects.update_or_create(
                user=user,
                defaults={
                    "profession": p["profession"],
                    "category": category,
                    "service_area": p["area"],
                    "hourly_rate": p["rate"],
                    "average_rating": p["rating"],
                    "total_jobs_completed": p["jobs"],
                    "karma_points": p["karma_pts"],
                    "karma_level": p["karma"],
                    "latitude": p["lat"],
                    "longitude": p["lng"],
                    "verification_status": VerificationStatus.APPROVED,
                    "is_available": True,
                    "bio": f"Experienced {p['profession'].lower()} with {p['jobs']}+ jobs completed in {p['area']}.",
                    "skills": [p["profession"], "Customer Service"],
                    "languages": ["Nepali", "English"],
                    "profile_completion": 100,
                }
            )
            self.stdout.write(f"OK Seeded {p['name']} ({p['profession']})")
