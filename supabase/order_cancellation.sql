-- Customer order cancellation and refund audit fields.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancellation_reason TEXT DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancelled_by TEXT DEFAULT NULL
  CHECK (cancelled_by IS NULL OR cancelled_by IN ('customer', 'admin'));
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS refund_status TEXT NOT NULL DEFAULT 'not_required'
  CHECK (refund_status IN ('not_required', 'pending', 'processed', 'failed'));
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS refund_id TEXT DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_refund_status
  ON public.orders(refund_status)
  WHERE refund_status <> 'not_required';
