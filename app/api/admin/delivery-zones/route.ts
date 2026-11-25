import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { isAdminRequest } from '@/lib/adminSession';
import { DeliveryZone, getSharedMemoryZones, updateMemoryZoneActive } from '@/lib/deliveryPartners';

let memoryZones: DeliveryZone[] = getSharedMemoryZones();

const isUUID = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

function readShippingSettingsActiveMap(): Map<string, boolean> {
  const map = new Map<string, boolean>();
  try {
    const filePath = path.join(process.cwd(), 'data', 'zone_shipping_settings.json');
    if (fs.existsSync(filePath)) {
      const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (Array.isArray(fileData)) {
        for (const item of fileData) {
          if (item && item.id && item.isActive !== undefined) {
            map.set(String(item.id), Boolean(item.isActive));
          }
        }
      }
    }
  } catch {}
  return map;
}

function persistToLocalJson(shippingZoneId: string, isActive: boolean, updatedAt: string) {
  try {
    const filePath = path.join(process.cwd(), 'data', 'zone_shipping_settings.json');
    if (fs.existsSync(filePath)) {
      const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (Array.isArray(fileData)) {
        const target = fileData.find((f: Record<string, unknown>) => f.id === shippingZoneId);
        if (target) {
          target.isActive = Boolean(isActive);
          target.updatedAt = updatedAt;
          fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2), 'utf8');
        }
      }
    }
  } catch (err) {
    console.warn('Failed to persist to local zone_shipping_settings.json:', err);
  }
}

// ─── GET /api/admin/delivery-zones ──────────────────────────────────────────
export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const supabase = getServiceSupabase();
    const localActiveMap = readShippingSettingsActiveMap();
    
    // Fetch zones with partner relations
    const { data: zonesData, error: zonesError } = await supabase
      .from('delivery_zones')
      .select(`
        *,
        default_partner:default_partner_id (id, name, code, is_active),
        fallback_partner:fallback_partner_id (id, name, code, is_active)
      `)
      .order('priority', { ascending: false });

    // Try also fetching live active status from zone_shipping_settings table
    try {
      const { data: shipRows } = await supabase
        .from('zone_shipping_settings')
        .select('id, is_active');
      if (shipRows && shipRows.length > 0) {
        for (const row of shipRows) {
          if (row.id && row.is_active !== undefined) {
            localActiveMap.set(String(row.id), Boolean(row.is_active));
          }
        }
      }
    } catch {}

    if (zonesError || !zonesData || zonesData.length === 0) {
      // Cross-sync memory fallback with shipping settings
      for (const z of memoryZones) {
        const zk = (z.zoneKey || '').toLowerCase();
        let sId = '';
        if (zk.includes('city') || zk.includes('nagar') || z.id === 'zone-city-1') sId = 'zone_nagar_nigam';
        else if (zk.includes('rural') || zk.includes('dehat') || z.id === 'zone-rural-2') sId = 'zone_dehat';
        else if (zk.includes('pan') || z.id === 'zone-pan-india-3') sId = 'zone_pan_india';

        if (sId && localActiveMap.has(sId)) {
          z.isActive = localActiveMap.get(sId)!;
        }
      }
      return NextResponse.json({ success: true, zones: memoryZones });
    }

    // Fetch mapped pincodes for these zones
    const { data: pincodesData } = await supabase
      .from('delivery_zone_pincodes')
      .select('zone_id, pincode, pincode_prefix');

    const pincodesByZone = new Map<string, { pincodes: string[]; prefixes: string[] }>();
    if (pincodesData) {
      for (const row of pincodesData) {
        if (!pincodesByZone.has(row.zone_id)) {
          pincodesByZone.set(row.zone_id, { pincodes: [], prefixes: [] });
        }
        const entry = pincodesByZone.get(row.zone_id)!;
        if (row.pincode) entry.pincodes.push(String(row.pincode));
        if (row.pincode_prefix) entry.prefixes.push(String(row.pincode_prefix));
      }
    }

    const zones: DeliveryZone[] = zonesData.map((row) => {
      const pinEntry = pincodesByZone.get(row.id) || { pincodes: [], prefixes: [] };
      const zk = String(row.zone_key || '').toLowerCase();
      const zn = String(row.name || '').toLowerCase();
      let sId = '';
      if (zk.includes('city') || zk.includes('nagar') || zn.includes('city')) sId = 'zone_nagar_nigam';
      else if (zk.includes('rural') || zk.includes('dehat') || zn.includes('rural') || zn.includes('dehat')) sId = 'zone_dehat';
      else if (zk.includes('pan') || zn.includes('pan') || zn.includes('outside')) sId = 'zone_pan_india';

      // 2-way sync: If zone_shipping_settings has an active value, honor it so both pages match 100%
      const effectiveActive = (sId && localActiveMap.has(sId))
        ? localActiveMap.get(sId)!
        : Boolean(row.is_active);

      return {
        id: String(row.id),
        zoneKey: String(row.zone_key),
        name: String(row.name),
        description: row.description ? String(row.description) : null,
        defaultPartnerId: row.default_partner_id ? String(row.default_partner_id) : null,
        defaultPartnerName: row.default_partner ? (row.default_partner as { name: string }).name : undefined,
        fallbackPartnerId: row.fallback_partner_id ? String(row.fallback_partner_id) : null,
        fallbackPartnerName: row.fallback_partner ? (row.fallback_partner as { name: string }).name : undefined,
        isActive: effectiveActive,
        priority: Number(row.priority) || 1,
        pincodes: pinEntry.pincodes,
        pincodePrefixes: pinEntry.prefixes,
        createdAt: row.created_at ? String(row.created_at) : undefined,
        updatedAt: row.updated_at ? String(row.updated_at) : undefined,
      };
    });

    return NextResponse.json({ success: true, zones });
  } catch (err) {
    console.error('Error fetching delivery zones:', err);
    return NextResponse.json({ success: true, zones: memoryZones });
  }
}

// ─── Helper to Process a Single Zone ────────────────────────────────────────
async function processZoneUpdate(
  zoneItem: Record<string, unknown>,
  supabase: ReturnType<typeof getServiceSupabase>,
  now: string
) {
  const id = zoneItem.id ? String(zoneItem.id) : '';
  const zoneKey = zoneItem.zoneKey || zoneItem.zone_key ? String(zoneItem.zoneKey || zoneItem.zone_key) : '';
  const name = zoneItem.name ? String(zoneItem.name).trim() : undefined;
  const description = zoneItem.description !== undefined ? (zoneItem.description ? String(zoneItem.description).trim() : null) : undefined;
  const defaultPartnerId = zoneItem.defaultPartnerId !== undefined ? (zoneItem.defaultPartnerId || null) : undefined;
  const fallbackPartnerId = zoneItem.fallbackPartnerId !== undefined ? (zoneItem.fallbackPartnerId || null) : undefined;
  const isActive = zoneItem.isActive !== undefined ? Boolean(zoneItem.isActive) : undefined;
  const priority = zoneItem.priority !== undefined ? (Number(zoneItem.priority) || 1) : undefined;
  const pincodes = Array.isArray(zoneItem.pincodes) ? zoneItem.pincodes : undefined;

  const updates: Record<string, unknown> = { updated_at: now };
  if (name) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (defaultPartnerId !== undefined) updates.default_partner_id = defaultPartnerId;
  if (fallbackPartnerId !== undefined) updates.fallback_partner_id = fallbackPartnerId;
  if (isActive !== undefined) updates.is_active = isActive;
  if (priority !== undefined) updates.priority = priority;

  // Determine canonical mapping
  const raw = `${id} ${zoneKey} ${name || ''}`.toLowerCase();
  let shippingZoneId: string = 'zone_nagar_nigam';
  let canonicalZoneKey: string = 'zone_allahabad_city';

  if (raw.includes('city') || raw.includes('nagar') || raw.includes('zone-city-1') || raw.includes('zone_nagar_nigam')) {
    shippingZoneId = 'zone_nagar_nigam';
    canonicalZoneKey = 'zone_allahabad_city';
  } else if (raw.includes('rural') || raw.includes('dehat') || raw.includes('zone-rural-2') || raw.includes('zone_dehat')) {
    shippingZoneId = 'zone_dehat';
    canonicalZoneKey = 'zone_allahabad_dehat';
  } else if (raw.includes('pan') || raw.includes('outside') || raw.includes('zone-pan-india-3') || raw.includes('zone_pan_india')) {
    shippingZoneId = 'zone_pan_india';
    canonicalZoneKey = 'zone_pan_india';
  }

  // 1. ALWAYS persist to local fallback JSON immediately
  if (isActive !== undefined) {
    persistToLocalJson(shippingZoneId, isActive, now);
    updateMemoryZoneActive(shippingZoneId, isActive);
  }

  // 2. Update Supabase delivery_zones & zone_shipping_settings
  try {
    if (id && isUUID(id)) {
      await supabase.from('delivery_zones').update(updates).eq('id', id);
    }
    await supabase.from('delivery_zones').update(updates).eq('zone_key', canonicalZoneKey);

    if (isActive !== undefined) {
      await supabase
        .from('zone_shipping_settings')
        .update({ is_active: isActive, updated_at: now })
        .eq('id', shippingZoneId);

      try {
        await supabase
          .from('shipping_settings')
          .update({ free_shipping_enabled: isActive })
          .eq('id', 1);
      } catch {}
    }

    if (Array.isArray(pincodes) && id) {
      await supabase.from('delivery_zone_pincodes').delete().eq('zone_id', id);
      const rowsToInsert = pincodes
        .map((p) => String(p).trim())
        .filter(Boolean)
        .map((pin) => ({
          zone_id: id,
          pincode: pin.length === 6 ? pin : null,
          pincode_prefix: pin.length < 6 ? pin : null,
        }));
      if (rowsToInsert.length > 0) {
        await supabase.from('delivery_zone_pincodes').insert(rowsToInsert);
      }
    }
  } catch (dbErr) {
    console.warn(`Supabase update error for ${canonicalZoneKey}:`, dbErr);
  }

  // 3. Update memory zones array
  const idx = memoryZones.findIndex((z) => {
    const zk = (z.zoneKey || '').toLowerCase();
    return z.id === id || z.zoneKey === canonicalZoneKey || (raw.includes('city') && zk.includes('city')) || (raw.includes('rural') && zk.includes('rural')) || (raw.includes('pan') && zk.includes('pan'));
  });

  if (idx !== -1) {
    memoryZones[idx] = {
      ...memoryZones[idx],
      ...(name ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(defaultPartnerId !== undefined ? { defaultPartnerId: defaultPartnerId ? String(defaultPartnerId) : null } : {}),
      ...(fallbackPartnerId !== undefined ? { fallbackPartnerId: fallbackPartnerId ? String(fallbackPartnerId) : null } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(priority !== undefined ? { priority } : {}),
      ...(Array.isArray(pincodes) ? { pincodes: pincodes.map(String) } : {}),
      updatedAt: now,
    };
  }
}

// ─── PUT /api/admin/delivery-zones ──────────────────────────────────────────
export async function PUT(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const zoneList: Record<string, unknown>[] = Array.isArray(body)
      ? body
      : Array.isArray(body?.zones)
      ? body.zones
      : [body];

    if (zoneList.length === 0) {
      return NextResponse.json({ success: false, error: 'No zones provided' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const now = new Date().toISOString();

    for (const item of zoneList) {
      if (item && typeof item === 'object') {
        await processZoneUpdate(item, supabase, now);
      }
    }

    return NextResponse.json({ success: true, message: 'Delivery zones updated and synchronized successfully' });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to update zones' },
      { status: 500 }
    );
  }
}
