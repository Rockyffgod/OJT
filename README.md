# Karma

A service booking web application built with Django.  
Users can book home services, providers can manage 
bookings, and anyone can post FTL (Find The Lost) alerts.

## Features

- User registration and login (Customer / Provider)
- Browse and book services (Plumber, Electrician, etc.)
- Booking management with status tracking
- FTL alerts — post missing person/animal notices
- Notifications system
- Messaging between users
- Admin panel

## Tech Stack

- Python 3.12
- Django 5
- Bootstrap 5
- SQLite (development)
- PostgreSQL (production)
- Cloudinary (media storage)

## Setup

1. Clone the repo
   git clone https://github.com/Rockyffgod/OJT.git
   cd OJT/karma

2. Install dependencies
   pip install -r requirements.txt

3. Set up environment variables
   Copy .env.example to .env and fill in the values

4. Run migrations
   python manage.py migrate

5. Seed demo data
   python manage.py seed_demo

6. Start the server
   python manage.py runserver

## Demo Accounts

| Username | Password | Role     |
|----------|----------|----------|
| rk1234   | rk1234   | Customer |
| ram1234  | ram1234  | Provider |

## Project Structure

karma/
├── config/          # Settings and URLs
├── accounts/        # User model and auth
├── bookings/        # Booking logic
├── services/        # Service categories
├── ftl/             # Find The Lost alerts
├── notifications/   # Notification system
├── messaging/       # User messaging
├── templates/       # HTML templates
└── static/          # CSS, JS, images
