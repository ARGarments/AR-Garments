-- Run once in Supabase Dashboard -> SQL Editor before enabling Razorpay checkout.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending';

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT DEFAULT NULL;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT DEFAULT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_razorpay_order_id
  ON public.orders(razorpay_order_id)
  WHERE razorpay_order_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_razorpay_payment_id
  ON public.orders(razorpay_payment_id)
  WHERE razorpay_payment_id IS NOT NULL;

-- Preserve historical online orders created before Razorpay tracking was added.
UPDATE public.orders
SET payment_status = 'paid'
WHERE payment_method = 'online'
  AND payment_status = 'pending'
  AND razorpay_order_id IS NULL;
