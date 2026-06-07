
/*
  # Hamro Karma — Seed Data

  Seeds default service categories and platform settings.
*/

-- ==================== SERVICE CATEGORIES ====================

INSERT INTO service_categories (name, name_nepali, icon) VALUES
  ('Plumber', 'प्लम्बर', '🔧'),
  ('Electrician', 'इलेक्ट्रिसियन', '⚡'),
  ('Carpenter', 'सिकर्मी', '🪵'),
  ('Painter', 'रंगकर्मी', '🎨'),
  ('AC Technician', 'एसी प्राविधिक', '❄️'),
  ('Phone & Computer Repair', 'मोबाइल/कम्प्युटर मर्मत', '💻'),
  ('House Cleaner', 'घर सफाई', '🧹'),
  ('Home Tutor', 'घरेलु शिक्षक', '📚'),
  ('Driver', 'चालक', '🚗'),
  ('Gardener', 'माली', '🌱'),
  ('Mason', 'राजमिस्त्री', '🧱'),
  ('Welder', 'वेल्डर', '🔥')
ON CONFLICT (name) DO NOTHING;

-- ==================== PLATFORM SETTINGS ====================

INSERT INTO platform_settings (key, value, description) VALUES
  ('commission_rate_default', '0.10', 'Default platform commission rate (10%)'),
  ('commission_rate_platinum', '0.08', 'Platinum karma tier commission rate (8%)'),
  ('vat_rate', '0.13', 'VAT rate for Nepal (13%)'),
  ('karma_bronze_threshold', '100', 'Karma points needed for Bronze level'),
  ('karma_silver_threshold', '500', 'Karma points needed for Silver level'),
  ('karma_gold_threshold', '1000', 'Karma points needed for Gold level'),
  ('karma_platinum_threshold', '2500', 'Karma points needed for Platinum level'),
  ('karma_points_5_star', '10', 'Karma points for a 5-star review'),
  ('karma_points_4_star', '6', 'Karma points for a 4-star review'),
  ('karma_points_3_star', '2', 'Karma points for a 3-star review'),
  ('karma_points_dispute_loss', '-15', 'Karma points deducted when dispute goes against provider'),
  ('karma_points_monthly_10_jobs', '20', 'Karma points for completing 10 jobs in a month'),
  ('karma_points_profile_complete', '15', 'Karma points for 100% profile completion (one-time)'),
  ('karma_points_zero_cancellations', '10', 'Karma points for zero cancellations in a month'),
  ('karma_points_warning', '-20', 'Karma points deducted for account warning'),
  ('escrow_release_hours', '48', 'Hours after job completion before escrow auto-releases'),
  ('ftl_alert_duration_days', '30', 'Days before FTL alert expires'),
  ('max_booking_advance_days', '30', 'Maximum days ahead a booking can be made'),
  ('feature_map_enabled', 'true', 'Enable map discovery feature'),
  ('feature_sos_enabled', 'true', 'Enable SOS emergency button'),
  ('feature_ftl_enabled', 'true', 'Enable Find The Lost feature'),
  ('feature_reviews_enabled', 'true', 'Enable reviews system'),
  ('feature_leaderboard_enabled', 'true', 'Show karma leaderboard'),
  ('feature_karma_enabled', 'true', 'Enable karma points system'),
  ('feature_digital_payment', 'true', 'Require digital payment option')
ON CONFLICT (key) DO NOTHING;
