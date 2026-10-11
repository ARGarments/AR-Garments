import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/adminSession';
import { getShippingSettings } from '@/lib/shippingSettings.server';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0, s-maxage=0',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
};

function parseNonNegativeAmount(value: unknown, fieldName: string): number {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new TypeError(`${fieldName} must be a non-negative amount.`);
  }
  return Math.round(amount * 100) / 100;
}

export async function GET(): Promise<NextResponse> {
  try {
    const settings = await getShippingSettings();
    return NextResponse.json(settings, { headers: NO_STORE_HEADERS });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unable to load shipping settings.';
    return NextResponse.json({ error: message }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Admin authentication is required.' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.freeShippingEnabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Free-shipping status must be enabled or disabled.' },
        { status: 400 }
      );
    }

    const freeShippingThreshold = parseNonNegativeAmount(
      body.freeShippingThreshold,
      'Free-shipping threshold'
    );
    const standardShippingCharge = parseNonNegativeAmount(
      body.standardShippingCharge,
      'Fixed delivery charge'
    );
    const updatedAt = new Date().toISOString();
    const supabase = getServiceSupabase();
    const { error } = await supabase.from('shipping_settings').upsert(
      {
        id: 1,
        free_shipping_enabled: body.freeShippingEnabled,
        free_shipping_threshold: freeShippingThreshold,
        standard_shipping_charge: standardShippingCharge,
        updated_at: updatedAt,
      },
      { onConflict: 'id' }
    );

    if (error) {
      throw new Error(`Unable to save shipping settings: ${error.message}`);
    }

    const settings = await getShippingSettings();
    return NextResponse.json(settings, { headers: NO_STORE_HEADERS });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unable to save shipping settings.';
    const status = error instanceof TypeError ? 400 : 500;
    return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS });
  }
}
