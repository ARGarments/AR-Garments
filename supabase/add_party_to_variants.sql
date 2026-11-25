-- ==============================================================================
-- AR GARMENT: ADD PARTY-WISE STOCK COLUMNS TO PRODUCT VARIANTS
-- Run this in: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS party_involved BOOLEAN DEFAULT false;

ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS party_id UUID REFERENCES public.parties(id) ON DELETE SET NULL;

ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS party_name TEXT DEFAULT '';

ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS party_cost_price NUMERIC DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_product_variants_party_id
  ON public.product_variants (party_id);
