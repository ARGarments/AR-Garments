'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Store,
  ArrowLeft,
  Calendar,
  Layers,
  Box,
  Truck,
  RotateCcw,
  CheckCircle,
  Clock,
  DollarSign,
  AlertCircle,
  Plus,
  Loader2,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { PartyStockMeterMetrics, ProductPartyBatch, Party } from '@/lib/parties';

export default function PartyDetailsPage() {
  const params = useParams();
  const partyId = params?.id as string;
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [party, setParty] = useState<Party | null>(null);
  const [metrics, setMetrics] = useState<PartyStockMeterMetrics | null>(null);
  const [batches, setBatches] = useState<ProductPartyBatch[]>([]);

  const isMainStore = partyId === 'main_store';

  const loadPartyDetails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/parties/${partyId}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load party');

      setParty(data.party || null);
      setMetrics(data.metrics || null);
      setBatches(data.batches || []);
    } catch (err) {
      console.error('Error loading party details:', err);
      toast.error('Could not load party ledger.');
    } finally {
      setLoading(false);
    }
  }, [partyId, toast]);

  useEffect(() => {
    if (partyId) {
      loadPartyDetails();
    }
  }, [partyId, loadPartyDetails]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-24 flex flex-col items-center justify-center gap-3 text-gray-500">
        <Loader2 size={32} className="animate-spin text-[#083028]" />
        <p className="text-sm font-semibold">Loading Party Stock Meter & Ledger...</p>
      </div>
    );
  }

  const displayName = isMainStore ? '🏢 Main Store (Direct Inventory)' : party?.name || 'Party';

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* ─── Header & Navigation ───────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/parties"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 mb-2 transition-colors"
          >
            <ArrowLeft size={14} /> Back to All Parties
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">{displayName}</h1>
            {!isMainStore && party && (
              <span
                className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                  party.isActive ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                }`}
              >
                {party.isActive ? 'ACTIVE' : 'INACTIVE'}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {isMainStore ? 'Direct store purchased goods ledger' : `${party?.contactPerson || 'Vendor'} · ${party?.phone || 'No phone'} · ${party?.address || 'No location'}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#083028] hover:bg-[#051e19] text-white rounded-2xl text-xs font-bold transition shadow-md"
          >
            <Plus size={15} /> Add Inward Stock
          </Link>
        </div>
      </div>

      {/* ─── Party Stock Meter Dashboard ────────────────────────────────────────── */}
      {metrics && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
            <div>
              <span className="text-xs font-black uppercase text-[#083028] tracking-wider block">
                Independent Stock Meter
              </span>
              <h2 className="text-xl font-black text-gray-900 mt-0.5">लाइव स्टॉक और वैल्यूएशन मीटर</h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500 font-medium">Total Invested in this Party</span>
              <p className="text-2xl font-black text-[#B8860B]">
                ₹{metrics.totalInvestedAmount.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* 8 Standard Stock Meter Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4">
              <span className="text-[10px] font-bold uppercase text-gray-500 block">Total Inward Qty</span>
              <span className="text-2xl font-black text-gray-900 block mt-1">
                {metrics.totalInwardQuantity.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-gray-400">Total received units</span>
            </div>

            <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4">
              <span className="text-[10px] font-bold uppercase text-emerald-800 block">Final Sold Qty</span>
              <span className="text-2xl font-black text-emerald-800 block mt-1">
                {metrics.finalSoldQuantity.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-emerald-600">7-day return passed</span>
            </div>

            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4">
              <span className="text-[10px] font-bold uppercase text-amber-800 block">In-Transit / Hold</span>
              <span className="text-2xl font-black text-amber-800 block mt-1">
                {metrics.inTransitQuantity.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-amber-600">Pending delivery / in 7-day</span>
            </div>

            <div className="bg-blue-50 border border-blue-200/80 rounded-2xl p-4">
              <span className="text-[10px] font-bold uppercase text-blue-800 block">Available Stock</span>
              <span className="text-2xl font-black text-blue-800 block mt-1">
                {metrics.availableStockQuantity.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-blue-600">Ready in godown</span>
            </div>

            <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-2xl p-4">
              <span className="text-[10px] font-bold uppercase text-emerald-800 block">Cleared Cost Value</span>
              <span className="text-lg sm:text-xl font-black text-emerald-800 block mt-1">
                ₹{metrics.clearedCostValue.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-emerald-600">Cleared party cost</span>
            </div>

            <div className="bg-amber-50/60 border border-amber-200/60 rounded-2xl p-4">
              <span className="text-[10px] font-bold uppercase text-amber-800 block">Hold Value</span>
              <span className="text-lg sm:text-xl font-black text-amber-800 block mt-1">
                ₹{metrics.holdValue.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-amber-600">Subject to 7-day return</span>
            </div>

            <div className="bg-blue-50/60 border border-blue-200/60 rounded-2xl p-4">
              <span className="text-[10px] font-bold uppercase text-blue-800 block">Remaining Stock Value</span>
              <span className="text-lg sm:text-xl font-black text-blue-800 block mt-1">
                ₹{metrics.remainingStockValue.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-blue-600">At applicable cost</span>
            </div>

            <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4">
              <span className="text-[10px] font-bold uppercase text-gray-500 block">Sales Progress</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-black text-[#B8860B]">{metrics.salesProgressPercentage}%</span>
                <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#B8860B] h-full rounded-full"
                    style={{ width: `${metrics.salesProgressPercentage}%` }}
                  />
                </div>
              </div>
              <span className="text-[10px] text-gray-400">Total batch cleared</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── Batch-wise Inward & Cost Breakdown ─────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-black text-gray-900">बैच-वार इनवर्ड और खरीद रिकॉर्ड</h3>
            <p className="text-xs text-gray-500">
              Batch-wise records preserving differing party cost prices over time
            </p>
          </div>
          <span className="text-xs font-bold text-gray-500">{batches.length} Batches Recorded</span>
        </div>

        {batches.length === 0 ? (
          <div className="text-center py-12 text-gray-400 space-y-2">
            <Box size={32} className="mx-auto text-gray-300" />
            <p className="text-xs font-semibold">No stock batches assigned to this party yet.</p>
            <p className="text-[11px] text-gray-400">
              Add a new product in the Catalog and select &quot;Party Involved: YES&quot; with this party.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-600 border-b border-gray-200">
                  <th className="py-3 px-4 font-bold">Batch No / Date</th>
                  <th className="py-3 px-4 font-bold">Product Item</th>
                  <th className="py-3 px-4 font-bold">Inward Qty</th>
                  <th className="py-3 px-4 font-bold">Party Cost Price</th>
                  <th className="py-3 px-4 font-bold">Invested Value</th>
                  <th className="py-3 px-4 font-bold">Available Qty</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {batches.map((b) => {
                  const invested = b.inwardQuantity * b.partyCostPrice;
                  return (
                    <tr key={b.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-gray-900 block">{b.batchNumber}</span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(b.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-gray-800">{b.productName}</td>
                      <td className="py-3.5 px-4 font-black text-gray-900">{b.inwardQuantity} pcs</td>
                      <td className="py-3.5 px-4 font-extrabold text-gray-700">₹{b.partyCostPrice}</td>
                      <td className="py-3.5 px-4 font-black text-[#B8860B]">₹{invested.toLocaleString('en-IN')}</td>
                      <td className="py-3.5 px-4 font-bold text-blue-700">{b.availableQuantity} pcs</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          <CheckCircle size={11} /> Stock Active
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
