import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/adminSession';
import { getServiceSupabase } from '@/lib/supabase';
import {
  DEFAULT_ZONE_SETTINGS,
  ZoneShippingSetting,
} from '@/lib/zoneShipping';
import { updateMemoryZoneActive } from '@/lib/deliveryPartners';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0, s-maxage=0',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
};

// GET /api/shipping-settings — Returns all 3 zone configurations
export async function GET(): Promise<NextResponse> {
  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('zone_shipping_settings')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error || !data || data.length === 0) {
      try {
        const filePath = path.join(process.cwd(), 'data', 'zone_shipping_settings.json');
        if (fs.existsSync(filePath)) {
          const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          if (Array.isArray(fileData) && fileData.length > 0) {
            return NextResponse.json(fileData, { headers: NO_STORE_HEADERS });
          }
        }
      } catch {}
      // Fallback to default 3 zones if table not yet migrated or query fails
      return NextResponse.json(DEFAULT_ZONE_SETTINGS, { headers: NO_STORE_HEADERS });
    }

    const mapped: ZoneShippingSetting[] = data.map((row: Record<string, unknown>) => ({
      id: String(row.id),
      zoneName: String(row.zone_name || ''),
      zoneNameHi: String(row.zone_name_hi || ''),
      isActive: Boolean(row.is_active),
      isFreeDeliveryEnabled: row.is_free_delivery_enabled !== undefined ? Boolean(row.is_free_delivery_enabled) : true,
      freeDeliveryThreshold: Number(row.free_delivery_threshold) || 0,
      standardDeliveryFee: Number(row.standard_delivery_fee) || 0,
      allowCod: row.allow_cod !== undefined ? Boolean(row.allow_cod) : true,
      customPincodes: Array.isArray(row.custom_pincodes) ? (row.custom_pincodes as string[]) : [],
      sortOrder: Number(row.sort_order) || 0,
      updatedAt: row.updated_at ? String(row.updated_at) : null,
      isOnlineDiscountEnabled: row.is_online_discount_enabled !== undefined ? Boolean(row.is_online_discount_enabled) : true,
      onlinePaymentDiscount: Number(row.online_payment_discount) || 0,
    }));

    // Merge from local fallback file: supplement toggles and onlinePaymentDiscount if DB is out of sync
    try {
      const filePath = path.join(process.cwd(), 'data', 'zone_shipping_settings.json');
      if (fs.existsSync(filePath)) {
        const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (Array.isArray(fileData)) {
          for (const item of fileData) {
            const m = mapped.find((x) => x.id === item.id);
            if (m) {
              if (item.isActive !== undefined) m.isActive = Boolean(item.isActive);
              if (item.isFreeDeliveryEnabled !== undefined) m.isFreeDeliveryEnabled = Boolean(item.isFreeDeliveryEnabled);
              if (item.allowCod !== undefined) m.allowCod = Boolean(item.allowCod);
              if (item.isOnlineDiscountEnabled !== undefined) m.isOnlineDiscountEnabled = Boolean(item.isOnlineDiscountEnabled);
              if (item.onlinePaymentDiscount !== undefined && !m.onlinePaymentDiscount) {
                m.onlinePaymentDiscount = Number(item.onlinePaymentDiscount) || 0;
              }
            }
          }
        }
      }
    } catch {}

    return NextResponse.json(mapped, { headers: NO_STORE_HEADERS });
  } catch (error: unknown) {
    console.error('Error fetching zone shipping settings:', error);
    // Graceful fallback to default zones
    return NextResponse.json(DEFAULT_ZONE_SETTINGS, { headers: NO_STORE_HEADERS });
  }
}

// PATCH /api/shipping-settings — Updates 3 zone configurations
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Admin authentication is required.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const zones = Array.isArray(body) ? body : body.zones;

    if (!Array.isArray(zones) || zones.length === 0) {
      return NextResponse.json(
        { error: 'Invalid payload: zones array required.' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();
    const now = new Date().toISOString();

    const upsertRows = zones.map((z: Record<string, unknown>, index: number) => {
      const freeThreshold = Math.max(0, Number(z.freeDeliveryThreshold ?? z.free_delivery_threshold) || 0);
      const standardFee = Math.max(0, Number(z.standardDeliveryFee ?? z.standard_delivery_fee) || 0);
      const onlineDiscount = Math.max(0, Math.min(100, Number(z.onlinePaymentDiscount ?? z.online_payment_discount) || 0));

      const isFreeDeliveryEnabled = z.isFreeDeliveryEnabled !== undefined ? Boolean(z.isFreeDeliveryEnabled) : (z.is_free_delivery_enabled !== undefined ? Boolean(z.is_free_delivery_enabled) : true);
      const allowCod = z.allowCod !== undefined ? Boolean(z.allowCod) : (z.allow_cod !== undefined ? Boolean(z.allow_cod) : true);
      const isOnlineDiscountEnabled = z.isOnlineDiscountEnabled !== undefined ? Boolean(z.isOnlineDiscountEnabled) : (z.is_online_discount_enabled !== undefined ? Boolean(z.is_online_discount_enabled) : true);

      return {
        id: String(z.id || `zone_${index + 1}`),
        zone_name: String(z.zoneName || z.zone_name || `Zone ${index + 1}`),
        zone_name_hi: String(z.zoneNameHi || z.zone_name_hi || ''),
        is_active: Boolean(z.isActive ?? z.is_active),
        is_free_delivery_enabled: isFreeDeliveryEnabled,
        free_delivery_threshold: freeThreshold,
        standard_delivery_fee: standardFee,
        allow_cod: allowCod,
        is_online_discount_enabled: isOnlineDiscountEnabled,
        online_payment_discount: onlineDiscount,
        custom_pincodes: Array.isArray(z.customPincodes)
          ? z.customPincodes
          : (Array.isArray(z.custom_pincodes) ? z.custom_pincodes : []),
        sort_order: Number(z.sortOrder ?? z.sort_order ?? index + 1),
        updated_at: now,
      };
    });

    // Always persist to local fallback file so settings are never lost
    const mappedFallback: ZoneShippingSetting[] = zones.map((z: Record<string, unknown>, index: number) => ({
      id: String(z.id || `zone_${index + 1}`),
      zoneName: String(z.zoneName || z.zone_name || `Zone ${index + 1}`),
      zoneNameHi: String(z.zoneNameHi || z.zone_name_hi || ''),
      isActive: Boolean(z.isActive ?? z.is_active),
      isFreeDeliveryEnabled: z.isFreeDeliveryEnabled !== undefined ? Boolean(z.isFreeDeliveryEnabled) : true,
      freeDeliveryThreshold: Math.max(0, Number(z.freeDeliveryThreshold ?? z.free_delivery_threshold) || 0),
      standardDeliveryFee: Math.max(0, Number(z.standardDeliveryFee ?? z.standard_delivery_fee) || 0),
      allowCod: z.allowCod !== undefined ? Boolean(z.allowCod) : true,
      isOnlineDiscountEnabled: z.isOnlineDiscountEnabled !== undefined ? Boolean(z.isOnlineDiscountEnabled) : true,
      onlinePaymentDiscount: Math.max(0, Math.min(100, Number(z.onlinePaymentDiscount ?? z.online_payment_discount) || 0)),
      customPincodes: Array.isArray(z.customPincodes)
        ? (z.customPincodes as string[])
        : (Array.isArray(z.custom_pincodes) ? (z.custom_pincodes as string[]) : []),
      sortOrder: Number(z.sortOrder ?? z.sort_order ?? index + 1),
      updatedAt: now,
    }));

    try {
      const dataDir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(
        path.join(dataDir, 'zone_shipping_settings.json'),
        JSON.stringify(mappedFallback, null, 2),
        'utf8'
      );
    } catch (fsErr) {
      console.warn('Failed to write local zone settings backup:', fsErr);
    }

    // Also sync storewide shipping_settings table if present
    try {
      const anyActive = upsertRows.some((r) => r.is_active);
      await supabase
        .from('shipping_settings')
        .update({ free_shipping_enabled: anyActive })
        .eq('id', 1);
    } catch {}

    // Two-way sync: Also sync is_active to delivery_zones so /admin/delivery-partners stays 100% matched
    try {
      for (const row of upsertRows) {
        let dzKey = '';
        if (row.id === 'zone_nagar_nigam') {
          dzKey = 'zone_allahabad_city';
        } else if (row.id === 'zone_dehat') {
          dzKey = 'zone_allahabad_dehat';
        } else if (row.id === 'zone_pan_india') {
          dzKey = 'zone_pan_india';
        }

        if (dzKey) {
          // Update Supabase delivery_zones by zone_key
          await supabase
            .from('delivery_zones')
            .update({ is_active: Boolean(row.is_active), updated_at: now })
            .eq('zone_key', dzKey);

          // Update memory fallback
          updateMemoryZoneActive(dzKey, Boolean(row.is_active));
        }
      }
    } catch (syncErr) {
      console.warn('Sync to delivery_zones failed:', syncErr);
    }

    // If column doesn't exist yet in Supabase, retry without online_payment_discount for DB while keeping in local file
    let upsertRes = await supabase
      .from('zone_shipping_settings')
      .upsert(upsertRows, { onConflict: 'id' })
      .select('*')
      .order('sort_order', { ascending: true });

    if (
      upsertRes.error &&
      (upsertRes.error.message.includes('online_payment_discount') ||
        upsertRes.error.message.includes('is_free_delivery_enabled') ||
        upsertRes.error.message.includes('allow_cod') ||
        upsertRes.error.message.includes('is_online_discount_enabled'))
    ) {
      const fallbackRows = upsertRows.map(
        ({
          online_payment_discount: _opd,
          is_free_delivery_enabled: _ifde,
          allow_cod: _ac,
          is_online_discount_enabled: _iode,
          ...rest
        }) => rest
      );
      upsertRes = await supabase
        .from('zone_shipping_settings')
        .upsert(fallbackRows, { onConflict: 'id' })
        .select('*')
        .order('sort_order', { ascending: true });
    }

    const { data, error } = upsertRes;

    if (error) {
      console.warn('Supabase zone settings upsert error (using local fallback):', error.message);
      return NextResponse.json(mappedFallback, { headers: NO_STORE_HEADERS });
    }

    const mapped: ZoneShippingSetting[] = (data || []).map((row: Record<string, unknown>, idx: number) => ({
      id: String(row.id),
      zoneName: String(row.zone_name),
      zoneNameHi: String(row.zone_name_hi),
      isActive: Boolean(row.is_active),
      freeDeliveryThreshold: Number(row.free_delivery_threshold),
      standardDeliveryFee: Number(row.standard_delivery_fee),
      onlinePaymentDiscount: row.online_payment_discount !== undefined 
        ? Number(row.online_payment_discount) 
        : (mappedFallback[idx]?.onlinePaymentDiscount ?? 0),
      customPincodes: Array.isArray(row.custom_pincodes) ? (row.custom_pincodes as string[]) : [],
      sortOrder: Number(row.sort_order),
      updatedAt: row.updated_at ? String(row.updated_at) : null,
    }));

    // Merge from local fallback file: supplement onlinePaymentDiscount and isActive if DB is out of sync
    try {
      const filePath = path.join(process.cwd(), 'data', 'zone_shipping_settings.json');
      if (fs.existsSync(filePath)) {
        const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (Array.isArray(fileData)) {
          for (const item of fileData) {
            const m = mapped.find((x) => x.id === item.id);
            if (m) {
              if (item.isActive !== undefined) m.isActive = Boolean(item.isActive);
              if (item.isFreeDeliveryEnabled !== undefined) m.isFreeDeliveryEnabled = Boolean(item.isFreeDeliveryEnabled);
              if (item.allowCod !== undefined) m.allowCod = Boolean(item.allowCod);
              if (item.isOnlineDiscountEnabled !== undefined) m.isOnlineDiscountEnabled = Boolean(item.isOnlineDiscountEnabled);
              if (item.onlinePaymentDiscount !== undefined && !m.onlinePaymentDiscount) {
                m.onlinePaymentDiscount = Number(item.onlinePaymentDiscount) || 0;
              }
            }
          }
        }
      }
    } catch {}

    return NextResponse.json(mapped, { headers: NO_STORE_HEADERS });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unable to update zone shipping settings.';
    return NextResponse.json({ error: message }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
