
/*
  # Hamro Karma — Initial Database Schema

  ## Summary
  Creates all core tables for the Hamro Karma verified service marketplace platform for Nepal.

  ## Tables Created

  ### Users & Auth
  - `profiles` — Extended user profiles linked to Supabase auth.users
  - `service_providers` — Provider-specific data (verification, karma, availability)
  - `service_categories` — Categories like Plumber, Electrician, etc.

  ### Bookings & Jobs
  - `bookings` — Job requests and their lifecycle
  - `messages` — In-app chat per booking
  - `reviews` — Customer reviews of providers
  - `disputes` — Dispute cases for completed/cancelled jobs

  ### Safety
  - `emergency_contacts` — SOS emergency contacts per user
  - `sos_alerts` — Triggered SOS events

  ### Community
  - `ftl_alerts` — Find The Lost community alerts

  ### Platform
  - `karma_events` — Karma points transaction log
  - `notifications` — In-app notification records
  - `platform_settings` — Admin-configurable platform settings

  ## Security
  - RLS enabled on all tables
  - Policies scoped to authenticated users and ownership
*/

-- ==================== ENUMS ====================

CREATE TYPE account_type AS ENUM ('CUSTOMER', 'PROVIDER', 'ADMIN');
CREATE TYPE id_document_type AS ENUM ('CITIZENSHIP_CARD', 'NATIONAL_ID', 'BIRTH_CERTIFICATE', 'PASSPORT');
CREATE TYPE verification_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE availability_status AS ENUM ('AVAILABLE_NOW', 'BUSY', 'OFFLINE');
CREATE TYPE karma_level AS ENUM ('NONE', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM');
CREATE TYPE booking_status AS ENUM ('REQUESTED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED');
CREATE TYPE payment_method AS ENUM ('ESEWA', 'KHALTI', 'CONNECT_IPS', 'CASH');
CREATE TYPE payment_status AS ENUM ('UNPAID', 'HELD', 'RELEASED', 'REFUNDED');
CREATE TYPE dispute_reason AS ENUM ('NO_SHOW', 'POOR_QUALITY', 'OVERCHARGED', 'INAPPROPRIATE_BEHAVIOR', 'DAMAGE_TO_PROPERTY', 'OTHER');
CREATE TYPE dispute_status AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED');
CREATE TYPE ftl_type AS ENUM ('LOST_ITEM', 'LOST_PET', 'MISSING_PERSON');
CREATE TYPE ftl_contact_method AS ENUM ('ANONYMOUS_APP', 'SHOW_PHONE', 'SHOW_EMAIL');
CREATE TYPE ftl_status AS ENUM ('ACTIVE', 'RESOLVED', 'EXPIRED', 'REMOVED');

-- ==================== PROFILES ====================

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  phone text UNIQUE,
  email text UNIQUE,
  profile_photo text,
  account_type account_type NOT NULL DEFAULT 'CUSTOMER',
  is_phone_verified boolean DEFAULT false,
  is_email_verified boolean DEFAULT false,
  city text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Public can view provider profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- ==================== SERVICE CATEGORIES ====================

CREATE TABLE IF NOT EXISTS service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  name_nepali text,
  icon text NOT NULL DEFAULT '🔧',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories"
  ON service_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON service_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND account_type = 'ADMIN')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND account_type = 'ADMIN')
  );

-- ==================== SERVICE PROVIDERS ====================

CREATE TABLE IF NOT EXISTS service_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bio text,
  profession text NOT NULL DEFAULT '',
  category_id uuid REFERENCES service_categories(id),
  experience int DEFAULT 0,
  hourly_rate int,
  service_area text DEFAULT '',
  skills text[] DEFAULT '{}',
  languages text[] DEFAULT '{}',
  portfolio_photos text[] DEFAULT '{}',
  id_document_url text,
  id_document_type id_document_type,
  selfie_url text,
  verification_status verification_status DEFAULT 'PENDING',
  verified_at timestamptz,
  rejection_reason text,
  is_available boolean DEFAULT true,
  availability_status availability_status DEFAULT 'OFFLINE',
  latitude float,
  longitude float,
  karma_points int DEFAULT 0,
  karma_level karma_level DEFAULT 'NONE',
  average_rating float DEFAULT 0,
  total_jobs_completed int DEFAULT 0,
  commission_rate float DEFAULT 0.10,
  profile_completion int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved providers"
  ON service_providers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Providers can update own record"
  ON service_providers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Providers can insert own record"
  ON service_providers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ==================== BOOKINGS ====================

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES profiles(id),
  provider_id uuid NOT NULL REFERENCES service_providers(id),
  status booking_status DEFAULT 'REQUESTED',
  job_description text NOT NULL DEFAULT '',
  job_address text NOT NULL DEFAULT '',
  scheduled_date timestamptz NOT NULL,
  job_photos text[] DEFAULT '{}',
  agreed_price int,
  payment_method payment_method,
  payment_status payment_status DEFAULT 'UNPAID',
  payment_held int,
  vat_amount int,
  commission_amount int,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancel_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = customer_id OR EXISTS (
    SELECT 1 FROM service_providers sp WHERE sp.id = provider_id AND sp.user_id = auth.uid()
  ));

CREATE POLICY "Customers can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Participants can update bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = customer_id OR EXISTS (
    SELECT 1 FROM service_providers sp WHERE sp.id = provider_id AND sp.user_id = auth.uid()
  ))
  WITH CHECK (auth.uid() = customer_id OR EXISTS (
    SELECT 1 FROM service_providers sp WHERE sp.id = provider_id AND sp.user_id = auth.uid()
  ));

-- ==================== MESSAGES ====================

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id),
  text text,
  photo_url text,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Booking participants can view messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_id
      AND (b.customer_id = auth.uid() OR EXISTS (
        SELECT 1 FROM service_providers sp WHERE sp.id = b.provider_id AND sp.user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Booking participants can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_id
      AND (b.customer_id = auth.uid() OR EXISTS (
        SELECT 1 FROM service_providers sp WHERE sp.id = b.provider_id AND sp.user_id = auth.uid()
      ))
    )
  );

-- ==================== REVIEWS ====================

CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid UNIQUE NOT NULL REFERENCES bookings(id),
  provider_id uuid NOT NULL REFERENCES service_providers(id),
  customer_id uuid NOT NULL REFERENCES profiles(id),
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  provider_reply text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Customers can create reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Providers can update own review reply"
  ON reviews FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM service_providers sp WHERE sp.id = provider_id AND sp.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM service_providers sp WHERE sp.id = provider_id AND sp.user_id = auth.uid()));

-- ==================== DISPUTES ====================

CREATE TABLE IF NOT EXISTS disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid UNIQUE NOT NULL REFERENCES bookings(id),
  raised_by_id uuid NOT NULL REFERENCES profiles(id),
  reason dispute_reason NOT NULL,
  description text NOT NULL DEFAULT '',
  photos text[] DEFAULT '{}',
  status dispute_status DEFAULT 'OPEN',
  resolution text,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants and admins can view disputes"
  ON disputes FOR SELECT
  TO authenticated
  USING (
    auth.uid() = raised_by_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND account_type = 'ADMIN') OR
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN service_providers sp ON sp.id = b.provider_id
      WHERE b.id = booking_id AND sp.user_id = auth.uid()
    )
  );

CREATE POLICY "Customers can create disputes"
  ON disputes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = raised_by_id);

-- ==================== EMERGENCY CONTACTS ====================

CREATE TABLE IF NOT EXISTS emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  relationship text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own emergency contacts"
  ON emergency_contacts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert emergency contacts"
  ON emergency_contacts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update emergency contacts"
  ON emergency_contacts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete emergency contacts"
  ON emergency_contacts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ==================== SOS ALERTS ====================

CREATE TABLE IF NOT EXISTS sos_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  triggered_by_id uuid NOT NULL REFERENCES profiles(id),
  booking_id uuid REFERENCES bookings(id),
  latitude float,
  longitude float,
  message text,
  resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sos_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own SOS alerts"
  ON sos_alerts FOR SELECT
  TO authenticated
  USING (auth.uid() = triggered_by_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND account_type = 'ADMIN'));

CREATE POLICY "Users can create SOS alerts"
  ON sos_alerts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = triggered_by_id);

-- ==================== FTL ALERTS ====================

CREATE TABLE IF NOT EXISTS ftl_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  type ftl_type NOT NULL,
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  last_seen_location text DEFAULT '',
  photos text[] DEFAULT '{}',
  qr_code text,
  latitude float,
  longitude float,
  contact_method ftl_contact_method DEFAULT 'ANONYMOUS_APP',
  status ftl_status DEFAULT 'ACTIVE',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ftl_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active FTL alerts"
  ON ftl_alerts FOR SELECT
  TO authenticated
  USING (status = 'ACTIVE' OR auth.uid() = user_id);

CREATE POLICY "Users can create FTL alerts"
  ON ftl_alerts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own FTL alerts"
  ON ftl_alerts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ==================== KARMA EVENTS ====================

CREATE TABLE IF NOT EXISTS karma_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES service_providers(id),
  event_type text NOT NULL,
  points int NOT NULL DEFAULT 0,
  description text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE karma_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can view own karma events"
  ON karma_events FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM service_providers sp WHERE sp.id = provider_id AND sp.user_id = auth.uid()));

-- ==================== NOTIFICATIONS ====================

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT '',
  data jsonb,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ==================== PLATFORM SETTINGS ====================

CREATE TABLE IF NOT EXISTS platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL DEFAULT '',
  description text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view platform settings"
  ON platform_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage platform settings"
  ON platform_settings FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND account_type = 'ADMIN'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND account_type = 'ADMIN'));

-- ==================== INDEXES ====================

CREATE INDEX IF NOT EXISTS idx_service_providers_category ON service_providers(category_id);
CREATE INDEX IF NOT EXISTS idx_service_providers_verification ON service_providers(verification_status);
CREATE INDEX IF NOT EXISTS idx_service_providers_karma_level ON service_providers(karma_level);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider ON bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_messages_booking ON messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_provider ON reviews(provider_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_ftl_alerts_status ON ftl_alerts(status);
CREATE INDEX IF NOT EXISTS idx_karma_events_provider ON karma_events(provider_id);
