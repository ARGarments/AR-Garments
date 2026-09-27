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

const COUPON_COLUMNS = 'id, code, title, description, discount_type, discount_value, applicable_category, min_order_value, max_discount_amount, usage_limit, used_count, valid_from, valid_until, active';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawCode = (body.code || '').trim().toUpperCase();
    const productCategory = (body.category || '').trim();
    const orderAmount = Number(body.orderAmount ?? body.productPrice ?? 0);

    if (!rawCode) {
      return NextResponse.json({ valid: false, message: 'Please enter a coupon code.' }, { status: 400 });
    }

    const supabase = getAdminClient();
    let coupon: Record<string, unknown> | null = null;

    // Try fetching from DB
    const { data, error } = await supabase
      .from('coupons')
      .select(COUPON_COLUMNS)
      .ilike('code', rawCode)
      .single();

    if (!error && data) {
      coupon = data;
    } else {
      // Fallback search in defaultCoupons
      const found = defaultCoupons.find(c => c.code.toUpperCase() === rawCode);
      if (found) {
        coupon = {
          id: found.id,
          code: found.code,
          title: found.title,
          description: found.description,
          discount_type: found.discountType,
          discount_value: found.discountValue,
          applicable_category: found.applicableCategory,
          min_order_value: found.minOrderValue,
          max_discount_amount: found.maxDiscountAmount,
          usage_limit: found.usageLimit,
          used_count: found.usedCount,
          active: found.active,
        };
      }
    }

    if (!coupon) {
      return NextResponse.json({
        valid: false,
        message: `Coupon code '${rawCode}' is invalid or does not exist.`,
      });
    }

    // 1. Active Check
    if (!coupon.active) {
      return NextResponse.json({
        valid: false,
        message: `Coupon code '${rawCode}' is currently inactive.`,
      });
    }

    // 2. Date Expiry Check
    const now = new Date();
    if (coupon.valid_from && new Date(coupon.valid_from as string) > now) {
      return NextResponse.json({
        valid: false,
        message: `Coupon code '${rawCode}' is not yet active. Valid from ${new Date(coupon.valid_from as string).toLocaleDateString()}.`,
      });
    }
    if (coupon.valid_until && new Date(coupon.valid_until as string) < now) {
      return NextResponse.json({
        valid: false,
        message: `Coupon code '${rawCode}' has expired.`,
      });
    }

    // 3. Usage Limit Check
    if (coupon.usage_limit && Number(coupon.used_count || 0) >= Number(coupon.usage_limit)) {
      return NextResponse.json({
        valid: false,
        message: `Coupon code '${rawCode}' has reached its maximum redemption limit.`,
      });
    }

    // 4. CATEGORY SPECIFIC CHECK
    const applicableCategory = (coupon.applicable_category as string) || 'All';
    if (applicableCategory !== 'All') {
      if (!productCategory) {
        return NextResponse.json({
          valid: false,
          message: `This coupon is exclusively applicable for '${applicableCategory}' products.`,
        });
      }

      if (productCategory.toLowerCase() !== applicableCategory.toLowerCase()) {
        return NextResponse.json({
          valid: false,
          message: `Category Mismatch: Coupon '${rawCode}' is valid only for '${applicableCategory}'. It cannot be applied to '${productCategory}'.`,
          requiredCategory: applicableCategory,
          currentCategory: productCategory,
        });
      }
    }

    // 5. Minimum Order Value Check
    const minOrder = Number(coupon.min_order_value || 0);
    if (orderAmount > 0 && orderAmount < minOrder) {
      return NextResponse.json({
        valid: false,
        message: `Minimum order value of ₹${minOrder} required. Add ₹${minOrder - orderAmount} more to unlock this coupon.`,
        minOrderValue: minOrder,
      });
    }

    // 6. Calculate Discount Amount
    const discountType = (coupon.discount_type as string) || 'percentage';
    const discountVal = Number(coupon.discount_value || 0);
    const maxDiscount = coupon.max_discount_amount ? Number(coupon.max_discount_amount) : null;
    let discountAmount = 0;

    if (discountType === 'percentage') {
      discountAmount = Math.round((orderAmount * discountVal) / 100);
      if (maxDiscount !== null && discountAmount > maxDiscount) {
        discountAmount = maxDiscount;
      }
    } else if (discountType === 'flat') {
      discountAmount = Math.min(discountVal, orderAmount);
    } else if (discountType === 'free_shipping') {
      discountAmount = 0; // Handled as free delivery flag
    }

    const finalAmount = Math.max(0, orderAmount - discountAmount);

    return NextResponse.json({
      valid: true,
      message: `Coupon '${coupon.code}' applied successfully!`,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        title: coupon.title,
        description: coupon.description,
        discountType,
        discountValue: discountVal,
        applicableCategory,
        maxDiscountAmount: maxDiscount,
      },
      discountAmount,
      originalAmount: orderAmount,
      finalAmount,
      isFreeShipping: discountType === 'free_shipping',
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error validating coupon';
    return NextResponse.json({ valid: false, message: errorMsg }, { status: 500 });
  }
}
