-- ==============================================================================
-- ADD SKU AND SKU_ID TO PRODUCTS TABLE
-- Run this in Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku TEXT DEFAULT '';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku_id TEXT DEFAULT '';

-- Create index for quick SKU lookup
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products (sku);
CREATE INDEX IF NOT EXISTS idx_products_sku_id ON public.products (sku_id);
