-- Migration: Add tags column to public.products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Create GIN index for fast tag searching
CREATE INDEX IF NOT EXISTS idx_products_tags ON public.products USING GIN (tags);
