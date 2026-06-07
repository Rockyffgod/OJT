# हाम्रो कर्म (Hamro Karma)

Nepal's first karma-based service marketplace — a full-stack platform connecting customers with local service providers, featuring a Lost & Found (FTL) system and AI-powered search.

## Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, React Router, Zustand, Lucide Icons |
| **Backend** | Django 5, Django REST Framework, PostgreSQL (via Supabase), JWT auth |
| **AI** | Groq (llama-3.3-70b-versatile) for FTL search & enhance |
| **Storage** | Django media / Supabase storage for uploads |
| **Maps** | Leaflet, Geoapify |

## Features

- **Service Marketplace** — browse & search services, view provider profiles, ratings & karma levels
- **Bookings** — request, confirm, complete, cancel with status tracking
- **Messaging** — real-time chat per booking
- **Lost & Found (FTL)** — post lost/found alerts (Person, Pet, Item, Vehicle) with photo, map location, QR code
- **AI Search** — natural-language FTL search via Groq ("black wallet near Thamel")
- **Karma System** — leaderboard, karma points & levels (Bronze → Platinum)
- **Notifications** — in-app notification center
- **Admin Panel** — Django admin for managing users, alerts, notifications
- **Nepali Language** — full Nepali/English i18n support
- **Dark Mode** — theme toggle with localStorage persistence

## Quick Start

```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate      # Windows
pip install -r requirements.txt
copy .env.example .env     # configure DB, keys
python manage.py migrate
python manage.py runserver

# Frontend
cd frontend
npm install
npm run dev
```

## Environment Variables

Key variables in `backend/.env`:

- `DATABASE_URL` — PostgreSQL connection string
- `GROQ_API_KEY` — Groq API key for AI features
- `GEOAPIFY_KEY` — Geoapify API key for maps

## License

MIT
