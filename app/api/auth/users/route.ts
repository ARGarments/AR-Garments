import { NextResponse } from 'next/server';
import { memoryUsers } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/supabase';
import { memoryOrders } from '@/lib/orders';

interface UserOutput {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  orderCount: number;
}

export const dynamic = 'force-dynamic';

// GET /api/auth/users — list all registered users with their order count (admin use)
export async function GET() {
  try {
    // 1. Try querying Supabase
    try {
      const supabase = getServiceSupabase();
      const { data: dbUsers, error: usersError } = await supabase
        .from('users')
        .select('id, name, email, phone, created_at')
        .order('created_at', { ascending: false });

      if (!usersError && Array.isArray(dbUsers) && dbUsers.length > 0) {
        // Fetch order counts from Supabase
        const { data: dbOrders } = await supabase
          .from('orders')
          .select('user_id');

        const orderCounts: Record<string, number> = {};
        if (Array.isArray(dbOrders)) {
          dbOrders.forEach((o: { user_id: string }) => {
            if (o.user_id) {
              orderCounts[o.user_id] = (orderCounts[o.user_id] || 0) + 1;
            }
          });
        }

        const formatted: UserOutput[] = dbUsers.map((u) => ({
          id: String(u.id),
          name: String(u.name),
          email: String(u.email),
          phone: u.phone ? String(u.phone) : '',
          createdAt: u.created_at ? new Date(String(u.created_at)).toISOString() : new Date().toISOString(),
          orderCount: orderCounts[String(u.id)] || 0,
        }));

        return NextResponse.json(formatted);
      }
    } catch {
      // Fall through to memory
    }

    // 2. Fallback to memoryUsers
    const memoryOrderCounts: Record<string, number> = {};
    memoryOrders.forEach((o) => {
      if (o.userId) {
        memoryOrderCounts[o.userId] = (memoryOrderCounts[o.userId] || 0) + 1;
      }
    });

    const safeUsers: UserOutput[] = memoryUsers.map(({ id, name, email, phone, createdAt }) => ({
      id,
      name,
      email,
      phone: phone || '',
      createdAt: createdAt || new Date().toISOString(),
      orderCount: memoryOrderCounts[id] || 0,
    }));

    safeUsers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(safeUsers);
  } catch (err) {
    console.error('[GET /api/auth/users] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
