import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { isAdminRequest } from '@/lib/adminSession';
import { memoryOrders } from '@/lib/orders';

export const dynamic = 'force-dynamic';

export interface CustomerSearchResult {
  id: string;
  fullName: string;
  mobile: string;
  email: string;
  shopAddress: string;
  city: string;
  state: string;
  pincode: string;
  businessType: 'retail_store' | 'hawker' | string;
  status: 'pending' | 'approved' | 'rejected' | string;
  createdAt: string;
  landmark?: string;
  totalOrders: number;
}

export async function GET(req: NextRequest) {
  try {
    // 1. Authorization check: Admin only
    const isAdmin = isAdminRequest(req);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin authorization required.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const rawQuery = searchParams.get('q') || '';
    const query = rawQuery.trim();

    // 2. Input validation
    if (!query) {
      return NextResponse.json(
        { error: 'Please enter a mobile number or email ID.' },
        { status: 400 }
      );
    }

    // Determine type: Mobile or Email
    const isEmail = query.includes('@');
    const isPhoneLike = /^[0-9+\s-]{7,15}$/.test(query);

    if (isEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(query)) {
        return NextResponse.json(
          { error: 'Invalid email address format.' },
          { status: 400 }
        );
      }
    } else if (!isPhoneLike && query.length < 3) {
      return NextResponse.json(
        { error: 'Please enter a valid mobile number (min 7 digits) or email.' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // 3. Search query in business_registrations
    const selectFields = 'id, full_name, mobile, applicant_email, shop_address, landmark, city, state, pincode, business_type, status, created_at';

    let dbQuery = supabase
      .from('business_registrations')
      .select(selectFields);

    if (isEmail) {
      dbQuery = dbQuery.ilike('applicant_email', query.toLowerCase());
    } else {
      const cleaned = query.replace(/[^\d+]/g, '');
      const digitsOnly = query.replace(/\D/g, '');
      const last10 = digitsOnly.slice(-10);

      if (last10.length === 10) {
        dbQuery = dbQuery.or(`mobile.ilike.%${last10}%,mobile.eq.${cleaned}`);
      } else {
        dbQuery = dbQuery.ilike('mobile', `%${cleaned}%`);
      }
    }

    const { data: customers, error } = await dbQuery.limit(10);

    if (error) {
      console.error('[Admin Customer Search] DB Error:', error);
      return NextResponse.json(
        { error: 'Database error searching customer.' },
        { status: 500 }
      );
    }

    if (!customers || customers.length === 0) {
      return NextResponse.json({
        found: false,
        message: 'No customer found matching the provided mobile number or email.',
        customers: [],
      });
    }

    // 4. Fetch orders and count delivered orders per customer
    const customerIds = customers.map((c) => String(c.id).toLowerCase().trim());
    const customerEmails = customers.map((c) => String(c.applicant_email).toLowerCase().trim()).filter(Boolean);
    const customerMobiles = customers.map((c) => String(c.mobile).replace(/\D/g, '').slice(-10)).filter(Boolean);
    const customerNames = customers.map((c) => String(c.full_name).toLowerCase().trim()).filter(Boolean);

    interface NormalizedOrder {
      id: string;
      userId: string;
      userName: string;
      userEmail: string;
      phone: string;
      status: string;
    }

    const allOrdersMap = new Map<string, NormalizedOrder>();

    // 4a. Prioritize in-memory memoryOrders first (instant optimistic changes in admin session)
    try {
      if (Array.isArray(memoryOrders)) {
        memoryOrders.forEach((mo) => {
          const rawPhone = String(mo.shippingAddress?.phone || '');
          const phone = rawPhone.replace(/\D/g, '').slice(-10);
          const orderId = String(mo.id);

          allOrdersMap.set(orderId, {
            id: orderId,
            userId: mo.userId ? String(mo.userId).toLowerCase().trim() : '',
            userName: mo.userName ? String(mo.userName).toLowerCase().trim() : '',
            userEmail: mo.userEmail ? String(mo.userEmail).toLowerCase().trim() : '',
            phone,
            status: String(mo.status || '').toLowerCase().trim(),
          });
        });
      }
    } catch (memErr) {
      console.warn('[Admin Customer Search] Error reading memory orders:', memErr);
    }

    // 4b. Fetch from Supabase orders table (only set if not already updated in current memory session)
    try {
      const { data: dbOrders, error: dbOrdersError } = await supabase
        .from('orders')
        .select('*');

      if (!dbOrdersError && Array.isArray(dbOrders)) {
        dbOrders.forEach((o) => {
          const orderId = String(o.id);
          const dbStatus = String(o.status || '').toLowerCase().trim();

          let phone = '';
          if (o.shipping_address && typeof o.shipping_address === 'object') {
            const addr = o.shipping_address as Record<string, unknown>;
            phone = String(addr.phone || addr.mobile || '').replace(/\D/g, '').slice(-10);
          }

          if (!allOrdersMap.has(orderId)) {
            allOrdersMap.set(orderId, {
              id: orderId,
              userId: o.user_id ? String(o.user_id).toLowerCase().trim() : '',
              userName: o.user_name ? String(o.user_name).toLowerCase().trim() : '',
              userEmail: o.user_email ? String(o.user_email).toLowerCase().trim() : '',
              phone,
              status: dbStatus,
            });
          } else {
            // If DB has a definitive status and memory is older, synchronize status
            const existing = allOrdersMap.get(orderId)!;
            // Always respect 'cancelled' if DB has cancelled
            if (dbStatus === 'cancelled') {
              existing.status = 'cancelled';
            }
          }
        });
      }
    } catch (dbErr) {
      console.warn('[Admin Customer Search] Error fetching orders from Supabase:', dbErr);
    }

    // 4c. Calculate delivered order count per customer
    const deliveredOrderCountMap: Record<string, number> = {};

    allOrdersMap.forEach((order) => {
      // Must be delivered
      if (order.status !== 'delivered') return;

      customerIds.forEach((cid, idx) => {
        const email = customerEmails[idx] || '';
        const phone = customerMobiles[idx] || '';
        const name = customerNames[idx] || '';

        const matchesId = order.userId && (order.userId === cid || cid.includes(order.userId) || order.userId.includes(cid));
        const matchesEmail = email && order.userEmail && order.userEmail === email;
        const matchesPhone = phone && order.phone && order.phone === phone;
        const matchesName = name && order.userName && order.userName === name;

        if (matchesId || matchesEmail || matchesPhone || matchesName) {
          deliveredOrderCountMap[cid] = (deliveredOrderCountMap[cid] || 0) + 1;
        }
      });
    });

    // 5. Format results safely
    const formatted: CustomerSearchResult[] = customers.map((c) => {
      const cidKey = String(c.id).toLowerCase().trim();
      return {
        id: String(c.id),
        fullName: String(c.full_name || ''),
        mobile: String(c.mobile || ''),
        email: String(c.applicant_email || ''),
        shopAddress: String(c.shop_address || ''),
        landmark: String(c.landmark || ''),
        city: String(c.city || ''),
        state: String(c.state || ''),
        pincode: String(c.pincode || ''),
        businessType: c.business_type === 'retail_store' ? 'Retail Store' : (c.business_type === 'hawker' ? 'Hawker' : String(c.business_type || '—')),
        status: String(c.status || 'pending'),
        createdAt: c.created_at ? new Date(String(c.created_at)).toISOString() : new Date().toISOString(),
        totalOrders: deliveredOrderCountMap[cidKey] || 0,
      };
    });

    return NextResponse.json({
      found: true,
      customers: formatted,
    });
  } catch (err) {
    console.error('[Admin Customer Search] Unexpected error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred while searching for the customer.' },
      { status: 500 }
    );
  }
}
