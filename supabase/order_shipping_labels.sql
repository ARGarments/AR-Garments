-- Order Shipping Labels Table
CREATE TABLE IF NOT EXISTS public.order_shipping_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL,
  label_type TEXT NOT NULL CHECK (label_type IN ('local', 'third_party')),
  courier_name TEXT NOT NULL,
  awb_number TEXT,
  hand_off_option TEXT DEFAULT 'hand_to_hand',
  label_data JSONB,
  label_url TEXT,
  status TEXT DEFAULT 'generated',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for speedy order lookups
CREATE INDEX IF NOT EXISTS idx_order_shipping_labels_order_id ON public.order_shipping_labels (order_id);
CREATE INDEX IF NOT EXISTS idx_order_shipping_labels_awb ON public.order_shipping_labels (awb_number);

-- Enable RLS
ALTER TABLE public.order_shipping_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access to order_shipping_labels"
  ON public.order_shipping_labels
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
