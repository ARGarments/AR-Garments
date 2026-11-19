/**
 * Utility: Check product stock and recent orders in Supabase DB
 * Run: node scripts/check-stock.mjs
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://oohoowssqkqvursgntua.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vaG9vd3NzcWtxdnVyc2dudHVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDMzNDQ0OCwiZXhwIjoyMTA1OTEwNDQ4fQ.b27jWGQHBfphwdhlBR1VFllTzFzM1NyhhV08ZVw5NFc';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
  const { data: products } = await supabase
    .from('products')
    .select('id, name, stock, total_stock_pieces')
    .order('id');

  console.log('=== PRODUCTS STOCK ===');
  for (const p of (products || [])) {
    console.log(`${p.id.padEnd(30)} | ${(p.name||'').substring(0,25).padEnd(26)} | stock: ${String(p.stock).padEnd(5)} | pieces: ${p.total_stock_pieces}`);
  }

  const { data: orders } = await supabase
    .from('orders')
    .select('id, status, cancellation_reason, cancelled_by, items')
    .order('created_at', { ascending: false })
    .limit(10);

  console.log('\n=== RECENT ORDERS ===');
  for (const o of (orders || [])) {
    const items = Array.isArray(o.items) ? o.items.map(i => `${i.id}x${i.quantity}`).join(', ') : '?';
    console.log(`${o.id} | ${(o.status||'').padEnd(13)} | by: ${(o.cancelled_by||'null').padEnd(8)} | reason: ${(o.cancellation_reason||'null').substring(0,25).padEnd(26)} | items: ${items}`);
  }
}
main().catch(console.error);
