import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import {
  Order,
  OrderItem,
  ShippingAddress,
  OrderStatus,
  memoryOrders,
} from '@/lib/orders';

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function generateOrderId(): string {
  return `ORD-${Date.now()}`;
}

// ---------------------------------------------------------------------------
// GET /api/orders
//   ?all=true   → returns all orders (admin)
//   ?userId=xxx → returns orders for that user
// ---------------------------------------------------------------------------

function mapDbOrder(row: Record<string, unknown>): Order {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    userName: String(row.user_name),
    userEmail: String(row.user_email),
    items: Array.isArray(row.items) ? (row.items as OrderItem[]) : [],
    shippingAddress: (row.shipping_address as ShippingAddress) || {
      fullName: '',
      phone: '',
      addressLine1: '',
      city: '',
      state: '',
      pincode: '',
    },
    paymentMethod: row.payment_method === 'online' ? 'online' : 'cod',
    subtotal: Number(row.subtotal) || 0,
    discount: Number(row.discount) || 0,
    shipping: Number(row.shipping) || 0,
    total: Number(row.total) || 0,
    couponCode: row.coupon_code ? String(row.coupon_code) : undefined,
    status: (row.status as OrderStatus) || 'Pending',
    createdAt: row.created_at ? new Date(String(row.created_at)).toISOString() : new Date().toISOString(),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all');
    const userId = searchParams.get('userId');

    // 1. Try querying Supabase
    try {
      const supabase = getServiceSupabase();
      let query = supabase.from('orders').select('*');

      if (all === 'true') {
        query = query.order('created_at', { ascending: false });
      } else if (userId) {
        query = query.eq('user_id', userId).order('created_at', { ascending: false });
      } else {
        return NextResponse.json(
          { success: false, error: 'Provide ?userId=xxx or ?all=true' },
          { status: 400 }
        );
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        const mapped = data.map(mapDbOrder);
        return NextResponse.json(
          { success: true, orders: mapped, total: mapped.length },
          { status: 200 }
        );
      }
    } catch {
      // Supabase table not created or error — fall back to memory
    }

    // 2. Fallback to in-memory store
    if (all === 'true') {
      const sorted = [...memoryOrders].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      return NextResponse.json(
        { success: true, orders: sorted, total: sorted.length },
        { status: 200 }
      );
    }

    if (userId) {
      const userOrders = memoryOrders
        .filter((o) => o.userId === userId)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      return NextResponse.json(
        { success: true, orders: userOrders, total: userOrders.length },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Provide ?userId=xxx or ?all=true' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[GET /api/orders] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/orders  — place a new order (Stores in Supabase DB + memory)
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      userId,
      userName,
      userEmail,
      items,
      shippingAddress,
      paymentMethod,
      subtotal,
      discount,
      shipping,
      total,
      couponCode,
    } = body;

    const address = shippingAddress || body.deliveryAddress;
    const resolvedUserName = userName || address?.fullName || userEmail?.split('@')[0] || 'Customer';

    // --- Basic validation ---
    if (
      !userId ||
      !userEmail ||
      !items?.length ||
      !address ||
      !paymentMethod ||
      subtotal === undefined ||
      total === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Missing required fields: userId, userEmail, items, address, paymentMethod, subtotal, total',
        },
        { status: 400 }
      );
    }

    if (!['cod', 'online'].includes(paymentMethod)) {
      return NextResponse.json(
        { success: false, error: "paymentMethod must be 'cod' or 'online'" },
        { status: 400 }
      );
    }

    // --- Build order object ---
    const newOrder: Order = {
      id: generateOrderId(),
      userId,
      userName: resolvedUserName,
      userEmail,
      items,
      shippingAddress: address,
      paymentMethod,
      subtotal: Number(subtotal) || 0,
      discount: Number(discount) || 0,
      shipping: Number(shipping) || 0,
      total: Number(total) || 0,
      ...(couponCode ? { couponCode } : {}),
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    // 1. Insert into Supabase Orders table
    try {
      const supabase = getServiceSupabase();
      await supabase.from('orders').insert({
        id: newOrder.id,
        user_id: newOrder.userId,
        user_name: newOrder.userName,
        user_email: newOrder.userEmail,
        items: newOrder.items,
        shipping_address: newOrder.shippingAddress,
        payment_method: newOrder.paymentMethod,
        subtotal: newOrder.subtotal,
        discount: newOrder.discount,
        shipping: newOrder.shipping,
        total: newOrder.total,
        coupon_code: newOrder.couponCode || null,
        status: newOrder.status,
      });

      // Also persist/update address into user_addresses table in Supabase
      if (address && address.fullName && address.addressLine1 && address.city) {
        const { data: existingAddr } = await supabase
          .from('user_addresses')
          .select('id')
          .eq('user_id', newOrder.userId)
          .maybeSingle();

        if (existingAddr?.id) {
          await supabase
            .from('user_addresses')
            .update({
              full_name: address.fullName,
              phone: address.phone || '',
              address_line1: address.addressLine1,
              address_line2: address.addressLine2 || '',
              city: address.city,
              state: address.state || '',
              pincode: address.pincode || '',
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingAddr.id);
        } else {
          await supabase.from('user_addresses').insert({
            user_id: newOrder.userId,
            full_name: address.fullName,
            phone: address.phone || '',
            address_line1: address.addressLine1,
            address_line2: address.addressLine2 || '',
            city: address.city,
            state: address.state || '',
            pincode: address.pincode || '',
            is_default: true,
          });
        }
      }
    } catch {
      // Continue to in-memory fallback
    }

    // 2. Persist to in-memory store
    memoryOrders.unshift(newOrder);

    return NextResponse.json(
      { success: true, order: newOrder, orderId: newOrder.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/orders] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/orders — update order status (Admin)
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing orderId or status' },
        { status: 400 }
      );
    }

    // 1. Update in Supabase
    try {
      const supabase = getServiceSupabase();
      await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);
    } catch {
      // continue to memory
    }

    // 2. Update in-memory store
    const idx = memoryOrders.findIndex((o) => o.id === orderId);
    if (idx !== -1) {
      memoryOrders[idx].status = status;
    }

    return NextResponse.json({ success: true, orderId, status });
  } catch (error) {
    console.error('[PATCH /api/orders] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
