import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { defaultCoupons } from '@/lib/adminData';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

const COUPON_COLUMNS = 'id, code, title, description, discount_type, discount_value, applicable_category, min_order_value, max_discount_amount, usage_limit, used_count, valid_from, valid_until, active, created_at';

// In-memory store fallback if Supabase table is not yet created
let memoryCoupons = [...defaultCoupons];

// GET /api/coupons — fetch coupons (with optional filtering)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const activeOnly = searchParams.get('active') === 'true';

  try {
    const supabase = getAdminClient();
    let query = supabase
      .from('coupons')
      .select(COUPON_COLUMNS)
      .order('created_at', { ascending: false });

    if (activeOnly) {
      query = query.eq('active', true);
    }

    const { data, error } = await query;

    if (error) {
      // Fallback to memory store if table does not exist
      let filtered = [...memoryCoupons];
      if (activeOnly) filtered = filtered.filter(c => c.active);
      if (category && category !== 'All') {
        filtered = filtered.filter(
          c => c.applicableCategory === 'All' || c.applicableCategory.toLowerCase() === category.toLowerCase()
        );
      }
      return NextResponse.json(filtered, {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'X-Source': 'memory-fallback',
        },
      });
    }

    // Map snake_case to camelCase
    let mapped = (data || []).map((c: Record<string, unknown>) => ({
      id: c.id as string,
      code: c.code as string,
      title: c.title as string,
      description: (c.description as string) || '',
      discountType: c.discount_type as string,
      discountValue: Number(c.discount_value),
      applicableCategory: (c.applicable_category as string) || 'All',
      minOrderValue: Number(c.min_order_value || 0),
      maxDiscountAmount: c.max_discount_amount ? Number(c.max_discount_amount) : null,
      usageLimit: c.usage_limit ? Number(c.usage_limit) : null,
      usedCount: Number(c.used_count || 0),
      validFrom: c.valid_from as string,
      validUntil: c.valid_until as string | null,
      active: Boolean(c.active),
      createdAt: c.created_at as string,
    }));

    if (category && category !== 'All') {
      mapped = mapped.filter(
        (c) => c.applicableCategory === 'All' || c.applicableCategory.toLowerCase() === category.toLowerCase()
      );
    }

    return NextResponse.json(mapped, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch {
    return NextResponse.json(memoryCoupons, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  }
}

// POST /api/coupons — create a new coupon
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const code = (body.code || '').trim().toUpperCase();

    if (!code) {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
    }
    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const newCoupon = {
      id: body.id || `coupon-${Date.now()}`,
      code,
      title: body.title,
      description: body.description || '',
      discount_type: body.discountType || 'percentage',
      discount_value: Number(body.discountValue) || 0,
      applicable_category: body.applicableCategory || 'All',
      min_order_value: Number(body.minOrderValue) || 0,
      max_discount_amount: body.maxDiscountAmount ? Number(body.maxDiscountAmount) : null,
      usage_limit: body.usageLimit ? Number(body.usageLimit) : null,
      used_count: 0,
      valid_from: body.validFrom || new Date().toISOString(),
      valid_until: body.validUntil || null,
      active: body.active !== undefined ? Boolean(body.active) : true,
    };

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('coupons')
      .insert(newCoupon)
      .select(COUPON_COLUMNS)
      .single();

    if (error) {
      // Fallback save to memory
      const memoryItem = {
        id: newCoupon.id,
        code: newCoupon.code,
        title: newCoupon.title,
        description: newCoupon.description,
        discountType: newCoupon.discount_type as any,
        discountValue: newCoupon.discount_value,
        applicableCategory: newCoupon.applicable_category,
        minOrderValue: newCoupon.min_order_value,
        maxDiscountAmount: newCoupon.max_discount_amount,
        usageLimit: newCoupon.usage_limit,
        usedCount: 0,
        validFrom: newCoupon.valid_from,
        validUntil: newCoupon.valid_until,
        active: newCoupon.active,
        createdAt: new Date().toISOString(),
      };
      memoryCoupons = [memoryItem, ...memoryCoupons.filter(c => c.code !== code)];
      return NextResponse.json(memoryItem, { status: 201 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to create coupon';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

// PATCH /api/coupons?id=... — update coupon
export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing coupon id' }, { status: 400 });

    const body = await request.json();
    const patch: Record<string, unknown> = {};

    if (body.code !== undefined) patch.code = body.code.trim().toUpperCase();
    if (body.title !== undefined) patch.title = body.title;
    if (body.description !== undefined) patch.description = body.description;
    if (body.discountType !== undefined) patch.discount_type = body.discountType;
    if (body.discountValue !== undefined) patch.discount_value = Number(body.discountValue);
    if (body.applicableCategory !== undefined) patch.applicable_category = body.applicableCategory;
    if (body.minOrderValue !== undefined) patch.min_order_value = Number(body.minOrderValue);
    if (body.maxDiscountAmount !== undefined) {
      patch.max_discount_amount = body.maxDiscountAmount ? Number(body.maxDiscountAmount) : null;
    }
    if (body.usageLimit !== undefined) {
      patch.usage_limit = body.usageLimit ? Number(body.usageLimit) : null;
    }
    if (body.usedCount !== undefined) patch.used_count = Number(body.usedCount);
    if (body.validFrom !== undefined) patch.valid_from = body.validFrom;
    if (body.validUntil !== undefined) patch.valid_until = body.validUntil || null;
    if (body.active !== undefined) patch.active = Boolean(body.active);

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('coupons')
      .update(patch)
      .eq('id', id)
      .select(COUPON_COLUMNS)
      .single();

    if (error) {
      // Memory fallback update
      const idx = memoryCoupons.findIndex(c => c.id === id);
      if (idx !== -1) {
        memoryCoupons[idx] = {
          ...memoryCoupons[idx],
          ...(body.code ? { code: body.code.trim().toUpperCase() } : {}),
          ...(body.title !== undefined ? { title: body.title } : {}),
          ...(body.description !== undefined ? { description: body.description } : {}),
          ...(body.discountType !== undefined ? { discountType: body.discountType } : {}),
          ...(body.discountValue !== undefined ? { discountValue: Number(body.discountValue) } : {}),
          ...(body.applicableCategory !== undefined ? { applicableCategory: body.applicableCategory } : {}),
          ...(body.minOrderValue !== undefined ? { minOrderValue: Number(body.minOrderValue) } : {}),
          ...(body.maxDiscountAmount !== undefined ? { maxDiscountAmount: body.maxDiscountAmount } : {}),
          ...(body.usageLimit !== undefined ? { usageLimit: body.usageLimit } : {}),
          ...(body.active !== undefined ? { active: Boolean(body.active) } : {}),
        };
        return NextResponse.json(memoryCoupons[idx]);
      }
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to update coupon';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

// DELETE /api/coupons?id=... — delete coupon
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing coupon id' }, { status: 400 });

    const supabase = getAdminClient();
    const { error } = await supabase.from('coupons').delete().eq('id', id);

    memoryCoupons = memoryCoupons.filter(c => c.id !== id);

    if (error) {
      return NextResponse.json({ success: true, fallback: true });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to delete coupon';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
