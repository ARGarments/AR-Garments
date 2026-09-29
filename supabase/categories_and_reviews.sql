-- ==============================================================================
-- 8. CATEGORIES & PRODUCT REVIEWS MODULES SCHEMA
-- Run this in Supabase Dashboard → SQL Editor → New Query → Run
-- ==============================================================================

-- ─── 8. CATEGORIES TABLE ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
    id          TEXT PRIMARY KEY,
    name        TEXT UNIQUE NOT NULL,
    slug        TEXT UNIQUE NOT NULL,
    description TEXT DEFAULT '',
    image       TEXT DEFAULT '',
    sort_order  INTEGER NOT NULL DEFAULT 0,
    active      BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_active ON public.categories(active);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON public.categories(sort_order ASC);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select categories" ON public.categories;
DROP POLICY IF EXISTS "Service role full access categories" ON public.categories;
CREATE POLICY "Public select categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Service role full access categories" ON public.categories FOR ALL USING (true);

-- Seed initial categories so existing products map directly
INSERT INTO public.categories (id, name, slug, description, image, sort_order, active)
VALUES
    ('cat-1', 'Sarees', 'sarees', 'Exclusive designer & bridal sarees with intricate zari and silk drapes', '/home-images/Sarees.jpg', 1, true),
    ('cat-2', 'Suits & Dress Material', 'suits-dress-material', 'Premium unstitched and ready-to-wear salwar suit sets', '/home-images/Suits & Dress Materia.jpg', 2, true),
    ('cat-3', 'Dupatta Sets', 'dupatta-sets', 'Complete matching dupatta and traditional wear combinations', '/home-images/Dupatta Sets.jpg', 3, true),
    ('cat-4', 'Men Fashion', 'men-fashion', 'Royal sherwanis, kurtas, and traditional ethnic men fashion', '/home-images/Men Fashion.jpg', 4, true),
    ('cat-5', 'Kids Fashion', 'kids-fashion', 'Festive outfits and adorable traditional wear for children', '/home-images/Kids Fashion.jpg', 5, true)
ON CONFLICT (name) DO UPDATE SET
    slug        = EXCLUDED.slug,
    description = EXCLUDED.description,
    image       = EXCLUDED.image,
    sort_order  = EXCLUDED.sort_order,
    active      = EXCLUDED.active;


-- ─── 9. PRODUCT REVIEWS TABLE ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.product_reviews (
    id          TEXT PRIMARY KEY,
    product_id  TEXT NOT NULL,
    user_id     TEXT NOT NULL,
    user_name   TEXT NOT NULL,
    user_email  TEXT NOT NULL,
    rating      INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title       TEXT DEFAULT '',
    comment     TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'approved', -- 'approved', 'pending', 'rejected'
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON public.product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_status ON public.product_reviews(status);
CREATE INDEX IF NOT EXISTS idx_product_reviews_created_at ON public.product_reviews(created_at DESC);

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select approved reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Public insert reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Service role full access reviews" ON public.product_reviews;
CREATE POLICY "Public select approved reviews" ON public.product_reviews FOR SELECT USING (true);
CREATE POLICY "Public insert reviews" ON public.product_reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role full access reviews" ON public.product_reviews FOR ALL USING (true);
