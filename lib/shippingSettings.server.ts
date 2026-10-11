import 'server-only';

import { getServiceSupabase } from '@/lib/supabase';
import { ShippingSettings } from '@/lib/shipping';

interface ShippingSettingsRow {
  free_shipping_enabled: boolean;
  free_shipping_threshold: number | string;
  standard_shipping_charge: number | string;
  updated_at: string | null;
}

function mapShippingSettings(row: ShippingSettingsRow): ShippingSettings {
  const freeShippingThreshold = Number(row.free_shipping_threshold);
  const standardShippingCharge = Number(row.standard_shipping_charge);

  if (!Number.isFinite(freeShippingThreshold) || freeShippingThreshold < 0) {
    throw new Error('The saved free-shipping threshold is invalid.');
  }
  if (!Number.isFinite(standardShippingCharge) || standardShippingCharge < 0) {
    throw new Error('The saved fixed delivery charge is invalid.');
  }

  return {
    freeShippingEnabled: Boolean(row.free_shipping_enabled),
    freeShippingThreshold,
    standardShippingCharge,
    updatedAt: row.updated_at,
  };
}

export async function getShippingSettings(): Promise<ShippingSettings> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('shipping_settings')
    .select(
      'free_shipping_enabled, free_shipping_threshold, standard_shipping_charge, updated_at'
    )
    .eq('id', 1)
    .single();

  if (error) {
    throw new Error(`Unable to load shipping settings: ${error.message}`);
  }
  if (!data) {
    throw new Error('Shipping settings have not been configured.');
  }

  return mapShippingSettings(data as ShippingSettingsRow);
}
