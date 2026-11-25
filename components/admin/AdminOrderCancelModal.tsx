'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle, RefreshCw, X, ShieldAlert, MessageSquare } from 'lucide-react';
import type { Order } from '@/lib/orders';

export type AdminCancellationReason =
  | 'Customer Requested'
  | 'Out of Stock'
  | 'Payment Not Received'
  | 'Delivery Not Possible'
  | 'Other';

interface AdminOrderCancelModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (orderId: string, details: { reason: string; stockRestored: boolean }) => void;
}

const REASONS: { value: AdminCancellationReason; labelEn: string; labelHi: string; restock: boolean; desc: string }[] = [
  {
    value: 'Customer Requested',
    labelEn: 'Customer Requested',
    labelHi: 'ग्राहक ने कहा',
    restock: true,
    desc: 'Customer wants to cancel the order. Quantity will be returned to inventory.',
  },
  {
    value: 'Out of Stock',
    labelEn: 'Out of Stock',
    labelHi: 'स्टॉक नहीं है',
    restock: false,
    desc: 'Item is unavailable. No stock will be added back to inventory.',
  },
  {
    value: 'Payment Not Received',
    labelEn: 'Payment Not Received',
    labelHi: 'पैसा नहीं मिला',
    restock: true,
    desc: 'Payment was not verified. Quantity will be returned to inventory.',
  },
  {
    value: 'Delivery Not Possible',
    labelEn: 'Delivery Not Possible',
    labelHi: 'डिलीवरी संभव नहीं',
    restock: true,
    desc: 'Location or delivery issue. Quantity will be returned to inventory.',
  },
  {
    value: 'Other',
    labelEn: 'Other',
    labelHi: 'अन्य कोई कारण',
    restock: true,
    desc: 'General cancellation. Quantity will be returned to inventory.',
  },
];

export default function AdminOrderCancelModal({
  order,
  isOpen,
  onClose,
  onSuccess,
}: AdminOrderCancelModalProps) {
  const [selectedReason, setSelectedReason] = useState<AdminCancellationReason>('Customer Requested');
  const [customNote, setCustomNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !order || !mounted) return null;

  const currentReasonObj = REASONS.find((r) => r.value === selectedReason) || REASONS[0];
  const willRestock = currentReasonObj.restock;

  const handleConfirmCancel = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/orders/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          reason: selectedReason,
          note: customNote.trim() || undefined,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to cancel the order.');
      }

      onSuccess(order.id, {
        reason: data.cancellationReason || selectedReason,
        stockRestored: data.stockRestored,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error occurred while processing cancellation.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-red-50 to-white px-5 py-4">
          <div className="flex items-center gap-2.5 text-red-600">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">
                Cancel Order / ऑर्डर कैंसिल करें
              </h3>
              <p className="text-[11px] font-mono font-bold text-gray-500">{order.id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-gray-600 leading-relaxed">
            Are you sure you want to cancel this order? It will update the order status, manage stock according to the reason, and notify the customer via SMS/WhatsApp.
            <br />
            <span className="text-gray-400 font-medium text-[11px]">
              (क्या आप वाकई इस ऑर्डर को कैंसिल करना चाहते हैं? इससे स्टॉक नियम अनुसार अपडेट होगा और ग्राहक को सूचना मिल जाएगी।)
            </span>
          </p>

          {/* Reason Select */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-1.5">
              Select Reason / कारण चुनें <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value as AdminCancellationReason)}
              disabled={loading}
              className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs font-bold text-gray-800 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
            >
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  • {r.labelEn} ({r.labelHi})
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic Stock Management Indicator Badge */}
          <div
            className={`rounded-xl p-3 border text-xs transition ${
              willRestock
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : 'bg-amber-50/80 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-2 font-black">
              {willRestock ? (
                <>
                  <CheckCircle size={15} className="text-emerald-600 shrink-0" />
                  <span>Automatic Restock / स्टॉक वापस जुड़ेगा 📦</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                  <span>Do Not Restock / स्टॉक वापस नहीं जुड़ेगा ⚠️</span>
                </>
              )}
            </div>
            <p className="mt-1 text-[11px] opacity-90 leading-normal pl-6">
              {currentReasonObj.desc}
            </p>
          </div>

          {/* Note Input */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Add Note / अन्य टिप्पणी <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <textarea
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              disabled={loading}
              rows={2}
              placeholder="e.g. Customer cancelled on phone call / Address unserviceable"
              className="w-full rounded-xl border border-gray-200 bg-gray-50/60 p-2.5 text-xs text-gray-800 outline-none placeholder:text-gray-400 focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100 transition resize-none"
            />
          </div>

          {/* Customer Notification Details */}
          <div className="flex items-center gap-2 rounded-xl bg-blue-50/70 border border-blue-200/80 p-2.5 text-[11px] text-blue-900">
            <MessageSquare size={16} className="text-blue-600 shrink-0" />
            <div>
              <p className="font-bold">Customer Notification / ग्राहक को सूचना</p>
              <p className="text-[10px] text-blue-700">
                Auto-sends cancellation reason &amp; order ID to {order.shippingAddress?.phone || 'registered phone'}.
              </p>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-semibold text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 border-t border-gray-100 bg-gray-50/80 px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 transition disabled:opacity-50"
          >
            Keep Order (वापस जाएँ)
          </button>
          <button
            type="button"
            onClick={handleConfirmCancel}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-xs font-black shadow-md hover:shadow-lg transition active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>Confirm Cancel (कैंसिल पक्का करें)</span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
