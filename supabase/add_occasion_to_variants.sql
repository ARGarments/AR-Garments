-- Migration to add occasion column to product_variants table
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS occasion TEXT DEFAULT '';
