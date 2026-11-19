/**
 * Creates the PostgreSQL sequence and RPC function in Supabase for gap-free order IDs.
 * Run once: node scripts/setup-order-sequence.mjs
 *
 * After running this, the app calls supabase.rpc('get_next_order_id') to get #ARG2629, #ARG2630, etc.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = {};
readFileSync(resolve(__dirname, '../.env'), 'utf8').split('\n').forEach(l => {
  const e = l.trim().indexOf('=');
  if (e > 0) env[l.slice(0, e).trim()] = l.slice(e + 1).trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

// Use the Supabase SQL endpoint (requires service role key with admin rights)
const sqlStatements = [
  // Create sequence starting at 2629 (after current max 2628)
  `CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 2629 INCREMENT BY 1 NO CYCLE`,
  // Create RPC function
  `CREATE OR REPLACE FUNCTION get_next_order_id()
   RETURNS text
   LANGUAGE plpgsql
   SECURITY DEFINER
   AS $$
   DECLARE
     next_num bigint;
   BEGIN
     SELECT nextval('order_number_seq') INTO next_num;
     RETURN '#ARG' || next_num::text;
   END;
   $$`
];

for (const sql of sqlStatements) {
  const res = await fetch(`${env['NEXT_PUBLIC_SUPABASE_URL']}/rest/v1/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': env['SUPABASE_SERVICE_ROLE_KEY'],
      'Authorization': `Bearer ${env['SUPABASE_SERVICE_ROLE_KEY']}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ query: sql }),
  });
  console.log(`SQL: ${sql.slice(0, 60)}... → Status: ${res.status}`);
}

// Verify by calling the RPC
const { data, error } = await supabase.rpc('get_next_order_id');
if (error) {
  console.error('RPC test failed:', error.message);
  console.log('\n⚠️  Please run the following SQL in Supabase SQL Editor manually:');
  console.log('\n-- Step 1: Create sequence');
  console.log("CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 2629 INCREMENT BY 1 NO CYCLE;");
  console.log('\n-- Step 2: Create RPC function');
  console.log(`CREATE OR REPLACE FUNCTION get_next_order_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_num bigint;
BEGIN
  SELECT nextval('order_number_seq') INTO next_num;
  RETURN '#ARG' || next_num::text;
END;
$$;`);
} else {
  console.log('✅ Sequence and RPC created! Next order ID:', data);
  // The sequence consumed one value during test - reset it back
  await fetch(`${env['NEXT_PUBLIC_SUPABASE_URL']}/rest/v1/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': env['SUPABASE_SERVICE_ROLE_KEY'],
      'Authorization': `Bearer ${env['SUPABASE_SERVICE_ROLE_KEY']}`,
    },
    body: JSON.stringify({ query: `SELECT setval('order_number_seq', 2628, true)` }),
  });
  console.log('Sequence reset to 2628 (next call will return #ARG2629)');
}
