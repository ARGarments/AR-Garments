export interface ShippingSettings {
  freeShippingEnabled: boolean;
  freeShippingThreshold: number;
  standardShippingCharge: number;
  updatedAt: string | null;
}

export function calculateShippingCharge(
  subtotal: number,
  settings: ShippingSettings,
  hasFreeShippingCoupon: boolean
): number {
  if (subtotal <= 0 || hasFreeShippingCoupon) {
    return 0;
  }

  if (settings.freeShippingEnabled && subtotal >= settings.freeShippingThreshold) {
    return 0;
  }

  return settings.standardShippingCharge;
}
