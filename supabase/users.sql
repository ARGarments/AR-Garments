-- ==============================================================================
-- AR GARMENT: USERS TABLE SCHEMA & MIGRATION
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.users (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT NOT NULL,
    email      TEXT UNIQUE NOT NULL,
    password   TEXT NOT NULL, -- Stored as hashed password (scrypt / pbkdf2)
    phone      TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop old policies if any to allow safe re-run
DROP POLICY IF EXISTS "Public insert users" ON public.users;
DROP POLICY IF EXISTS "Public select users" ON public.users;
DROP POLICY IF EXISTS "Service role full access users" ON public.users;

-- Policies:
-- 1. Anyone can register (insert a new user)
CREATE POLICY "Public insert users" ON public.users
    FOR INSERT WITH CHECK (true);

-- 2. Anyone can read basic user info (or authenticated users)
CREATE POLICY "Public select users" ON public.users
    FOR SELECT USING (true);

-- 3. Service role has full permissions for backend API routes
CREATE POLICY "Service role full access users" ON public.users
    FOR ALL USING (true);

-- Index on email for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
