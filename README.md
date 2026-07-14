# Karma — Hamro Karma Nepal

A service booking web application built with Django for OJT.

Users can browse and book home services, providers can manage 
bookings, and anyone can post FTL (Find The Lost) alerts.

## Features

- User registration and login (Customer / Provider)
- Browse services with Leaflet map and provider markers
- Booking flow: Request → Confirm → Cash After Service → Paid
- Provider accept/reject bookings
- FTL alerts — post missing person/pet/item notices
- Notifications system with mark as read
- Dark/Light theme toggle
- Mobile responsive with bottom navigation
- Admin panel with notification broadcast

## Tech Stack

- Python 3.12
- Django 5
- SQLite
- Leaflet.js (OpenStreetMap)
- Vanilla JS + CSS

## Hosted

> [!WARNING]
> The hosted site at https://karmanepal.pythonanywhere.com is currently down (showing a PythonAnywhere placeholder page). This may be due to the free tier account needing renewal or the web app configuration requiring updates.

## Setup

1. Clone the repo
   git clone https://github.com/Rockyffgod/OJT.git
   cd OJT

2. Install dependencies
   pip install -r requirements.txt

3. Set up environment variables
   Copy .env.example to .env and fill in values

4. Run migrations
   python manage.py migrate

5. Seed demo data
   python manage.py seed_demo

6. Start the dev server
   python manage.py runserver

## Demo Accounts

| Username     | Password  | Role     |
|--------------|-----------|----------|
| rk1234       | test1234  | Customer |
| ram1234      | test1234  | Customer |
| ram_sharma   | demo1234  | Provider |
| admin        | admin1234 | Admin    |

## Project Structure

OJT/
├── config/         # Settings and URLs
├── accounts/       # User model and auth
├── bookings/       # Booking logic
├── services/       # Service providers and browse
├── ftl/            # Find The Lost alerts
├── notifications/  # Notification system
├── messaging/      # User messaging
├── karma/          # Karma points system
├── templates/      # HTML templates
└── static/         # CSS, JS, images

## Support

Join our Discord: https://discord.gg/yqVyTFrqf7
