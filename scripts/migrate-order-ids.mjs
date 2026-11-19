/**
 * Full re-migration: rename ALL orders (including #ARG-XXXX) to #ARGXXXX (no hyphen), gap-free.
 * Orders sorted by created_at ASC → #ARG2601, #ARG2602, ...
 * Run: node scripts/migrate-order-ids.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env');
const envContent = readFileSync(envPath, 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
}

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL'];
const SERVICE_KEY = env['SUPABASE_SERVICE_ROLE_KEY'];
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function renameSingle(oldId, newId, oldOrder) {
  // 1. Update order_item_party_allocations FK
  await supabase.from('order_item_party_allocations').update({ order_id: newId }).eq('order_id', oldId);

  // 2. Insert new row (null out unique-constrained Razorpay fields temporarily)
  const newOrder = {
    ...oldOrder,
    id: newId,
    razorpay_order_id: null,
    razorpay_payment_id: null,
  };
  const { error: insertErr } = await supabase.from('orders').insert(newOrder);
  if (insertErr) {
    return `INSERT FAILED: ${insertErr.message}`;
  }

  // 3. Delete old row
  const { error: deleteErr } = await supabase.from('orders').delete().eq('id', oldId);
  if (deleteErr) {
    await supabase.from('orders').delete().eq('id', newId); // cleanup
    return `DELETE FAILED: ${deleteErr.message}`;
  }

  // 4. Restore Razorpay fields now that old row is gone
  const restoreData = {};
  if (oldOrder.razorpay_order_id) restoreData.razorpay_order_id = oldOrder.razorpay_order_id;
  if (oldOrder.razorpay_payment_id) restoreData.razorpay_payment_id = oldOrder.razorpay_payment_id;
  if (Object.keys(restoreData).length > 0) {
    const { error: restoreErr } = await supabase.from('orders').update(restoreData).eq('id', newId);
    if (restoreErr) {
      console.warn(`  Warning: could not restore razorpay fields: ${restoreErr.message}`);
    }
  }
  return null; // success
}

async function migrate() {
  console.log('Fetching all orders sorted by created_at ASC...');
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) { console.error('Fetch error:', error.message); process.exit(1); }
  console.log(`Total orders: ${orders.length}`);

  const START = 2601;
  let success = 0, skipped = 0, failed = 0;

  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    const oldId = order.id;
    const newId = `#ARG${START + i}`;

    // Skip if already correct
    if (oldId === newId) {
      console.log(`[${i+1}/${orders.length}] SKIP ${oldId} (already correct)`);
      skipped++;
      continue;
    }

    console.log(`[${i+1}/${orders.length}] ${oldId} → ${newId}`);
    const err = await renameSingle(oldId, newId, order);
    if (err) {
      console.error(`  FAILED: ${err}`);
      failed++;
    } else {
      success++;
    }
  }

  console.log(`\nDone: ${success} renamed, ${skipped} skipped, ${failed} failed.`);
  if (failed === 0) {
    console.log('\n✅ All orders now have gap-free #ARG IDs: #ARG2601 → #ARG' + (START + orders.length - 1));
  }
}

migrate().catch(err => { console.error('Fatal:', err); process.exit(1); });
