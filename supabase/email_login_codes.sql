-- Run once in Supabase Dashboard -> SQL Editor before enabling Brevo email login.

CREATE TABLE IF NOT EXISTS public.email_login_codes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       TEXT NOT NULL,
    purpose     TEXT NOT NULL DEFAULT 'login' CHECK (purpose IN ('login', 'registration')),
    code_hash   TEXT NOT NULL,
    attempts    INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    expires_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    consumed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Migration for installations that created this table before registration codes were added.
ALTER TABLE public.email_login_codes
  ADD COLUMN IF NOT EXISTS purpose TEXT NOT NULL DEFAULT 'login';

CREATE INDEX IF NOT EXISTS idx_email_login_codes_email_created
  ON public.email_login_codes(email, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_login_codes_email_purpose_created
  ON public.email_login_codes(email, purpose, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_login_codes_expiry
  ON public.email_login_codes(expires_at);

ALTER TABLE public.email_login_codes ENABLE ROW LEVEL SECURITY;

-- No public policies are intentional. Only the server-side service role may access OTP hashes.
