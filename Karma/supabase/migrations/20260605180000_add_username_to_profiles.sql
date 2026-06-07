-- Add username column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username text UNIQUE;
