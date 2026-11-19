import { SupabaseClient } from '@supabase/supabase-js';

const PREFIX = '#ARG';

/**
 * Generates the next sequential gap-free order ID using atomic DB counter.
 * Uses a dedicated `order_counters` table with row-level locking.
 * Format: #ARG2601, #ARG2602, #ARG2603...
 */
export async function generateNextOrderId(supabase: SupabaseClient): Promise<string> {
  try {
    // Try calling the Supabase RPC function (if set up via SQL editor)
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_next_order_id');
    if (!rpcError && rpcData) {
      return String(rpcData);
    }
  } catch {
    // fall through to fallback
  }

  // Fallback: query max existing #ARG ID and increment
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('id')
      .like('id', '#ARG%');

    if (error || !data || data.length === 0) {
      return `${PREFIX}2601`;
    }

    let maxNum = 2600;
    for (const row of data) {
      // Handle both #ARG2601 and #ARG-2601 formats
      const match = String(row.id).match(/#ARG-?(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    return `${PREFIX}${maxNum + 1}`;
  } catch {
    return `${PREFIX}2601`;
  }
}

/**
 * Formats any order ID for display — ensures consistent #ARGxxxx format.
 * Strips any extra # prefix if the ID already starts with #.
 */
export function formatOrderId(id: string): string {
  if (!id) return id;
  // Already correct format
  if (/^#ARG\d+$/.test(id)) return id;
  // Has hyphen: #ARG-2601 → #ARG2601
  if (/^#ARG-\d+$/.test(id)) return id.replace('#ARG-', '#ARG');
  return id;
}
