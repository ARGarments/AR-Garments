-- ==============================================================================
-- AR GARMENT: PRODUCT SIZES & SIZE CHART CONFIGURATION
-- Run this in: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.product_sizes (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT NOT NULL UNIQUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default sizes if empty
INSERT INTO public.product_sizes (name, sort_order)
VALUES 
    ('Free Size', 0),
    ('XS', 1),
    ('S', 2),
    ('M', 3),
    ('L', 4),
    ('XL', 5),
    ('XXL', 6),
    ('3XL', 7),
    ('4XL', 8),
    ('Set of All Sizes (S, M, L, XL, XXL)', 9),
    ('Unstitched', 10)
ON CONFLICT (name) DO NOTHING;

-- Enable RLS
ALTER TABLE public.product_sizes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read product_sizes" ON public.product_sizes;
DROP POLICY IF EXISTS "Service role full access product_sizes" ON public.product_sizes;

CREATE POLICY "Public read product_sizes"
    ON public.product_sizes
    FOR SELECT
    USING (true);

CREATE POLICY "Service role full access product_sizes"
    ON public.product_sizes
    FOR ALL
    USING (true);

-- Also add size_chart jsonb column to products table if not present
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS size_chart JSONB DEFAULT NULL;
