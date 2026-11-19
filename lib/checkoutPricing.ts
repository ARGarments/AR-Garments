import { getServiceSupabase } from '@/lib/supabase';
import { OrderItem } from '@/lib/orders';
import { calculateShippingCharge } from '@/lib/shipping';
import { getShippingSettings } from '@/lib/shippingSettings.server';
import {
  ZonePriceRule,
  mapDbRowToRule,
  resolveMarkupZone,
  findMatchingRule,
  computeZonePrice,
} from '@/lib/zonePriceMarkup';
import {
  ZoneShippingSetting,
  DEFAULT_ZONE_SETTINGS,
  calculateZoneDelivery,
  resolveZoneByPincode,
} from '@/lib/zoneShipping';

interface CheckoutItemInput {
  id: string;
  quantity: number;
}

interface ProductRow {
  id: string;
  name: string;
  price: string;
  numeric_price: number;
  image: string;
  category: string;
  category_id?: string | null;
  subcategory_id?: string | null;
  subcategory_name?: string | null;
  delivery_type?: string | null;
  delivery_charge_amount?: number | null;
  stock: number;
  active: boolean;
}

interface CouponRow {
  code: string;
  discount_type: 'percentage' | 'flat' | 'free_shipping';
  discount_value: number;
  applicable_category: string;
  min_order_value: number;
  max_discount_amount: number | null;
  usage_limit: number | null;
  used_count: number;
  valid_from: string | null;
  valid_until: string | null;
  active: boolean;
}

export interface CheckoutPricing {
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  couponCode?: string;
  couponDiscount?: number;
  onlineDiscount?: number;
  onlineDiscountPercent?: number;
}

export class CheckoutPricingError extends Error {}

function normalizeItems(rawItems: unknown): CheckoutItemInput[] {
  if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > 50) {
    throw new CheckoutPricingError('The cart must contain between 1 and 50 products.');
  }

  const quantities = new Map<string, number>();
  for (const rawItem of rawItems) {
    if (!rawItem || typeof rawItem !== 'object') {
      throw new CheckoutPricingError('The cart contains an invalid item.');
    }

    const item = rawItem as Record<string, unknown>;
    const id = String(item.id || '').trim();
    const quantity = Number(item.quantity);
    if (!id || !Number.isInteger(quantity) || quantity <= 0) {
      throw new CheckoutPricingError('Every cart item requires a valid product ID and quantity.');
    }

    quantities.set(id, (quantities.get(id) || 0) + quantity);
  }

  return Array.from(quantities, ([id, quantity]) => ({ id, quantity }));
}

const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;

async function fetchProductsByIds(ids: string[]): Promise<ProductRow[]> {
  if (ids.length === 0) return [];
  const supabase = getServiceSupabase();
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, price, numeric_price, image, category, category_id, subcategory_id, delivery_type, delivery_charge_amount, stock, active')
      .in('id', ids);

    if (!error && Array.isArray(data)) {
      return data as ProductRow[];
    }

    const fallback = await supabase
      .from('products')
      .select('id, name, price, numeric_price, image, category, stock, active')
      .in('id', ids);
    return Array.isArray(fallback.data) ? (fallback.data as unknown as ProductRow[]) : [];
  } catch {
    return [];
  }
}

async function getProducts(items: CheckoutItemInput[]): Promise<Map<string, ProductRow>> {
  const productMap = new Map<string, ProductRow>();
  const rawIds = items.map((item) => String(item.id).trim());

  // 1. Direct fetch from products table
  const directRows = await fetchProductsByIds(rawIds);
  for (const row of directRows) {
    productMap.set(String(row.id), row);
  }

  // 2. Resolve any missing items that represent variants (e.g. composite "prod-XXXXX-UUID" or raw variant ID)
  const missingItems = items.filter((item) => !productMap.has(String(item.id).trim()));

  if (missingItems.length > 0) {
    const supabase = getServiceSupabase();
    const variantUuidToItemIds = new Map<string, string[]>();

    for (const item of missingItems) {
      const itemIdStr = String(item.id).trim();
      const match = itemIdStr.match(UUID_REGEX);
      if (match) {
        const vUuid = match[0];
        const existing = variantUuidToItemIds.get(vUuid) || [];
        existing.push(itemIdStr);
        variantUuidToItemIds.set(vUuid, existing);
      }
    }

    const variantUuids = Array.from(variantUuidToItemIds.keys());
    if (variantUuids.length > 0) {
      try {
        const { data: variants, error: vErr } = await supabase
          .from('product_variants')
          .select('*')
          .in('id', variantUuids);

        if (!vErr && Array.isArray(variants) && variants.length > 0) {
          const parentIds = Array.from(new Set(variants.map((v) => String(v.product_id)).filter(Boolean)));
          const parentRows = await fetchProductsByIds(parentIds);
          const parentMap = new Map(parentRows.map((p) => [String(p.id), p]));

          for (const variant of variants) {
            const parent = parentMap.get(String(variant.product_id));
            if (!parent) continue;

            const variantStock = Number(
              variant.available_sets !== undefined && variant.available_sets !== null
                ? variant.available_sets
                : (variant.available_pieces ?? variant.total_stock_pieces ?? parent.stock ?? 0)
            );

            const variantPrice = Number(
              variant.total_set_price || variant.price_per_piece || parent.numeric_price || 0
            );

            const variantImage = (Array.isArray(variant.images) && variant.images[0]) || parent.image || '';

            const variantName = (variant.colour || variant.size)
              ? `${parent.name} - ${variant.colour || ''} (${variant.size || ''})`.replace(/\(\s*\)/, '').trim()
              : parent.name;

            const matchedItemIds = variantUuidToItemIds.get(variant.id) || [variant.id];
            for (const origId of matchedItemIds) {
              productMap.set(origId, {
                id: origId,
                name: variantName,
                price: `₹${variantPrice}`,
                numeric_price: variantPrice,
                image: variantImage,
                category: parent.category,
                category_id: parent.category_id,
                subcategory_id: parent.subcategory_id,
                subcategory_name: parent.subcategory_name,
                delivery_type: variant.delivery_type || parent.delivery_type,
                delivery_charge_amount: variant.delivery_charge_amount ?? parent.delivery_charge_amount,
                stock: variantStock,
                active: variant.active !== undefined && variant.active !== null ? Boolean(variant.active) : Boolean(parent.active),
              });
            }
          }
        }
      } catch (err) {
        console.error('[getProducts] Variant resolution error:', err);
      }
    }

    // 3. Fallback for any still missing items: try stripping variant suffix to match parent product
    const stillMissing = items.filter((item) => !productMap.has(String(item.id).trim()));
    if (stillMissing.length > 0) {
      for (const item of stillMissing) {
        const idStr = String(item.id).trim();
        const parts = idStr.split('-');
        if (parts.length >= 2 && parts[0] === 'prod') {
          const possibleParentId = `${parts[0]}-${parts[1]}`;
          const parentRows = await fetchProductsByIds([possibleParentId]);
          if (parentRows.length > 0) {
            const p = parentRows[0];
            productMap.set(idStr, {
              ...p,
              id: idStr,
            });
          }
        }
      }
    }
  }

  return productMap;
}

async function getZonePriceRules(): Promise<ZonePriceRule[]> {
  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('zone_price_rules')
      .select('*');
    if (!error && data) {
      return data.map(mapDbRowToRule);
    }
  } catch {
    // Ignore and fallback
  }
  return [];
}

async function getZoneShippingSettings(): Promise<ZoneShippingSetting[]> {
  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('zone_shipping_settings')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!error && data && data.length > 0) {
      const mapped = data.map((row: Record<string, unknown>) => ({
        id: String(row.id),
        zoneName: String(row.zone_name || ''),
        zoneNameHi: String(row.zone_name_hi || ''),
        isActive: Boolean(row.is_active),
        freeDeliveryThreshold: Number(row.free_delivery_threshold) || 0,
        standardDeliveryFee: Number(row.standard_delivery_fee) || 0,
        onlinePaymentDiscount: Number(row.online_payment_discount) || 0,
        customPincodes: Array.isArray(row.custom_pincodes) ? (row.custom_pincodes as string[]) : [],
        sortOrder: Number(row.sort_order) || 0,
        updatedAt: row.updated_at ? String(row.updated_at) : null,
      }));

      // Cross-sync onlinePaymentDiscount from local file if DB had 0 or not yet migrated
      try {
        const fs = await import('fs');
        const path = await import('path');
        const filePath = path.join(process.cwd(), 'data', 'zone_shipping_settings.json');
        if (fs.existsSync(filePath)) {
          const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          if (Array.isArray(fileData)) {
            for (const item of fileData) {
              const m = mapped.find((x) => x.id === item.id);
              if (m && item.onlinePaymentDiscount !== undefined && !m.onlinePaymentDiscount) {
                m.onlinePaymentDiscount = Number(item.onlinePaymentDiscount) || 0;
              }
            }
          }
        }
      } catch {}

      // Cross-sync with delivery_zones table so ON/OFF toggled by admin is 100% honored
      try {
        const { data: dZones } = await supabase.from('delivery_zones').select('zone_key, name, is_active');
        if (dZones && dZones.length > 0) {
          for (const dz of dZones) {
            const k = (dz.zone_key || '').toLowerCase();
            const n = (dz.name || '').toLowerCase();
            let targetId: string | null = null;
            if (k.includes('city') || k.includes('nagar') || n.includes('city')) targetId = 'zone_nagar_nigam';
            else if (k.includes('rural') || k.includes('dehat') || n.includes('rural') || n.includes('dehat')) targetId = 'zone_dehat';
            else if (k.includes('pan') || n.includes('pan') || n.includes('outside')) targetId = 'zone_pan_india';

            if (targetId) {
              const z = mapped.find((m) => m.id === targetId);
              if (z) {
                z.isActive = Boolean(dz.is_active);
              }
            }
          }
        }
      } catch {}

      return mapped;
    }
  } catch {
    // Fallback to defaults
  }
  return DEFAULT_ZONE_SETTINGS;
}

async function getCoupon(code: string): Promise<CouponRow> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('coupons')
    .select(
      'code, discount_type, discount_value, applicable_category, min_order_value, max_discount_amount, usage_limit, used_count, valid_from, valid_until, active'
    )
    .ilike('code', code)
    .maybeSingle();

  if (error) {
    throw new CheckoutPricingError(`Unable to validate the coupon: ${error.message}`);
  }
  if (!data) {
    throw new CheckoutPricingError('The applied coupon no longer exists.');
  }

  return data as CouponRow;
}

function calculateCouponDiscount(
  coupon: CouponRow,
  products: ProductRow[],
  subtotal: number
): { discount: number; freeShipping: boolean } {
  const now = Date.now();
  if (!coupon.active) {
    throw new CheckoutPricingError('The applied coupon is inactive.');
  }
  if (coupon.valid_from && new Date(coupon.valid_from).getTime() > now) {
    throw new CheckoutPricingError('The applied coupon is not active yet.');
  }
  if (coupon.valid_until && new Date(coupon.valid_until).getTime() < now) {
    throw new CheckoutPricingError('The applied coupon has expired.');
  }
  if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
    throw new CheckoutPricingError('The applied coupon has reached its usage limit.');
  }
  if (subtotal < Number(coupon.min_order_value || 0)) {
    throw new CheckoutPricingError('The cart no longer meets the coupon minimum order value.');
  }

  const category = coupon.applicable_category || 'All';
  if (
    category !== 'All' &&
    products.some((product) => product.category.toLowerCase() !== category.toLowerCase())
  ) {
    throw new CheckoutPricingError(`The applied coupon is only valid for ${category} products.`);
  }

  if (coupon.discount_type === 'free_shipping') {
    return { discount: 0, freeShipping: true };
  }

  const discountValue = Number(coupon.discount_value || 0);
  let discount =
    coupon.discount_type === 'percentage'
      ? Math.round((subtotal * discountValue) / 100)
      : Math.min(discountValue, subtotal);

  if (coupon.max_discount_amount !== null) {
    discount = Math.min(discount, Number(coupon.max_discount_amount));
  }

  return { discount, freeShipping: false };
}

export async function calculateCheckoutPricing(
  rawItems: unknown,
  rawCouponCode: unknown,
  rawPincode?: string | null,
  rawCity?: string | null,
  paymentMethod?: string | null
): Promise<CheckoutPricing> {
  const items = normalizeItems(rawItems);
  const productMap = await getProducts(items);

  const products = items.map((item) => {
    const product = productMap.get(item.id);
    if (!product || !product.active) {
      throw new CheckoutPricingError(`Product ${item.id} is unavailable.`);
    }
    if (item.quantity > Number(product.stock)) {
      throw new CheckoutPricingError(`Only ${product.stock} unit(s) of ${product.name} are available.`);
    }
    if (!Number.isFinite(Number(product.numeric_price)) || Number(product.numeric_price) <= 0) {
      throw new CheckoutPricingError(`Product ${product.name} has an invalid price.`);
    }
    return product;
  });

  // Resolve Zone-Wise Markup Rules
  const zoneRules = await getZonePriceRules();
  const userMarkupZone = resolveMarkupZone(rawPincode, rawCity);

  const canonicalItems: OrderItem[] = items.map((item) => {
    const product = productMap.get(item.id)!;
    const basePrice = Number(product.numeric_price);

    const matchingRule = findMatchingRule(zoneRules, {
      categoryId: product.category_id,
      categoryName: product.category,
      subcategoryId: product.subcategory_id,
      subcategoryName: product.subcategory_name,
    });

    const zonePriceResult = computeZonePrice(basePrice, matchingRule, userMarkupZone);
    const effectivePrice = zonePriceResult.hasRule ? zonePriceResult.displayPrice : basePrice;

    return {
      id: product.id,
      name: product.name,
      price: String(effectivePrice),
      numericPrice: effectivePrice,
      image: product.image,
      category: product.category,
      quantity: item.quantity,
    };
  });

  const subtotal = canonicalItems.reduce(
    (sum, item) => sum + Number(item.numericPrice) * item.quantity,
    0
  );

  const standardSubtotal = items.reduce((sum, item) => {
    const product = productMap.get(item.id)!;
    if (product.delivery_type !== 'low_margin') {
      const canonical = canonicalItems.find((c) => c.id === item.id);
      return sum + (canonical ? canonical.numericPrice! * item.quantity : 0);
    }
    return sum;
  }, 0);

  const lowMarginDeliveryTotal = items.reduce((sum, item) => {
    const product = productMap.get(item.id)!;
    if (product.delivery_type === 'low_margin') {
      return sum + (Number(product.delivery_charge_amount) || 0) * item.quantity;
    }
    return sum;
  }, 0);

  const couponCode = typeof rawCouponCode === 'string' ? rawCouponCode.trim().toUpperCase() : '';
  const couponResult = couponCode
    ? calculateCouponDiscount(await getCoupon(couponCode), products, subtotal)
    : { discount: 0, freeShipping: false };

  // Calculate Zone Delivery
  let baseShipping = 0;
  if (rawPincode && rawPincode.replace(/\D/g, '').length >= 3) {
    const zoneSettings = await getZoneShippingSettings();
    const zoneDelivery = calculateZoneDelivery(
      standardSubtotal,
      rawPincode,
      zoneSettings,
      couponResult.freeShipping
    );

    if (zoneDelivery.isClosed) {
      throw new CheckoutPricingError(
        zoneDelivery.closedMessage || 'Delivery is temporarily closed for this area / आपके क्षेत्र में सेवा अभी बंद है।'
      );
    }

    baseShipping = zoneDelivery.deliveryFee;
  } else {
    try {
      const shippingSettings = await getShippingSettings();
      baseShipping = calculateShippingCharge(subtotal, shippingSettings, couponResult.freeShipping);
    } catch {
      baseShipping = 0;
    }
  }

  // Calculate Zone Online Payment Discount if user chooses online payment
  let onlineDiscount = 0;
  let onlineDiscountPercent = 0;
  if (paymentMethod === 'online' && rawPincode) {
    const zoneSettings = await getZoneShippingSettings();
    const zone = resolveZoneByPincode(rawPincode, zoneSettings);
    onlineDiscountPercent = Number(zone.onlinePaymentDiscount) || 0;
    if (onlineDiscountPercent > 0) {
      const discountableBase = Math.max(0, subtotal - couponResult.discount);
      onlineDiscount = Math.round((discountableBase * onlineDiscountPercent) / 100);
    }
  }

  const shipping = baseShipping + lowMarginDeliveryTotal;
  const total = Math.max(0, subtotal - couponResult.discount - onlineDiscount + shipping);

  if (total < 1) {
    throw new CheckoutPricingError('The payable amount must be at least ₹1.');
  }

  return {
    items: canonicalItems,
    subtotal,
    discount: couponResult.discount + onlineDiscount,
    couponDiscount: couponResult.discount,
    onlineDiscount,
    onlineDiscountPercent,
    shipping,
    total,
    ...(couponCode ? { couponCode } : {}),
  };
}
