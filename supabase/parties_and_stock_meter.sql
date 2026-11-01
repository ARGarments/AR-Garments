-- ==============================================================================
-- PARTY MANAGEMENT & STOCK METER SYSTEM MIGRATION
-- ==============================================================================

-- 1. Parties Table
CREATE TABLE IF NOT EXISTS parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for active parties
CREATE INDEX IF NOT EXISTS idx_parties_is_active ON parties(is_active);

-- 2. Party Stock Batches (Tracks batch-wise inward quantities and cost prices)
CREATE TABLE IF NOT EXISTS product_party_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID REFERENCES parties(id) ON DELETE SET NULL, -- NULL = Main Store Inventory
  product_id TEXT NOT NULL,
  product_name TEXT,
  variant_id TEXT,
  sku TEXT,
  inward_quantity INTEGER NOT NULL DEFAULT 0,
  available_quantity INTEGER NOT NULL DEFAULT 0,
  party_cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  selling_price NUMERIC(10, 2) DEFAULT 0.00,
  batch_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_batches_party_id ON product_party_batches(party_id);
CREATE INDEX IF NOT EXISTS idx_batches_product_id ON product_party_batches(product_id);

-- 3. Order Item Party Allocations (Order & 7-Day Return tracking)
CREATE TABLE IF NOT EXISTS order_item_party_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL,
  order_item_id TEXT,
  product_id TEXT NOT NULL,
  party_id UUID REFERENCES parties(id) ON DELETE SET NULL, -- NULL = Main Store
  batch_id UUID REFERENCES product_party_batches(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  unit_selling_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'allocated', 
  -- Statuses: 'allocated', 'in_transit', 'delivered_hold', 'final_sold', 'return_raised', 'return_received', 'cancelled'
  delivered_at TIMESTAMPTZ,
  return_window_until TIMESTAMPTZ,
  final_sale_at TIMESTAMPTZ,
  return_raised_at TIMESTAMPTZ,
  return_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_allocations_order_id ON order_item_party_allocations(order_id);
CREATE INDEX IF NOT EXISTS idx_allocations_party_id ON order_item_party_allocations(party_id);
CREATE INDEX IF NOT EXISTS idx_allocations_status ON order_item_party_allocations(status);
CREATE INDEX IF NOT EXISTS idx_allocations_return_window ON order_item_party_allocations(return_window_until);

-- Seed Initial Default Parties if table is empty
INSERT INTO parties (name, contact_person, phone, email, address, is_active)
SELECT 'Ramesh Ji', 'Ramesh Kumar', '9876543210', 'ramesh@example.com', 'Prayagraj, UP', true
WHERE NOT EXISTS (SELECT 1 FROM parties WHERE name = 'Ramesh Ji');

INSERT INTO parties (name, contact_person, phone, email, address, is_active)
SELECT 'Amit Bhai', 'Amit Sharma', '9876501234', 'amit@example.com', 'Surat, Gujarat', true
WHERE NOT EXISTS (SELECT 1 FROM parties WHERE name = 'Amit Bhai');
