'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { ShippingSettings } from '@/lib/shipping';

interface ShippingSettingsContextValue {
  settings: ShippingSettings | null;
  loading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
}

const ShippingSettingsContext = createContext<ShippingSettingsContextValue | undefined>(undefined);

export function ShippingSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ShippingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSettings = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/shipping-settings', { cache: 'no-store' });
      const result = (await response.json()) as ShippingSettings & { error?: string };
      if (!response.ok) {
        throw new Error(result.error || 'Unable to load shipping settings.');
      }
      setSettings(result);
    } catch (loadError: unknown) {
      const message =
        loadError instanceof Error ? loadError.message : 'Unable to load shipping settings.';
      setSettings(null);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSettings();
  }, [refreshSettings]);

  return (
    <ShippingSettingsContext.Provider value={{ settings, loading, error, refreshSettings }}>
      {children}
    </ShippingSettingsContext.Provider>
  );
}

export function useShippingSettings(): ShippingSettingsContextValue {
  const context = useContext(ShippingSettingsContext);
  if (!context) {
    throw new Error('useShippingSettings must be used within ShippingSettingsProvider.');
  }
  return context;
}
