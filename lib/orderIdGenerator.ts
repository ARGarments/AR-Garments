import { SupabaseClient } from '@supabase/supabase-js';

const PREFIX = '#ARG';

/**
 * Generates the next sequential gap-free order ID.
 * First inspects the DB to find the highest existing #ARG number,
 * then increments it by 1: #ARG2630 → #ARG2631 → #ARG2632 → #ARG2633...
 */
export async function generateNextOrderId(supabase: SupabaseClient): Promise<string> {
  try {
    // 1. Directly query database for existing order IDs
    const { data, error } = await supabase
      .from('orders')
      .select('id')
      .order('created_at', { ascending: false });

    let maxNum = 2600;

    if (!error && Array.isArray(data) && data.length > 0) {
      for (const row of data) {
        // Extract sequence number from #ARG2630, #ARG-2630, ARG2630, etc.
        const match = String(row.id || '').match(/(?:#?ARG-?|#)(\d+)/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
    }

    // 2. Also check RPC sequence if configured
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_next_order_id');
      if (!rpcError && rpcData) {
        const rpcMatch = String(rpcData).match(/(?:#?ARG-?|#)(\d+)/i);
        if (rpcMatch) {
          const rpcNum = parseInt(rpcMatch[1], 10);
          if (!isNaN(rpcNum) && rpcNum > maxNum) {
            maxNum = rpcNum - 1;
          }
        }
      }
    } catch {}

    const nextNumber = maxNum + 1;
    return `${PREFIX}${nextNumber}`;
  } catch (err) {
    console.warn('generateNextOrderId error, defaulting to #ARG2601:', err);
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
