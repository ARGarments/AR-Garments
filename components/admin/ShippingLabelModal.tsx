'use client';

import React, { useState } from 'react';
import { Order } from '@/lib/orders';
import { ShippingLabelRecord } from '@/lib/shippingLabels';
import {
  Printer,
  X,
  Truck,
  CheckCircle2,
  Package,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  QrCode,
  MapPin,
  Phone,
  User,
  Clock,
} from 'lucide-react';

interface ShippingLabelModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShippingLabelModal({ order, isOpen, onClose }: ShippingLabelModalProps) {
  const [selectedType, setSelectedType] = useState<'local' | 'third_party' | null>(null);
  const [handOffOption, setHandOffOption] = useState<'hand_to_hand' | 'remote'>('hand_to_hand');
  const [courierPartner, setCourierPartner] = useState<'shiprocket' | 'delhivery'>('shiprocket');
  const [weightKg, setWeightKg] = useState<number>(0.8);
  const [activeLabel, setActiveLabel] = useState<ShippingLabelRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Generate label via API
  const handleGenerateLabel = async (type: 'local' | 'third_party') => {
    setSelectedType(type);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/orders/${order.id}/shipping-label`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          labelType: type,
          handOffOption,
          courierCode: courierPartner,
          weightKg,
          order,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate shipping label.');
      }

      setActiveLabel(data.label);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generating label');
    } finally {
      setLoading(false);
    }
  };

  // Browser print specifically targeting the thermal slip container
  const handlePrint = () => {
    window.print();
  };

  const isCod = order.paymentMethod === 'cod';
  const totalPcs = order.items.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#083028] text-white rounded-t-3xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-[#C9972B]">
              <Printer size={18} />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">Order Shipping Label Generator</h2>
              <p className="text-xs text-white/70">Order #{order.id} • Customer: {order.shippingAddress.fullName || order.userName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* STEP 1: CHOICE SELECTION (as illustrated in diagram) */}
          {!activeLabel && (
            <div>
              <div className="text-center max-w-md mx-auto mb-6">
                <span className="text-xs font-black uppercase tracking-wider text-[#C9972B]">Step 1: Choose Dispatch Mode</span>
                <h3 className="text-xl font-black text-gray-900 mt-1">Select Label Type</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Choose between in-house local rider slip or external courier automated AWB.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. Local Delivery Label */}
                <div
                  onClick={() => handleGenerateLabel('local')}
                  className="group relative cursor-pointer p-6 rounded-2xl border-2 border-emerald-500/30 hover:border-emerald-600 bg-emerald-50/40 hover:bg-emerald-50/70 transition-all shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-600 text-white">
                        ‘लोकल डिलीवरी पार्टनर’
                      </span>
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                        <Truck size={20} />
                      </div>
                    </div>
                    <h4 className="text-lg font-black text-emerald-950">Local Delivery Label</h4>
                    <p className="text-xs text-emerald-800/80 leading-relaxed">
                      Customized invoice ticket with local business logo, hand-to-hand delivery options, prominent COD collection tag, and quick item breakdown.
                    </p>

                    <div className="pt-2">
                      <label className="block text-[11px] font-bold text-emerald-900 mb-1">Hand-off option:</label>
                      <div className="grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>
                        <label className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold border cursor-pointer ${handOffOption === 'hand_to_hand' ? 'bg-white border-emerald-600 text-emerald-900 shadow-xs' : 'border-emerald-200 text-gray-600'}`}>
                          <input
                            type="radio"
                            name="handoff"
                            checked={handOffOption === 'hand_to_hand'}
                            onChange={() => setHandOffOption('hand_to_hand')}
                          />
                          Hand-To-Hand
                        </label>
                        <label className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold border cursor-pointer ${handOffOption === 'remote' ? 'bg-white border-emerald-600 text-emerald-900 shadow-xs' : 'border-emerald-200 text-gray-600'}`}>
                          <input
                            type="radio"
                            name="handoff"
                            checked={handOffOption === 'remote'}
                            onChange={() => setHandOffOption('remote')}
                          />
                          Remote / Drop
                        </label>
                      </div>
                    </div>
                  </div>

                  <button
                    disabled={loading}
                    className="mt-6 w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                  >
                    <span>Print Local Label</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

                {/* 2. 3rd-Party Delivery Partner Label */}
                <div
                  onClick={() => handleGenerateLabel('third_party')}
                  className="group relative cursor-pointer p-6 rounded-2xl border-2 border-blue-500/30 hover:border-blue-600 bg-blue-50/40 hover:bg-blue-50/70 transition-all shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-blue-600 text-white">
                        थर्ड पार्टी पार्टनर API
                      </span>
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                        <Package size={20} />
                      </div>
                    </div>
                    <h4 className="text-lg font-black text-blue-950">3rd-Party Delivery Partner (API)</h4>
                    <p className="text-xs text-blue-800/80 leading-relaxed">
                      Automated carrier slip formatted for <strong>Delhivery / Shiprocket</strong>. Generates authentic barcode, tracking hub route, dimensional weights, and destination pincode.
                    </p>

                    <div className="pt-2 grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>
                      <div>
                        <label className="block text-[11px] font-bold text-blue-900 mb-1">Carrier API:</label>
                        <select
                          value={courierPartner}
                          onChange={(e) => setCourierPartner(e.target.value as 'shiprocket' | 'delhivery')}
                          className="w-full text-xs font-bold border border-blue-200 rounded-xl p-2 bg-white text-gray-800"
                        >
                          <option value="shiprocket">Shiprocket API</option>
                          <option value="delhivery">Delhivery Direct</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-blue-900 mb-1">Weight (kg):</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={weightKg}
                          onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0.8)}
                          className="w-full text-xs font-bold border border-blue-200 rounded-xl p-2 bg-white text-gray-800"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    disabled={loading}
                    className="mt-6 w-full py-2.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                  >
                    <span>Generate Carrier Label</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <RefreshCw size={28} className="animate-spin text-[#083028]" />
              <p className="text-xs font-bold text-gray-600">Generating thermal-optimized barcode slip...</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-bold">
              {error}
            </div>
          )}

          {/* STEP 2: LABEL PREVIEW & THERMAL PRINT CONTAINER */}
          {activeLabel && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div>
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 size={14} /> Ready for Desktop Thermal Printer
                  </span>
                  <h3 className="text-base font-black text-gray-900">
                    {activeLabel.labelType === 'local' ? 'Local Hand-to-Hand Ticket' : `${activeLabel.courierName} AWB Slip`}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveLabel(null)}
                    className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold transition"
                  >
                    Back to Choices
                  </button>
                  <button
                    onClick={handlePrint}
                    className="px-5 py-2 bg-[#083028] hover:bg-[#051e19] text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 transition"
                  >
                    <Printer size={15} />
                    <span>Print Thermal Slip (4x6 / 3x2)</span>
                  </button>
                </div>
              </div>

              {/* Thermal Label Display Box */}
              <div className="flex justify-center p-4 bg-gray-100/80 rounded-2xl overflow-x-auto">
                <div
                  id="printable-shipping-label"
                  className="w-full max-w-[380px] bg-white text-black p-4 sm:p-5 rounded-xl border border-gray-400 shadow-lg font-sans text-xs space-y-2.5 print:border-none print:shadow-none print:p-0 print:w-full"
                >
                  {/* ====== LOCAL LABEL TEMPLATE ====== */}
                  {activeLabel.labelType === 'local' && (
                    <div className="space-y-2.5">
                      {/* Header with Logo */}
                      <div className="flex items-center justify-between border-b-2 border-black pb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-black text-xs">
                            AR
                          </div>
                          <div>
                            <h4 className="font-black text-xs sm:text-sm tracking-tight leading-none uppercase">AR Garments</h4>
                            <p className="text-[9px] text-gray-600 font-bold">Local Store Dispatch</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-black text-[10px] block">Order #{order.id.slice(-8)}</span>
                          <span className="text-[9px] text-gray-500 font-bold">{new Date().toLocaleDateString('en-IN')}</span>
                        </div>
                      </div>

                      {/* Customer Info Card */}
                      <div className="border border-black p-2 rounded-lg space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black uppercase tracking-wider text-gray-500">Deliver To:</span>
                          <span className="font-black text-[10px] bg-black text-white px-1.5 py-0.5 rounded">
                            PIN: {order.shippingAddress.pincode}
                          </span>
                        </div>
                        <p className="font-black text-xs sm:text-sm">{order.shippingAddress.fullName || order.userName}</p>
                        <p className="text-[10px] leading-tight font-medium text-gray-800 break-words">
                          {order.shippingAddress.addressLine1} {order.shippingAddress.addressLine2 || ''}
                        </p>
                        <p className="text-[10px] font-bold text-gray-900">
                          {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                        </p>
                        <p className="text-[10px] font-mono font-bold pt-0.5 flex items-center gap-1">
                          <span>Phone:</span> {order.shippingAddress.phone || 'N/A'}
                        </p>
                      </div>

                      {/* Prominent COD or PREPAID Banner */}
                      <div className={`p-2 rounded-lg border-2 text-center ${isCod ? 'border-black bg-gray-50' : 'border-gray-800 bg-gray-50'}`}>
                        {isCod ? (
                          <div>
                            <span className="text-[9px] font-black uppercase text-gray-600 tracking-wider">Cash on Delivery</span>
                            <div className="text-base sm:text-lg font-black text-black">
                              Collect COD: ₹{order.total.toLocaleString('en-IN')}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="text-[9px] font-black uppercase text-gray-600 tracking-wider">Payment Status</span>
                            <div className="text-sm sm:text-base font-black text-black">
                              PREPAID (Do Not Collect Cash)
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Hand-off Option & Dispatch Type */}
                      <div className="flex items-center justify-between text-[9px] border-b border-gray-300 pb-1.5 font-bold">
                        <div>
                          <span className="text-gray-500">Hand-off:</span>{' '}
                          <span className="uppercase text-black">
                            {activeLabel.handOffOption === 'hand_to_hand' ? 'Local Delivery - Hand-To-Hand' : 'Remote Drop'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Total Items:</span> {totalPcs} pcs
                        </div>
                      </div>

                      {/* Items breakdown */}
                      <div className="text-[9px] space-y-0.5">
                        <span className="font-bold text-gray-500 block">Package Contents:</span>
                        {order.items.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="flex justify-between border-b border-dashed border-gray-200 pb-0.5">
                            <span className="truncate max-w-[220px] font-medium">• {item.name}</span>
                            <span className="font-bold">x{item.quantity}</span>
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <p className="text-[8px] italic text-gray-500">+ {order.items.length - 3} more items</p>
                        )}
                      </div>

                      {/* Barcode section with responsive containment */}
                      <div className="pt-1 text-center overflow-hidden flex justify-center">
                        {Boolean(activeLabel.labelData.barcodeSvg) && (
                          <div
                            className="w-full max-w-[300px] flex justify-center [&>svg]:max-w-full [&>svg]:h-auto"
                            dangerouslySetInnerHTML={{ __html: String(activeLabel.labelData.barcodeSvg) }}
                          />
                        )}
                      </div>

                      <div className="text-[8px] text-center text-gray-500 pt-1 border-t border-gray-200">
                        Designed for AR Garments In-House Courier • Thermal Slip Output
                      </div>
                    </div>
                  )}

                  {/* ====== THIRD-PARTY CARRIER LABEL TEMPLATE ====== */}
                  {activeLabel.labelType === 'third_party' && (
                    <div className="space-y-2.5">
                      {/* Carrier Header */}
                      <div className="flex items-center justify-between border-b-2 border-black pb-2">
                        <div>
                          <h4 className="font-black text-xs sm:text-sm tracking-tight uppercase">{activeLabel.courierName}</h4>
                          <span className="text-[9px] font-bold text-gray-600">Standard Surface Express</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-black bg-black text-white px-1.5 py-0.5 rounded">
                            {String(activeLabel.labelData.routingHub || 'HUB-DEL')}
                          </span>
                        </div>
                      </div>

                      {/* Dimensional Metadata */}
                      <div className="grid grid-cols-2 gap-2 text-[9px] border border-black p-1.5 rounded-lg font-mono">
                        <div>
                          <span className="text-gray-500 block text-[8px]">DIMENSIONS & WT:</span>
                          <span className="font-bold">{String(activeLabel.labelData.dimensionalMetadata)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-gray-500 block text-[8px]">SCHEDULE:</span>
                          <span className="font-bold">{String(activeLabel.labelData.scheduleCode)}</span>
                        </div>
                      </div>

                      {/* Tracking Barcode */}
                      <div className="py-1 text-center border-y border-dashed border-gray-300 overflow-hidden flex flex-col items-center">
                        <span className="text-[8px] font-bold text-gray-500 uppercase block mb-0.5">Tracking Barcode / AWB</span>
                        {Boolean(activeLabel.labelData.barcodeSvg) && (
                          <div
                            className="w-full max-w-[300px] flex justify-center [&>svg]:max-w-full [&>svg]:h-auto"
                            dangerouslySetInnerHTML={{ __html: String(activeLabel.labelData.barcodeSvg) }}
                          />
                        )}
                        <span className="text-[11px] font-mono font-black tracking-widest mt-0.5 block">
                          AWB: {activeLabel.awbNumber}
                        </span>
                      </div>

                      {/* Ship To Address */}
                      <div className="border border-black p-2 rounded-lg space-y-0.5">
                        <span className="text-[8px] font-black uppercase text-gray-500 block">SHIP TO:</span>
                        <p className="font-black text-xs sm:text-sm">{order.shippingAddress.fullName || order.userName}</p>
                        <p className="text-[10px] leading-tight font-medium text-gray-800 break-words">
                          {order.shippingAddress.addressLine1} {order.shippingAddress.addressLine2 || ''}
                        </p>
                        <p className="text-[10px] font-bold text-gray-900">
                          {order.shippingAddress.city}, {order.shippingAddress.state} -{' '}
                          <strong className="text-xs underline">{order.shippingAddress.pincode}</strong>
                        </p>
                        <p className="text-[10px] font-mono font-bold">Tel: {order.shippingAddress.phone || 'N/A'}</p>
                      </div>

                      {/* COD Banner */}
                      <div className={`p-2 rounded-lg border-2 text-center ${isCod ? 'border-black bg-gray-50' : 'border-gray-800 bg-gray-50'}`}>
                        {isCod ? (
                          <div className="text-sm sm:text-base font-black text-black">
                            COLLECT COD: ₹{order.total.toLocaleString('en-IN')}
                          </div>
                        ) : (
                          <div className="text-xs sm:text-sm font-black text-black uppercase">
                            PREPAID SHIPMENT
                          </div>
                        )}
                      </div>

                      {/* Return Address */}
                      <div className="text-[8px] text-gray-600 border-t border-gray-300 pt-1">
                        <strong>Return Address:</strong> AR Garments, Chowk Market, Prayagraj, UP 211003. Tel: +91 96999 42332
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Media print styling rules to isolate thermal label onto exactly 1 single page */}
      <style jsx global>{`
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: hidden !important;
            background: #ffffff !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-shipping-label,
          #printable-shipping-label * {
            visibility: visible !important;
          }
          #printable-shipping-label {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 95mm !important;
            margin: 0 auto !important;
            padding: 3mm !important;
            box-shadow: none !important;
            border: 1.5px solid #000000 !important;
            border-radius: 4px !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          @page {
            size: 100mm 150mm;
            margin: 0mm !important;
          }
        }
      `}</style>
    </div>
  );
}
