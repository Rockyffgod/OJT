import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.core.files import File
from services.models import ServiceCategory, ServiceProvider
from accounts.models import AccountType, VerificationStatus

User = get_user_model()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
MEDIA_PROFILES = os.path.join(BASE_DIR, 'media', 'profiles')

PHOTO_MAP = {
    "ram@example.com": "ramsharma.png",
    "hari@example.com": "hari_gurung.png",
    "bishal@example.com": "bishalpoudel.png",
    "harka@example.com": "harka_lamtang.png",
    "kp@example.com": "kp_ba.png",
    "mahesh@example.com": "mahesh_khasnet.png",
    "rajesh@example.com": "rajesh_hamal.png",
    "shyam@example.com": "shyam_hamal.png",
}

PROVIDERS = [
    {"name": "Ram Sharma", "name_nepali": "राम शर्मा", "email": "ram@example.com", "profession": "Plumber", "category": "Plumber",
     "lat": 27.7172, "lng": 85.3240, "area": "Kathmandu", "rate": 500, "rating": 4.5, "jobs": 120, "karma": "GOLD", "karma_pts": 850},
    {"name": "Hari Gurung", "name_nepali": "हरि गुरुङ", "email": "hari@example.com", "profession": "Carpenter", "category": "Carpenter",
     "lat": 27.7050, "lng": 85.3100, "area": "Kathmandu", "rate": 450, "rating": 4.2, "jobs": 67, "karma": "SILVER", "karma_pts": 450},
    {"name": "Bishal Poudel", "name_nepali": "विशाल पौडेल", "email": "bishal@example.com", "profession": "AC Technician", "category": "AC Tech",
     "lat": 27.6900, "lng": 85.3000, "area": "Kathmandu", "rate": 800, "rating": 4.9, "jobs": 210, "karma": "PLATINUM", "karma_pts": 1500},
    {"name": "Harka Langtang", "name_nepali": "हर्क लाङटाङ", "email": "harka@example.com", "profession": "Electrician", "category": "Electrician",
     "lat": 27.6850, "lng": 85.3350, "area": "Lalitpur", "rate": 600, "rating": 4.8, "jobs": 95, "karma": "GOLD", "karma_pts": 920},
    {"name": "KP Ba", "name_nepali": "केपी बा", "email": "kp@example.com", "profession": "Painter", "category": "Painter",
     "lat": 27.7300, "lng": 85.3400, "area": "Bhaktapur", "rate": 350, "rating": 4.6, "jobs": 88, "karma": "SILVER", "karma_pts": 520},
    {"name": "Mahesh Khasnet", "name_nepali": "महेश खस्नेत", "email": "mahesh@example.com", "profession": "Cleaner", "category": "Cleaner",
     "lat": 27.7200, "lng": 85.3550, "area": "Lalitpur", "rate": 250, "rating": 4.3, "jobs": 150, "karma": "SILVER", "karma_pts": 380},
    {"name": "Rajesh Hamal", "name_nepali": "राजेश हमाल", "email": "rajesh@example.com", "profession": "Repair Technician", "category": "Repair",
     "lat": 27.7100, "lng": 85.2900, "area": "Kathmandu", "rate": 550, "rating": 4.4, "jobs": 75, "karma": "BRONZE", "karma_pts": 280},
    {"name": "Shyam Hamal", "name_nepali": "श्याम हमाल", "email": "shyam@example.com", "profession": "Tutor", "category": "Tutor",
     "lat": 27.6950, "lng": 85.3250, "area": "Kathmandu", "rate": 300, "rating": 4.7, "jobs": 45, "karma": "BRONZE", "karma_pts": 200},
]

DEMOS = [
    {"name": "Sita Adhikari", "name_nepali": "सीता अधिकारी", "email": "sita@example.com", "profession": "Electrician", "category": "Electrician",
     "lat": 27.6850, "lng": 85.3350, "area": "Lalitpur", "rate": 600, "rating": 4.8, "jobs": 95, "karma": "GOLD", "karma_pts": 920},
    {"name": "Gita Rai", "name_nepali": "गीता राई", "email": "gita@example.com", "profession": "Painter", "category": "Painter",
     "lat": 27.7300, "lng": 85.3400, "area": "Bhaktapur", "rate": 350, "rating": 4.6, "jobs": 88, "karma": "SILVER", "karma_pts": 520},
    {"name": "Anita KC", "name_nepali": "अनिता केसी", "email": "anita@example.com", "profession": "Cleaner", "category": "Cleaner",
     "lat": 27.7200, "lng": 85.3550, "area": "Lalitpur", "rate": 250, "rating": 4.3, "jobs": 150, "karma": "SILVER", "karma_pts": 380},
    {"name": "Maya Tamang", "name_nepali": "माया तामाङ", "email": "maya@example.com", "profession": "Tutor", "category": "Tutor",
     "lat": 27.6950, "lng": 85.3250, "area": "Kathmandu", "rate": 300, "rating": 4.7, "jobs": 45, "karma": "BRONZE", "karma_pts": 200},
]


def create_user(p, is_admin=False):
    user = User.objects.filter(email=p["email"]).first()
    if not user:
        user = User(email=p["email"])
    username = p["name"].lower().replace(" ", "_")
    user.username = username
    user.account_type = AccountType.ADMIN if is_admin else AccountType.PROVIDER
    user.city = p.get("area", "")
    parts = p["name"].split(" ", 1)
    user.first_name = parts[0]
    user.last_name = parts[1] if len(parts) > 1 else ""
    user.name_nepali = p.get("name_nepali", "")
    user.set_password("test1234")
    if is_admin:
        user.is_staff = True
        user.is_superuser = True
    user.save()
    return user


def assign_photo(user, email):
    filename = PHOTO_MAP.get(email)
    if not filename:
        User.objects.filter(id=user.id).update(profile_photo=None)
        return False
    src = os.path.join(MEDIA_PROFILES, filename)
    if not os.path.exists(src):
        return False
    dest = os.path.join(MEDIA_PROFILES, filename)
    from django.conf import settings
    media_dest = os.path.join(settings.MEDIA_ROOT, 'profiles', filename)
    if not os.path.exists(media_dest):
        import shutil
        os.makedirs(os.path.dirname(media_dest), exist_ok=True)
        shutil.copy2(src, media_dest)
    User.objects.filter(id=user.id).update(profile_photo='profiles/' + filename)
    return True


def create_provider(user, p):
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
        },
    )


class Command(BaseCommand):
    help = "Seed demo provider data (8 named + 4 demos + 1 admin)"

    def handle(self, *args, **options):
        for cat_name in ["Plumber", "Electrician", "Carpenter", "Painter", "AC Tech", "Repair", "Cleaner", "Tutor"]:
            ServiceCategory.objects.get_or_create(name=cat_name, defaults={"icon": "\U0001f527"})

        for p in PROVIDERS:
            user = create_user(p)
            assign_photo(user, p["email"])
            create_provider(user, p)
            photo_status = " + photo" if user.profile_photo else ""
            self.stdout.write(f"OK Seeded {p['name']} ({p['profession']}){photo_status}")

        for p in DEMOS:
            user = create_user(p)
            User.objects.filter(id=user.id).update(profile_photo=None)
            create_provider(user, p)
            self.stdout.write(f"OK Seeded demo {p['name']} ({p['profession']})")

        admin_data = {"name": "Admin", "email": "admin@example.com", "area": "Kathmandu"}
        admin_user = create_user(admin_data, is_admin=True)
        User.objects.filter(id=admin_user.id).update(profile_photo=None)
        self.stdout.write(f"OK Seeded admin ({admin_user.email})")
