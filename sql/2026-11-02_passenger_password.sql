-- Run in Supabase SQL Editor BEFORE deploying the updated API.
ALTER TABLE public.passenger_credentials
  ADD COLUMN IF NOT EXISTS password_lookup text,
  ADD COLUMN IF NOT EXISTS password_hash text;
ALTER TABLE public.passenger_credentials
  ALTER COLUMN recovery_hash DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS passenger_credentials_password_lookup_unique
  ON public.passenger_credentials(password_lookup)
  WHERE password_lookup IS NOT NULL;
-- Existing recovery credentials are preserved for one-time migration.
