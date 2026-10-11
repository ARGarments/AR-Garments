-- Parent categories, subcategories, and product assignments.
-- Run once in the Supabase SQL Editor before deploying the matching application code.

BEGIN;

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS parent_id TEXT NULL;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS category_id TEXT NULL,
  ADD COLUMN IF NOT EXISTS subcategory_id TEXT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'categories_parent_id_fkey'
  ) THEN
    ALTER TABLE public.categories
      ADD CONSTRAINT categories_parent_id_fkey
      FOREIGN KEY (parent_id) REFERENCES public.categories(id)
      ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'categories_not_own_parent'
  ) THEN
    ALTER TABLE public.categories
      ADD CONSTRAINT categories_not_own_parent
      CHECK (parent_id IS NULL OR parent_id <> id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_category_id_fkey'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_category_id_fkey
      FOREIGN KEY (category_id) REFERENCES public.categories(id)
      ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_subcategory_id_fkey'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_subcategory_id_fkey
      FOREIGN KEY (subcategory_id) REFERENCES public.categories(id)
      ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_categories_parent_id
  ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id
  ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_subcategory_id
  ON public.products(subcategory_id);

-- Preserve every existing product by connecting its current category label to a root category.
UPDATE public.products AS product
SET category_id = category.id
FROM public.categories AS category
WHERE category.parent_id IS NULL
  AND lower(category.name) = lower(product.category)
  AND product.category_id IS NULL;

CREATE OR REPLACE FUNCTION public.validate_category_hierarchy()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  selected_parent_parent_id TEXT;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.parent_id IS DISTINCT FROM NEW.parent_id THEN
    IF OLD.parent_id IS NULL AND EXISTS (
      SELECT 1 FROM public.products WHERE category_id = NEW.id
    ) THEN
      RAISE EXCEPTION 'Reassign products before converting a parent category to a subcategory';
    END IF;

    IF OLD.parent_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.products WHERE subcategory_id = NEW.id
    ) THEN
      RAISE EXCEPTION 'Reassign products before moving this subcategory';
    END IF;
  END IF;

  IF NEW.parent_id IS NOT NULL THEN
    SELECT parent_id INTO selected_parent_parent_id
    FROM public.categories
    WHERE id = NEW.parent_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Parent category % does not exist', NEW.parent_id;
    END IF;

    IF selected_parent_parent_id IS NOT NULL THEN
      RAISE EXCEPTION 'A subcategory cannot be nested below another subcategory';
    END IF;

    IF EXISTS (SELECT 1 FROM public.categories WHERE parent_id = NEW.id) THEN
      RAISE EXCEPTION 'A category with subcategories cannot become a subcategory';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS categories_validate_hierarchy ON public.categories;
CREATE TRIGGER categories_validate_hierarchy
BEFORE INSERT OR UPDATE OF parent_id ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.validate_category_hierarchy();

CREATE OR REPLACE FUNCTION public.validate_product_category_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  selected_category_parent_id TEXT;
  selected_category_name TEXT;
  selected_subcategory_parent_id TEXT;
BEGIN
  IF NEW.category_id IS NULL THEN
    IF NEW.subcategory_id IS NOT NULL THEN
      RAISE EXCEPTION 'A subcategory requires a parent category';
    END IF;
    RETURN NEW;
  END IF;

  SELECT parent_id, name
  INTO selected_category_parent_id, selected_category_name
  FROM public.categories
  WHERE id = NEW.category_id;

  IF NOT FOUND OR selected_category_parent_id IS NOT NULL THEN
    RAISE EXCEPTION 'Product category must reference a parent category';
  END IF;

  IF NEW.subcategory_id IS NOT NULL THEN
    SELECT parent_id INTO selected_subcategory_parent_id
    FROM public.categories
    WHERE id = NEW.subcategory_id;

    IF NOT FOUND OR selected_subcategory_parent_id IS DISTINCT FROM NEW.category_id THEN
      RAISE EXCEPTION 'Product subcategory must belong to its selected parent category';
    END IF;
  END IF;

  -- Keep the legacy label synchronized for coupons and existing storefront components.
  NEW.category := selected_category_name;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_validate_category_assignment ON public.products;
CREATE TRIGGER products_validate_category_assignment
BEFORE INSERT OR UPDATE OF category_id, subcategory_id ON public.products
FOR EACH ROW EXECUTE FUNCTION public.validate_product_category_assignment();

COMMIT;
