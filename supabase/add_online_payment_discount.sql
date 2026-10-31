-- Migration: Add online_payment_discount column to zone_shipping_settings
-- Run this in Supabase SQL editor

ALTER TABLE zone_shipping_settings
  ADD COLUMN IF NOT EXISTS online_payment_discount NUMERIC(5,2) DEFAULT 0 NOT NULL;

-- Set default 0% for all existing zones (no discount unless admin configures it)
UPDATE zone_shipping_settings SET online_payment_discount = 0 WHERE online_payment_discount IS NULL;

-- Verify
SELECT id, zone_name, online_payment_discount FROM zone_shipping_settings ORDER BY sort_order;
