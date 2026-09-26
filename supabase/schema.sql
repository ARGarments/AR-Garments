-- ==============================================================================
-- AR GARMENT E-COMMERCE: DATABASE SCHEMA & SEED DATA
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- Tables: 1. admins  2. products  3. hero_slides
-- ==============================================================================

-- ─── DROP EXISTING POLICIES (safe re-run) ─────────────────────────────────────
DROP POLICY IF EXISTS "Public read products"   ON public.products;
DROP POLICY IF EXISTS "Public read hero_slides" ON public.hero_slides;

-- ─── 1. ADMINS TABLE ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admins (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email      TEXT UNIQUE NOT NULL,
    password   TEXT NOT NULL,
    name       TEXT NOT NULL DEFAULT 'Admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── 2. PRODUCTS TABLE ────────────────────────────────────────────────────────
-- is_new_arrival → shows on "New Arrivals" section on homepage
-- is_best_seller → shows on "Best Sellers" section on homepage
CREATE TABLE IF NOT EXISTS public.products (
    id             TEXT PRIMARY KEY,
    name           TEXT NOT NULL,
    price          TEXT NOT NULL,
    numeric_price  INTEGER NOT NULL DEFAULT 0,
    category       TEXT NOT NULL,
    image          TEXT NOT NULL,
    images         TEXT[] DEFAULT '{}',
    description    TEXT DEFAULT '',
    specification  TEXT DEFAULT '',
    shipping_care  TEXT DEFAULT '',
    stock          INTEGER NOT NULL DEFAULT 10,
    active         BOOLEAN NOT NULL DEFAULT true,
    is_new_arrival BOOLEAN NOT NULL DEFAULT false,
    is_best_seller BOOLEAN NOT NULL DEFAULT false,
    sort_order     INTEGER NOT NULL DEFAULT 0,
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migration for existing installations (Run this in Supabase SQL Editor)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS specification TEXT DEFAULT '';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS shipping_care TEXT DEFAULT '';


-- ─── 3. HERO SLIDES TABLE ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hero_slides (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    subtitle    TEXT NOT NULL,
    button_text TEXT NOT NULL DEFAULT 'Shop Now',
    button_link TEXT NOT NULL DEFAULT '/category',
    image       TEXT NOT NULL,
    label       TEXT NOT NULL DEFAULT 'Timeless Ethnic Wear',
    active      BOOLEAN NOT NULL DEFAULT true,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────
ALTER TABLE public.admins     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

-- Public can read products & hero slides (storefront display)
CREATE POLICY "Public read products"    ON public.products   FOR SELECT USING (true);
CREATE POLICY "Public read hero_slides" ON public.hero_slides FOR SELECT USING (true);
-- NOTE: INSERT / UPDATE / DELETE use the Service Role Key (bypasses RLS) from API routes

-- ─── SEED DATA ────────────────────────────────────────────────────────────────

-- Admin account
INSERT INTO public.admins (email, password, name)
VALUES ('admin@argarment.com', 'admin@123', 'Super Admin')
ON CONFLICT (email) DO NOTHING;

-- Hero Slides (7 slides)
INSERT INTO public.hero_slides
  (id, title, subtitle, button_text, button_link, image, label, active, sort_order)
VALUES
  ('slide-1', E'Tradition In\nEvery Thread',    'Elegant Styles • Premium Fabrics • For Every You',               'Shop Now Collection', '/category', '/home-images/hero-image1.jpg', 'Timeless Ethnic Wear', true, 1),
  ('slide-2', E'Discover Your\nPerfect Style',  'Handcrafted with Love • Worn with Pride',                        'Explore Collection',  '/category', '/home-images/hero-image2.jpg', 'Timeless Ethnic Wear', true, 2),
  ('slide-3', E'Celebrate\nEvery Moment',       'Festive Collection • Wedding Special • Everyday Elegance',       'View Collection',     '/category', '/home-images/hero-image3.jpg', 'Timeless Ethnic Wear', true, 3),
  ('slide-4', E'Timeless\nElegance',            'Classic Designs • Modern Touch • Unmatched Quality',             'Shop Collection',     '/category', '/home-images/hero-image4.jpg', 'Timeless Ethnic Wear', true, 4),
  ('slide-5', E'Festive\nSplendor',             'Celebrate in Style • Traditional Craftsmanship • Premium Quality','Explore Now',        '/category', '/home-images/hero-image5.jpg', 'Timeless Ethnic Wear', true, 5),
  ('slide-6', E'Wedding\nSpecial',              'Bridal Collection • Exquisite Designs • Perfect Fit',            'View Collection',     '/category', '/home-images/hero-image6.jpg', 'Timeless Ethnic Wear', true, 6),
  ('slide-7', E'Everyday\nGrace',               'Comfort Meets Style • Daily Wear • Affordable Luxury',           'Shop Now',            '/category', '/home-images/hero-image7.jpg', 'Timeless Ethnic Wear', true, 7)
ON CONFLICT (id) DO UPDATE SET
  title      = EXCLUDED.title,
  subtitle   = EXCLUDED.subtitle,
  image      = EXCLUDED.image,
  sort_order = EXCLUDED.sort_order;

-- Products (10 products with new arrival & best seller flags)
INSERT INTO public.products
  (id, name, price, numeric_price, category, image, stock, active, is_new_arrival, is_best_seller, sort_order)
VALUES
  ('prod-1',  'Embroidered Saree',             '₹1,299', 1299, 'Sarees',                  '/home-images/Embroidered Saree.jpg',       25, true,  true,  false, 1),
  ('prod-2',  'Cotton Suit Set',               '₹899',    899, 'Suits & Dress Material',  '/home-images/Cotton Suit Set.jpg',         40, true,  true,  false, 2),
  ('prod-3',  'Designer Dupatta Set',          '₹1,499', 1499, 'Dupatta Sets',            '/home-images/Designer Dupatta Set.jpg',    18, true,  true,  true,  3),
  ('prod-4',  'Anarkali Suit',                 '₹999',    999, 'Suits & Dress Material',  '/home-images/Anarkali Suit.jpg',           32, true,  true,  false, 4),
  ('prod-5',  'Party Wear Saree',              '₹1,799', 1799, 'Sarees',                  '/home-images/Party Wear Saree.jpg',        15, true,  true,  false, 5),
  ('prod-6',  'Silk Blend Saree',              '₹1,499', 1499, 'Sarees',                  '/home-images/Silk Blend Saree.jpg',        28, true,  false, true,  6),
  ('prod-7',  'Rayon Kurti Set',               '₹799',    799, 'Suits & Dress Material',  '/home-images/Rayon Kurti Set.jpg',         35, true,  false, true,  7),
  ('prod-8',  'Designer Dupatta Set (Royal)',  '₹1,299', 1299, 'Dupatta Sets',            '/home-images/Designer Dupatta Set2.jpg',   20, true,  false, true,  8),
  ('prod-9',  'Men''s Kurta Set',              '₹1,009', 1009, 'Men Fashion',             '/home-images/Men Fashion.jpg',             22, true,  false, true,  9),
  ('prod-10', 'Kids Ethnic Wear',              '₹993',    993, 'Kids Fashion',            '/home-images/kids Ethnic Wear.jpg',        30, true,  false, true,  10)
ON CONFLICT (id) DO UPDATE SET
  name           = EXCLUDED.name,
  price          = EXCLUDED.price,
  numeric_price  = EXCLUDED.numeric_price,
  category       = EXCLUDED.category,
  image          = EXCLUDED.image,
  stock          = EXCLUDED.stock,
  is_new_arrival = EXCLUDED.is_new_arrival,
  is_best_seller = EXCLUDED.is_best_seller,
  sort_order     = EXCLUDED.sort_order;
