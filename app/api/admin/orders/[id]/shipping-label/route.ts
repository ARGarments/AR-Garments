import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/adminSession';
import { getServiceSupabase } from '@/lib/supabase';
import { Order } from '@/lib/orders';
import {
  getOrderShippingLabel,
  generateLocalDeliveryLabel,
  generateThirdPartyCarrierLabel,
} from '@/lib/shippingLabels';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/admin/orders/[id]/shipping-label — Retrieve saved label
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized admin access.' }, { status: 401 });
  }

  try {
    const orderId = params.id;
    const label = await getOrderShippingLabel(orderId);
    return NextResponse.json({ success: true, label });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Failed to fetch label.' }, { status: 500 });
  }
}

// POST /api/admin/orders/[id]/shipping-label — Generate Local or 3rd-Party Carrier Label
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized admin access.' }, { status: 401 });
  }

  try {
    const orderId = params.id;
    const body = await request.json();
    const { labelType, handOffOption, courierCode, weightKg, dimensions } = body;

    if (!labelType || (labelType !== 'local' && labelType !== 'third_party')) {
      return NextResponse.json({ success: false, error: 'Invalid label type.' }, { status: 400 });
    }

    // Fetch order from DB
    const supabase = getServiceSupabase();
    const { data: orderRow, error: orderErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    let order: Order | null = null;
    if (!orderErr && orderRow) {
      order = {
        id: String(orderRow.id),
        userId: String(orderRow.user_id),
        userName: String(orderRow.user_name || 'Customer'),
        userEmail: String(orderRow.user_email || ''),
        items: Array.isArray(orderRow.items) ? orderRow.items : [],
        total: Number(orderRow.total) || 0,
        subtotal: Number(orderRow.subtotal) || 0,
        discount: Number(orderRow.discount) || 0,
        shipping: Number(orderRow.shipping) || 0,
        status: orderRow.status,
        paymentMethod: orderRow.payment_method,
        paymentStatus: orderRow.payment_status,
        shippingAddress: orderRow.shipping_address || {},
        awbNumber: orderRow.awb_number,
        courierName: orderRow.courier_name,
        createdAt: orderRow.created_at,
      };
    } else {
      // Fallback: check body.order if passed from client
      if (body.order) {
        order = body.order as Order;
      }
    }

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found.' }, { status: 404 });
    }

    let createdLabel;
    if (labelType === 'local') {
      createdLabel = await generateLocalDeliveryLabel(order, {
        handOffOption: handOffOption || 'hand_to_hand',
        notes: body.notes,
      });
    } else {
      createdLabel = await generateThirdPartyCarrierLabel(order, {
        courierCode: courierCode || 'shiprocket',
        weightKg: Number(weightKg) || 0.8,
        dimensions: dimensions || { length: 25, width: 18, height: 5 },
      });
    }

    return NextResponse.json({ success: true, label: createdLabel });
  } catch (err) {
    console.error('Error generating shipping label:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to generate shipping label.' },
      { status: 500 }
    );
  }
}
