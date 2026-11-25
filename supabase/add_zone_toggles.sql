-- ==============================================================================
-- AR GARMENT: ADD TOGGLE COLUMNS TO ZONE SHIPPING SETTINGS
-- Table: public.zone_shipping_settings
-- Run this in: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

ALTER TABLE public.zone_shipping_settings
  ADD COLUMN IF NOT EXISTS is_free_delivery_enabled BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.zone_shipping_settings
  ADD COLUMN IF NOT EXISTS allow_cod BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.zone_shipping_settings
  ADD COLUMN IF NOT EXISTS is_online_discount_enabled BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.zone_shipping_settings
  ADD COLUMN IF NOT EXISTS online_payment_discount NUMERIC(5, 2) NOT NULL DEFAULT 0;
