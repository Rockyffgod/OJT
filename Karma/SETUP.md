# Hamro Karma — Setup Guide

A verified service marketplace platform for Nepal built with React, Supabase, and Tailwind CSS.

## What's Been Built

### Database
- Complete Supabase PostgreSQL schema with 17 tables
- Row Level Security (RLS) policies on all tables
- 12 default service categories seeded
- Platform settings configured

### Frontend
- React + TypeScript + Vite
- React Router for navigation
- Zustand for state management
- Tailwind CSS with custom design system
- Design tokens: Brand blue (#1A56A4), Accent amber (#F4A726)
- Fonts: Plus Jakarta Sans (headings), DM Sans (body)

### Pages Built
- **HomePage** — Hero, categories, how it works, testimonials, footer
- **Navigation** — Sticky header with auth state, mobile menu
- **Authentication** — Login, SignUp pages (forms ready for integration)
- **Services** — Discovery page with search/filters
- **Provider Profile** — Detailed provider view
- **Dashboards** — Customer and Provider dashboards (stubs)
- **FTL** — Find The Lost feature (pages created)
- **Admin** — Admin dashboard (stub)
- **Leaderboard** — Karma leaderboard page
- **Error Handling** — 404 page

### Integrations
- **Supabase Auth** — Email/password authentication ready
- **Database Types** — Full TypeScript types exported
- **Auth Store** — Zustand store for user/profile state
- **Supabase Client** — Pre-configured with environment variables

## Environment Variables

Already configured in `.env`:
```
VITE_SUPABASE_URL=https://dabvzalhvkbcohygpzvn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

## Project Structure

```
src/
├── pages/              # 14 page components
├── components/         # Reusable components (Navigation, etc)
├── lib/               # Supabase client, auth helpers, types
├── store/             # Zustand stores (authStore)
├── App.tsx            # Router configuration
├── index.css          # Design system, animations, utilities
└── main.tsx           # Entry point
```

## To Continue Building

### 1. Auth Integration (Priority)
- Implement SignUp form with Supabase auth.signUp()
- Implement Login form with auth.signInWithPassword()
- OTP verification flow
- Password reset flow
- Provider identity verification (ID upload)

### 2. Service Discovery
- Fetch providers from Supabase
- Implement filters and sorting
- Build search functionality
- Create booking request form

### 3. Booking & Chat
- Booking lifecycle management (REQUESTED → CONFIRMED → IN_PROGRESS → COMPLETED)
- In-app messaging system
- Real-time updates (Socket.io integration)

### 4. Payment Integration
- eSewa payment gateway
- Khalti payment gateway
- Escrow system
- Commission and VAT calculations

### 5. Additional Features
- SOS emergency button
- FTL (Find The Lost) alerts with QR codes
- Karma points system
- Reviews and ratings
- Admin verification queue
- Notifications system

### 6. Search & Map
- Google Maps integration
- Real-time provider location tracking
- Service area visualization

## Key Files to Know

- `/src/lib/supabase.ts` — Database client and types
- `/src/store/authStore.ts` — Global auth state
- `/src/pages/HomePage.tsx` — Hero page with sections
- `/src/components/Navigation.tsx` — Main nav with auth handling
- `/src/index.css` — Design system, colors, animations

## Running Development Server

The project is pre-configured with Vite. The dev server starts automatically when you open the project.

## Build Status

✓ Database: Complete with RLS
✓ Frontend: Compiled and ready
✓ Dependencies: Installed (React Router, Zustand, Supabase JS)
✓ Design System: Implemented
✓ Type Safety: Full TypeScript coverage

## Next Steps

1. Implement auth forms with validation
2. Create service provider search with filters
3. Build booking and messaging flows
4. Integrate payments (eSewa/Khalti)
5. Add real-time features with Socket.io
6. Build admin verification dashboard

All database tables are ready. Focus on frontend features and user flows.
