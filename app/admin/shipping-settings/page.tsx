'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  IndianRupee,
  Loader2,
  Save,
  Settings2,
  Truck,
} from 'lucide-react';
import { useShippingSettings } from '@/context/ShippingSettingsContext';
import { useToast } from '@/context/ToastContext';
import { ShippingSettings } from '@/lib/shipping';

interface ShippingSettingsForm {
  freeShippingEnabled: boolean;
  freeShippingThreshold: string;
  standardShippingCharge: string;
}

export default function ShippingSettingsPage() {
  const { settings, loading, error, refreshSettings } = useShippingSettings();
  const { toast } = useToast();
  const [form, setForm] = useState<ShippingSettingsForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!settings) {
      return;
    }

    setForm({
      freeShippingEnabled: settings.freeShippingEnabled,
      freeShippingThreshold: String(settings.freeShippingThreshold),
      standardShippingCharge: String(settings.standardShippingCharge),
    });
  }, [settings]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!form) {
      return;
    }

    const freeShippingThreshold = Number(form.freeShippingThreshold);
    const standardShippingCharge = Number(form.standardShippingCharge);
    if (!Number.isFinite(freeShippingThreshold) || freeShippingThreshold < 0) {
      setSaveError('Enter a valid non-negative free-shipping threshold.');
      return;
    }
    if (!Number.isFinite(standardShippingCharge) || standardShippingCharge < 0) {
      setSaveError('Enter a valid non-negative standard shipping charge.');
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const response = await fetch('/api/shipping-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          freeShippingEnabled: form.freeShippingEnabled,
          freeShippingThreshold,
          standardShippingCharge,
        }),
      });
      const result = (await response.json()) as ShippingSettings & { error?: string };
      if (!response.ok) {
        throw new Error(result.error || 'Unable to save shipping settings.');
      }

      setForm({
        freeShippingEnabled: result.freeShippingEnabled,
        freeShippingThreshold: String(result.freeShippingThreshold),
        standardShippingCharge: String(result.standardShippingCharge),
      });
      await refreshSettings();
      toast.success('Shipping settings updated successfully.', { title: 'Settings Saved' });
    } catch (submitError: unknown) {
      const message =
        submitError instanceof Error ? submitError.message : 'Unable to save shipping settings.';
      setSaveError(message);
      toast.error(message, { title: 'Save Failed' });
    } finally {
      setSaving(false);
    }
  };

  if (loading && !form) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-semibold text-gray-500">
          <Loader2 className="animate-spin text-[#083028]" size={20} />
          Loading shipping settings...
        </div>
      </div>
    );
  }

  if ((error || !form) && !loading) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 shrink-0 text-red-600" size={22} />
          <div>
            <h1 className="font-bold text-red-900">Shipping settings are unavailable</h1>
            <p className="mt-1 text-sm text-red-700">{error || 'No shipping settings were found.'}</p>
            <button
              type="button"
              onClick={() => void refreshSettings()}
              className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-800"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!form) {
    return null;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#B8860B]">
            <Settings2 size={15} /> Store Configuration
          </div>
          <h1 className="text-2xl font-black text-gray-900 sm:text-3xl">Shipping Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Control the fixed delivery charge and automatic free-delivery eligibility across the store.
          </p>
        </div>
        {settings?.updatedAt && (
          <p className="text-xs text-gray-400">
            Last updated {new Date(settings.updatedAt).toLocaleString('en-IN')}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-[#083028] px-5 py-5 text-white sm:px-7">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
              <Truck size={23} />
            </span>
            <div>
              <h2 className="font-bold">Storewide shipping rules</h2>
              <p className="mt-0.5 text-xs text-white/65">
                These values are used by product pages, cart, checkout, and payment verification.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6 p-5 sm:p-7">
          <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600" />
                <h3 className="font-bold text-gray-900">Automatic free shipping</h3>
              </div>
              <p className="mt-1 pl-6 text-xs leading-relaxed text-gray-500">
                When enabled, qualifying orders automatically receive free shipping without a coupon.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3 self-end sm:self-auto">
              <span
                className={`text-xs font-bold ${
                  form.freeShippingEnabled ? 'text-emerald-700' : 'text-gray-500'
                }`}
              >
                {form.freeShippingEnabled ? 'Enabled' : 'Disabled'}
              </span>
              <button
                type="button"
                role="switch"
                aria-label="Automatic free shipping"
                aria-checked={form.freeShippingEnabled}
                onClick={() =>
                  setForm((current) =>
                    current
                      ? { ...current, freeShippingEnabled: !current.freeShippingEnabled }
                      : current
                  )
                }
                className={`relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#083028] focus-visible:ring-offset-2 ${
                  form.freeShippingEnabled ? 'bg-emerald-600' : 'bg-gray-300'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                    form.freeShippingEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-700">
                <IndianRupee size={15} className="text-[#083028]" /> Free-shipping threshold
              </span>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 font-bold text-gray-400">₹</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  disabled={!form.freeShippingEnabled}
                  value={form.freeShippingThreshold}
                  onChange={(event) =>
                    setForm({ ...form, freeShippingThreshold: event.target.value })
                  }
                  className="w-full rounded-xl border border-gray-300 py-3 pl-9 pr-4 font-semibold text-gray-900 outline-none transition focus:border-[#083028] focus:ring-2 focus:ring-[#083028]/10 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                />
              </div>
              <span className="mt-2 block text-xs text-gray-500">
                Orders at or above this subtotal qualify automatically.
              </span>
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-700">
                <Truck size={15} className="text-[#083028]" /> Fixed delivery charge
              </span>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 font-bold text-gray-400">₹</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={form.standardShippingCharge}
                  onChange={(event) =>
                    setForm({ ...form, standardShippingCharge: event.target.value })
                  }
                  className="w-full rounded-xl border border-gray-300 py-3 pl-9 pr-4 font-semibold text-gray-900 outline-none transition focus:border-[#083028] focus:ring-2 focus:ring-[#083028]/10"
                />
              </div>
              <span className="mt-2 block text-xs text-gray-500">
                Applied once to orders below the configured free-delivery threshold.
              </span>
            </label>
          </div>

          <div className="rounded-xl border border-[#B8860B]/25 bg-[#B8860B]/5 px-4 py-3 text-sm text-gray-700">
            {form.freeShippingEnabled ? (
              <p>
                Customers pay <strong>₹{Number(form.standardShippingCharge || 0).toLocaleString('en-IN')}</strong>{' '}
                below <strong>₹{Number(form.freeShippingThreshold || 0).toLocaleString('en-IN')}</strong>, then shipping becomes free.
              </p>
            ) : (
              <p>
                Automatic free shipping is disabled. Customers pay{' '}
                <strong>₹{Number(form.standardShippingCharge || 0).toLocaleString('en-IN')}</strong>, unless a valid free-shipping coupon is applied.
              </p>
            )}
          </div>

          {saveError && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              {saveError}
            </div>
          )}

          <div className="flex justify-end border-t border-gray-100 pt-5">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-w-40 items-center justify-center gap-2 rounded-xl bg-[#083028] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#051f1a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />}
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
