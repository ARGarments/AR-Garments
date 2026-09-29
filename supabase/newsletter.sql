-- ==============================================================================
-- Migration: Create newsletter_subscribers Table
-- Run this in Supabase Dashboard -> SQL Editor
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id          TEXT PRIMARY KEY,
    email       TEXT UNIQUE NOT NULL,
    status      TEXT NOT NULL DEFAULT 'active',
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON public.newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_created_at ON public.newsletter_subscribers(created_at DESC);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public insert newsletter_subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Service role full access newsletter_subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Public insert newsletter_subscribers" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role full access newsletter_subscribers" ON public.newsletter_subscribers FOR ALL USING (true);
