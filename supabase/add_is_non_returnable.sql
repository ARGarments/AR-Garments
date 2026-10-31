-- ============================================================
-- AR GARMENT: Add Non-Returnable Flag to Products Table
-- Run once in: Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================================

-- Add is_non_returnable column to products table
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_non_returnable BOOLEAN NOT NULL DEFAULT false;

-- Add index for filtering non-returnable products if needed
CREATE INDEX IF NOT EXISTS idx_products_non_returnable ON public.products(is_non_returnable);
