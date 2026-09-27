-- ==============================================================================
-- PHASE 1: COUPONS & DISCOUNTS TABLE & SEED DATA
-- Run this in Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.coupons (
    id                  TEXT PRIMARY KEY,
    code                TEXT UNIQUE NOT NULL,
    title               TEXT NOT NULL,
    description         TEXT DEFAULT '',
    discount_type       TEXT NOT NULL DEFAULT 'percentage', -- 'percentage' | 'flat' | 'free_shipping'
    discount_value      NUMERIC NOT NULL DEFAULT 0,
    applicable_category TEXT NOT NULL DEFAULT 'All',        -- 'All' or specific: 'Sarees', 'Suits & Dress Material', etc.
    min_order_value     NUMERIC NOT NULL DEFAULT 0,
    max_discount_amount NUMERIC DEFAULT NULL,              -- optional cap for percentage discounts
    usage_limit         INTEGER DEFAULT NULL,              -- optional max total redemptions
    used_count          INTEGER NOT NULL DEFAULT 0,
    valid_from          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until         TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    active              BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Allow public read of active coupons (for storefront offer display & verification)
DROP POLICY IF EXISTS "Public read coupons" ON public.coupons;
CREATE POLICY "Public read coupons" ON public.coupons FOR SELECT USING (true);

-- Seed Initial Coupons with Category-Specific and Storewide offers
INSERT INTO public.coupons 
    (id, code, title, description, discount_type, discount_value, applicable_category, min_order_value, max_discount_amount, usage_limit, used_count, active)
VALUES
    ('coupon-1', 'WELCOME10', 'Welcome Offer', 'Get 10% off on your first order across all collections', 'percentage', 10, 'All', 499, 300, 500, 18, true),
    ('coupon-2', 'SAREE20', 'Saree Festive Special', 'Exclusive 20% discount on all designer and embroidered Sarees', 'percentage', 20, 'Sarees', 999, 500, 200, 34, true),
    ('coupon-3', 'SUIT15', 'Suits & Dress Material Discount', 'Save 15% on any Suits & Dress Material outfit', 'percentage', 15, 'Suits & Dress Material', 799, 400, 150, 12, true),
    ('coupon-4', 'DUPATTA100', 'Dupatta Flat ₹100 Off', 'Flat ₹100 instant discount on Dupatta Sets', 'flat', 100, 'Dupatta Sets', 699, NULL, 100, 7, true),
    ('coupon-5', 'FLAT300', 'Grand Shopping Discount', 'Flat ₹300 off on any order above ₹1,999 across all categories', 'flat', 300, 'All', 1999, NULL, 100, 23, true),
    ('coupon-6', 'FREESHIP', 'Free Express Shipping', 'Complimentary shipping on all orders above ₹500', 'free_shipping', 0, 'All', 500, NULL, NULL, 52, true)
ON CONFLICT (code) DO UPDATE SET
    title               = EXCLUDED.title,
    description         = EXCLUDED.description,
    discount_type       = EXCLUDED.discount_type,
    discount_value      = EXCLUDED.discount_value,
    applicable_category = EXCLUDED.applicable_category,
    min_order_value     = EXCLUDED.min_order_value,
    max_discount_amount = EXCLUDED.max_discount_amount,
    active              = EXCLUDED.active;
