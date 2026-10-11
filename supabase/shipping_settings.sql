CREATE TABLE IF NOT EXISTS public.shipping_settings (
    id                       SMALLINT PRIMARY KEY CHECK (id = 1),
    free_shipping_enabled    BOOLEAN NOT NULL,
    free_shipping_threshold  NUMERIC(10, 2) NOT NULL CHECK (free_shipping_threshold >= 0),
    standard_shipping_charge NUMERIC(10, 2) NOT NULL CHECK (standard_shipping_charge >= 0),
    updated_at               TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

INSERT INTO public.shipping_settings (
    id,
    free_shipping_enabled,
    free_shipping_threshold,
    standard_shipping_charge
)
VALUES (1, true, 3000, 150)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.shipping_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read shipping settings" ON public.shipping_settings;
DROP POLICY IF EXISTS "Service role manage shipping settings" ON public.shipping_settings;

CREATE POLICY "Public read shipping settings"
ON public.shipping_settings FOR SELECT
USING (true);
