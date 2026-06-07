
/*
  # Create Storage Buckets for Hamro Karma

  Sets up S3-like storage buckets for:
  - Profile photos
  - ID documents (verification)
  - Job photos
  - FTL alert images
*/

-- Create buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES
  ('profiles', 'profiles', true, true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('id-documents', 'id-documents', false, false, 5242880, ARRAY['image/jpeg', 'image/png', 'application/pdf']),
  ('job-photos', 'job-photos', true, true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('ftl-images', 'ftl-images', true, true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Allow public access to profiles bucket
CREATE POLICY "Public can view profiles"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'profiles');

-- Allow authenticated users to upload their own profile photos
CREATE POLICY "Users can upload own profile"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to update their own profile photos
CREATE POLICY "Users can update own profile"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to delete their own profile photos
CREATE POLICY "Users can delete own profile"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to upload job photos
CREATE POLICY "Users can upload job photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'job-photos');

-- Allow public access to job photos
CREATE POLICY "Public can view job photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'job-photos');

-- Allow authenticated users to upload FTL images
CREATE POLICY "Users can upload FTL images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'ftl-images');

-- Allow public access to FTL images
CREATE POLICY "Public can view FTL images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'ftl-images');

-- Allow admins to upload and manage ID documents
CREATE POLICY "Admins can manage ID documents"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'id-documents' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND account_type = 'ADMIN')
  )
  WITH CHECK (
    bucket_id = 'id-documents' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND account_type = 'ADMIN')
  );
