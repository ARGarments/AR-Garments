'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import {
  Printer,
  X,
  FileText,
  Download,
  Building2,
  Mail,
  Phone,
  MapPin,
  Package,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import type { Order } from '@/lib/orders';
import { calculateInvoice, printInvoiceDocument } from '@/lib/invoiceUtils';

interface OrderInvoiceModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function OrderInvoiceModal({
  order,
  isOpen,
  onClose,
}: OrderInvoiceModalProps) {
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

  const invoiceData = calculateInvoice(order);
  const invoiceNo = `INV-${order.id.replace('#', '')}`;

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).format(date);
    } catch {
      return isoString;
    }
  };

  const handlePrint = () => {
    printInvoiceDocument(order);
  };

  const address = order.shippingAddress || {
    fullName: order.userName || 'Valued Customer',
    phone: '',
    addressLine1: '',
    city: '',
    state: 'Uttar Pradesh',
    pincode: '',
  };

  const buyerState = address.state || 'Uttar Pradesh';
  const placeOfSupply = `${buyerState.toLowerCase().includes('uttar pradesh') || buyerState.toLowerCase().includes('up') ? '09 - Uttar Pradesh' : buyerState} ${address.pincode ? `(${address.pincode})` : ''}`;

  return createPortal(
    <div className="order-invoice-portal-root fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-xs overflow-y-auto">
      {/* Top Modal Container */}
      <div className="relative w-full max-w-4xl max-h-[94vh] bg-white rounded-3xl shadow-2xl border border-gray-200 flex flex-col my-auto overflow-hidden">
        
        {/* Modal Action Header (Excluded from Print) */}
        <div className="no-print flex items-center justify-between px-5 sm:px-6 py-3.5 bg-[#083028] text-white shrink-0 border-b border-emerald-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-[#C9972B]">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black tracking-tight flex items-center gap-2">
                Official Order Tax Invoice / बिल
                <span className="text-[10px] font-bold text-emerald-300 bg-white/10 px-2 py-0.5 rounded-full">
                  Single-Page PDF Ready
                </span>
              </h2>
              <p className="text-xs text-white/70">
                Invoice No: {invoiceNo} • Order: {order.id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#C9972B] hover:bg-[#b58522] text-[#083028] font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Printer size={15} />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
              aria-label="Close invoice"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable View Area on Screen */}
        <div className="overflow-y-auto p-3 sm:p-6 bg-gray-100 flex justify-center">
          
          {/* Printable Invoice Container (Strictly styled to fit 1 A4 Page) */}
          <div
            id="printable-invoice"
            className="w-full max-w-[210mm] bg-white text-gray-900 p-5 sm:p-7 shadow-sm border border-gray-300 rounded-xl flex flex-col text-[11px] leading-tight font-sans"
            style={{ boxSizing: 'border-box' }}
          >
            {/* ════════════════════ TOP HEADER: SELLER DETAILS ════════════════════ */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-3.5 border-b-2 border-[#083028] gap-3">
              <div className="flex items-start gap-3">
                {/* Official Brand Monogram Insignia */}
                <div className="w-12 h-12 rounded-xl bg-[#083028] text-[#C9972B] flex items-center justify-center font-serif text-2xl font-black shadow-xs shrink-0 border border-[#C9972B]/40">
                  AR
                </div>
                <div>
                  <h1 className="text-xl font-black tracking-tight text-[#083028] uppercase leading-none">
                    A R GARMENT
                  </h1>
                  <p className="text-[10px] font-black tracking-widest text-[#8A6414] uppercase mt-0.5">
                    Wholesale Garment Partner
                  </p>
                  <p className="text-[10px] text-gray-600 mt-1 max-w-sm">
                    11A/14A, K.P. Kakkad Road, Eidgah, Prayagraj, UP - 211003
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-gray-600 mt-1">
                    <span><strong>GSTIN:</strong> 09ABCDE1234F1Z5 (State: 09 - UP)</span>
                    <span><strong>PAN:</strong> ABCDE1234F</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-gray-600 mt-0.5">
                    <span><strong>Email:</strong> support@argarment.com</span>
                    <span>•</span>
                    <span><strong>Phone:</strong> +91 98765 43210</span>
                  </div>
                </div>
              </div>

              {/* Title & Invoice Badge */}
              <div className="text-right sm:self-start">
                <div className="inline-block bg-[#083028] text-white px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider text-center">
                  TAX INVOICE / बिल
                  <span className="block text-[8px] text-emerald-200 font-normal">Original for Recipient</span>
                </div>
                <div className="mt-2 space-y-0.5 text-[10px]">
                  <p><span className="text-gray-500">Invoice No:</span> <strong className="font-mono text-gray-900 text-xs">{invoiceNo}</strong></p>
                  <p><span className="text-gray-500">Order ID:</span> <strong className="font-mono text-[#083028]">{order.id}</strong></p>
                  <p><span className="text-gray-500">Date & Time:</span> <span className="font-medium text-gray-800">{formatDateTime(order.createdAt)}</span></p>
                </div>
              </div>
            </div>

            {/* ════════════════════ INVOICE METADATA & BUYER DETAILS ════════════════════ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-3 border-b border-gray-200">
              {/* Left Column: Buyer (Bill To / Ship To) */}
              <div className="bg-gray-50/70 p-2.5 rounded-lg border border-gray-200">
                <p className="text-[9px] font-black uppercase tracking-wider text-[#8A6414] mb-1">
                  Buyer Details (Bill To / Ship To)
                </p>
                <p className="text-xs font-black text-gray-900">
                  {address.fullName || order.userName || 'Valued Buyer'}
                </p>
                <p className="text-[10px] text-gray-700 mt-0.5">
                  {[address.addressLine1, address.addressLine2, address.city, address.state, address.pincode]
                    .filter(Boolean)
                    .join(', ')}
                </p>
                <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-gray-600 mt-1">
                  <span><strong>Mobile:</strong> {address.phone || '—'}</span>
                  <span>•</span>
                  <span><strong>Email:</strong> {order.userEmail || '—'}</span>
                </div>
                <p className="text-[10px] text-gray-600 mt-0.5">
                  <strong>Buyer GSTIN:</strong> <span className="font-mono text-gray-800">Unregistered / Consumer</span>
                </p>
              </div>

              {/* Right Column: Order & Payment Metadata */}
              <div className="bg-gray-50/70 p-2.5 rounded-lg border border-gray-200 space-y-1">
                <p className="text-[9px] font-black uppercase tracking-wider text-[#8A6414] mb-1">
                  Payment &amp; Supply Details
                </p>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-gray-500">Payment Mode:</span>
                  <span className="font-bold text-gray-900 uppercase">
                    {order.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : `Razorpay Online ${order.razorpayPaymentId ? `(${order.razorpayPaymentId})` : ''}`}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-gray-500">Payment Status:</span>
                  <span className={`font-black uppercase px-2 py-0.5 rounded text-[9px] ${
                    order.paymentStatus === 'paid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : order.status === 'Cancelled'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {order.paymentStatus === 'paid' ? 'PAID' : (order.status === 'Cancelled' ? 'CANCELLED' : 'PENDING (COD)')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-gray-500">Place of Supply:</span>
                  <span className="font-bold text-gray-800">{placeOfSupply}</span>
                </div>
                {order.awbNumber && (
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-gray-500">AWB Tracking:</span>
                    <span className="font-mono font-bold text-[#083028]">{order.awbNumber} ({order.courierName || 'Carrier'})</span>
                  </div>
                )}
              </div>
            </div>

            {/* ════════════════════ PRODUCT ITEMS TABLE ════════════════════ */}
            <div className="py-2.5 flex-1">
              <table className="w-full border-collapse border border-gray-300 text-left text-[10px]">
                <thead>
                  <tr className="bg-[#083028] text-white font-bold uppercase text-[9px] tracking-wider">
                    <th className="p-1.5 text-center w-7 border border-emerald-900">#</th>
                    <th className="p-1.5 text-center w-10 border border-emerald-900">Image</th>
                    <th className="p-1.5 border border-emerald-900">Item Description</th>
                    <th className="p-1.5 text-center w-14 border border-emerald-900">HSN</th>
                    <th className="p-1.5 text-center w-12 border border-emerald-900">Qty</th>
                    <th className="p-1.5 text-right w-16 border border-emerald-900">Rate (₹)</th>
                    <th className="p-1.5 text-right w-16 border border-emerald-900">Taxable (₹)</th>
                    <th className="p-1.5 text-right w-20 border border-emerald-900">
                      {invoiceData.isInterState ? 'IGST (5%)' : 'CGST+SGST'}
                    </th>
                    <th className="p-1.5 text-right w-16 border border-emerald-900">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invoiceData.items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 align-top">
                      <td className="p-1.5 text-center font-bold text-gray-600 border border-gray-200">
                        {item.sNo}
                      </td>
                      <td className="p-1.5 text-center border border-gray-200">
                        {item.image ? (
                          <div className="w-8 h-8 rounded border border-gray-200 overflow-hidden mx-auto relative bg-gray-50">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-400 mx-auto">
                            <Package size={14} />
                          </div>
                        )}
                      </td>
                      <td className="p-1.5 border border-gray-200">
                        <p className="font-black text-gray-900 text-[10.5px] leading-snug">{item.name}</p>
                        {item.category && (
                          <span className="text-[9px] text-gray-500">Category: {item.category}</span>
                        )}
                      </td>
                      <td className="p-1.5 text-center font-mono text-gray-700 border border-gray-200">
                        {item.hsnCode}
                      </td>
                      <td className="p-1.5 text-center font-bold text-gray-800 border border-gray-200">
                        {item.quantity} {item.quantity === 1 ? 'Set' : 'Sets'}
                      </td>
                      <td className="p-1.5 text-right font-mono text-gray-700 border border-gray-200">
                        ₹{item.ratePerSet.toLocaleString('en-IN')}
                      </td>
                      <td className="p-1.5 text-right font-mono text-gray-700 border border-gray-200">
                        ₹{item.taxableAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="p-1.5 text-right font-mono text-gray-600 border border-gray-200 text-[9px]">
                        {invoiceData.isInterState ? (
                          <span>₹{item.igst.toFixed(2)}</span>
                        ) : (
                          <div className="space-y-0.5">
                            <div><span className="text-gray-400">C:</span> ₹{item.cgst.toFixed(2)}</div>
                            <div><span className="text-gray-400">S:</span> ₹{item.sgst.toFixed(2)}</div>
                          </div>
                        )}
                      </td>
                      <td className="p-1.5 text-right font-mono font-black text-gray-900 border border-gray-200">
                        ₹{item.lineTotal.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ════════════════════ TOTALS & PAYMENT SUMMARY ════════════════════ */}
            <div className="pt-2 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-start gap-3">
              {/* Left Side: Amount in Words */}
              <div className="w-full sm:max-w-xs space-y-1 bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-200/80">
                <p className="text-[9px] font-black uppercase tracking-wider text-[#083028]">
                  Amount in Words (INR):
                </p>
                <p className="text-[10px] font-black italic text-gray-900 leading-snug">
                  {invoiceData.amountInWords}
                </p>
                <div className="pt-1 border-t border-emerald-200 text-[9px] text-gray-600 flex items-center gap-1">
                  <ShieldCheck size={12} className="text-emerald-700" />
                  <span>GST rate calculated at wholesale garment standard 5%</span>
                </div>
              </div>

              {/* Right Side: Exact Financial Calculation Breakdown */}
              <div className="w-full sm:w-64 space-y-1 text-[10px]">
                <div className="flex justify-between text-gray-600">
                  <span>Items Subtotal:</span>
                  <span className="font-mono font-bold text-gray-900">₹{invoiceData.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Total Taxable Value:</span>
                  <span className="font-mono">₹{invoiceData.totalTaxable.toFixed(2)}</span>
                </div>
                {invoiceData.isInterState ? (
                  <div className="flex justify-between text-gray-500">
                    <span>IGST (5%):</span>
                    <span className="font-mono">₹{invoiceData.totalIgst.toFixed(2)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-gray-500">
                      <span>CGST (2.5%):</span>
                      <span className="font-mono">₹{invoiceData.totalCgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>SGST (2.5%):</span>
                      <span className="font-mono">₹{invoiceData.totalSgst.toFixed(2)}</span>
                    </div>
                  </>
                )}
                {invoiceData.discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Discount Savings:</span>
                    <span className="font-mono">-₹{invoiceData.discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Delivery / Shipping:</span>
                  <span className="font-mono font-bold text-emerald-800">
                    {invoiceData.shipping > 0 ? `₹${invoiceData.shipping}` : 'FREE'}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-black pt-1.5 border-t-2 border-[#083028] text-[#083028]">
                  <span>Grand Total:</span>
                  <span className="font-mono">₹{invoiceData.grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Note: Bank details, Terms, QR code and Signatory were removed as per user instruction */}
          </div>
        </div>
      </div>

      {/* ════════════════════ COMPACT 1-PAGE PRINT STYLESHEET ════════════════════ */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm !important;
          }

          html, body {
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            overflow: visible !important;
          }

          /* Hide everything outside printable invoice */
          body > *:not(.order-invoice-portal-root) {
            display: none !important;
          }

          .order-invoice-portal-root {
            position: static !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
          }

          .order-invoice-portal-root > div {
            max-height: none !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border: 0 !important;
            border-radius: 0 !important;
            overflow: visible !important;
            background: transparent !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .order-invoice-portal-root > div > div:nth-child(2) {
            padding: 0 !important;
            background: transparent !important;
            overflow: visible !important;
          }

          #printable-invoice {
            position: static !important;
            width: 100% !important;
            max-width: 190mm !important;
            margin: 0 auto !important;
            padding: 14px 18px !important;
            box-shadow: none !important;
            border: 1.5px solid #083028 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            border-radius: 8px !important;
          }

          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>,
    document.body
  );
}
