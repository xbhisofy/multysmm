
ALTER TABLE public.provider_accounts
  ADD COLUMN IF NOT EXISTS last_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_verified_status text CHECK (last_verified_status IN ('valid','invalid')),
  ADD COLUMN IF NOT EXISTS last_verified_balance numeric,
  ADD COLUMN IF NOT EXISTS last_verified_currency text,
  ADD COLUMN IF NOT EXISTS last_verified_error text;
