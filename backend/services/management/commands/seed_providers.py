import uuid
import requests
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
    help = 'Seed test provider data to both Django and Supabase'

    def handle(self, *args, **options):
        sb_url = "https://fgazceatncfgmzdtogxe.supabase.co"
        anon_key = "sb_publishable_JcbfO9Oc1wkyJo1ANnGwDw_pn8bNA_T"
        headers = {
            "apikey": anon_key,
            "Content-Type": "application/json",
        }

        for cat_name in ["Plumber", "Electrician", "Carpenter", "Painter", "AC Tech", "Repair", "Cleaner", "Tutor"]:
            ServiceCategory.objects.get_or_create(name=cat_name, defaults={"icon": "🔧"})

        for p in PROVIDERS:
            # 1. Sync / register in Supabase first to get their UUID
            user_uuid = None
            try:
                # Try logging them in
                login_res = requests.post(
                    f"{sb_url}/auth/v1/token?grant_type=password",
                    headers=headers,
                    json={"email": p["email"], "password": "password123"},
                    timeout=8
                )
                if login_res.status_code == 200:
                    user_uuid = login_res.json()["user"]["id"]
                    self.stdout.write(f"Found existing Supabase user for {p['email']}: {user_uuid}")
                else:
                    # Sign them up
                    signup_res = requests.post(
                        f"{sb_url}/auth/v1/signup",
                        headers=headers,
                        json={"email": p["email"], "password": "password123"},
                        timeout=8
                    )
                    if signup_res.status_code == 200:
                        res_json = signup_res.json()
                        user_uuid = res_json.get("id") or res_json.get("user", {}).get("id")
                        self.stdout.write(f"Signed up new Supabase user for {p['email']}: {user_uuid}")
                    else:
                        self.stdout.write(self.style.WARNING(f"Could not signup {p['email']} in Supabase: {signup_res.text}"))
            except Exception as e:
                self.stdout.write(self.style.WARNING(f"Supabase connection warning: {e}"))

            # Fallback UUID if Supabase is offline
            if not user_uuid:
                user_uuid = str(uuid.uuid4())

            # 2. Upsert profile and service provider in Supabase
            try:
                # Upsert profile
                requests.post(
                    f"{sb_url}/rest/v1/profiles",
                    headers={
                        "apikey": anon_key,
                        "Content-Type": "application/json",
                        "Prefer": "resolution=merge-duplicates"
                    },
                    json={
                        "id": user_uuid,
                        "full_name": p["name"],
                        "email": p["email"],
                        "account_type": "PROVIDER",
                        "is_email_verified": True,
                        "is_phone_verified": True,
                        "city": p["area"]
                    },
                    timeout=8
                )
                
                # Upsert service_provider details
                requests.post(
                    f"{sb_url}/rest/v1/service_providers",
                    headers={
                        "apikey": anon_key,
                        "Content-Type": "application/json",
                        "Prefer": "resolution=merge-duplicates"
                    },
                    json={
                        "user_id": user_uuid,
                        "profession": p["profession"],
                        "service_area": p["area"],
                        "hourly_rate": p["rate"],
                        "average_rating": p["rating"],
                        "total_jobs_completed": p["jobs"],
                        "karma_points": p["karma_pts"],
                        "karma_level": p["karma"],
                        "bio": f"Experienced {p['profession'].lower()} with {p['jobs']}+ jobs completed in {p['area']}.",
                        "skills": [p["profession"], "Customer Service"],
                        "languages": ["Nepali", "English"],
                        "verification_status": "APPROVED",
                        "is_available": True
                    },
                    timeout=8
                )
                self.stdout.write(f"Seeded Supabase data for {p['name']}")
            except Exception as e:
                self.stdout.write(self.style.WARNING(f"Failed to seed Supabase table: {e}"))

            # 3. Create/update locally in Django using same UUID
            user = User.objects.filter(email=p["email"]).first()
            if not user:
                # Try finding by ID first
                user = User.objects.filter(id=user_uuid).first()
                if not user:
                    user = User(id=user_uuid, email=p["email"])

            user.username = p["name"].lower().replace(" ", "_")
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
            self.stdout.write(f"OK Seeded Django {p['name']} ({p['profession']})")
