'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Store,
  Plus,
  Search,
  Filter,
  TrendingUp,
  Package,
  Clock,
  CheckCircle,
  Truck,
  RotateCcw,
  AlertTriangle,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  Loader2,
  DollarSign,
  Box,
  BarChart3,
  Users,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { PartyStockMeterMetrics, MasterStoreOverviewMetrics, Party } from '@/lib/parties';

type DateFilterOption = 'all' | 'today' | 'month' | '6months' | 'custom';

export default function PartiesManagementPage() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [parties, setParties] = useState<Party[]>([]);
  const [masterMetrics, setMasterMetrics] = useState<MasterStoreOverviewMetrics | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  // Add / Edit Party Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [savingParty, setSavingParty] = useState(false);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [partyForm, setPartyForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    isActive: true,
  });

  // Calculate Date Ranges
  const getDateRangeParams = useCallback(() => {
    const now = new Date();
    if (dateFilter === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      return { from: start, to: now.toISOString() };
    }
    if (dateFilter === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      return { from: start, to: now.toISOString() };
    }
    if (dateFilter === '6months') {
      const start = new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString();
      return { from: start, to: now.toISOString() };
    }
    if (dateFilter === 'custom' && customFrom) {
      return { from: new Date(customFrom).toISOString(), to: customTo ? new Date(customTo).toISOString() : now.toISOString() };
    }
    return {};
  }, [dateFilter, customFrom, customTo]);

  // Load Data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const range = getDateRangeParams();
      const queryParams = new URLSearchParams();
      if (range.from) queryParams.set('from', range.from);
      if (range.to) queryParams.set('to', range.to);

      const [partiesRes, metricsRes] = await Promise.all([
        fetch('/api/admin/parties', { cache: 'no-store' }),
        fetch(`/api/admin/parties/metrics?${queryParams.toString()}`, { cache: 'no-store' }),
      ]);

      if (partiesRes.ok) {
        const pData = await partiesRes.json();
        setParties(pData.parties || []);
      }

      if (metricsRes.ok) {
        const mData = await metricsRes.json();
        setMasterMetrics(mData.data || null);
      }
    } catch (err) {
      console.error('Error loading parties data:', err);
      toast.error('Failed to load party statistics.');
    } finally {
      setLoading(false);
    }
  }, [getDateRangeParams, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Save Party (Create / Edit)
  const handleSaveParty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyForm.name.trim()) {
      toast.warning('Party Name is required.');
      return;
    }

    setSavingParty(true);
    try {
      const url = modalMode === 'edit' && selectedParty ? `/api/admin/parties/${selectedParty.id}` : '/api/admin/parties';
      const method = modalMode === 'edit' ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partyForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save party');

      toast.success(modalMode === 'edit' ? 'Party updated successfully!' : 'New Party added successfully!');
      setModalOpen(false);
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error saving party');
    } finally {
      setSavingParty(false);
    }
  };

  // Toggle Party Active
  const handleTogglePartyActive = async (party: Party) => {
    try {
      const res = await fetch(`/api/admin/parties/${party.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !party.isActive }),
      });
      if (res.ok) {
        toast.success(`${party.name} is now ${!party.isActive ? 'Active' : 'Deactivated'}.`);
        loadData();
      }
    } catch {
      toast.error('Could not update status');
    }
  };

  // Filter parties by search query
  const filteredParties = parties.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.contactPerson && p.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.phone && p.phone.includes(searchQuery))
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* ─── Top Header ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#083028] mb-1">
            <Store size={18} className="text-[#B8860B]" />
            <span>Inventory & Vendor Ledger</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            पार्टी सेल्स & स्टॉक मीटर सिस्टम
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Party-Wise Sales, Inward Stock, Hold Value & 7-Day Return Window Meter
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setModalMode('create');
              setSelectedParty(null);
              setPartyForm({
                name: '',
                contactPerson: '',
                phone: '',
                email: '',
                address: '',
                notes: '',
                isActive: true,
              });
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#083028] hover:bg-[#051e19] text-white rounded-2xl text-xs sm:text-sm font-bold transition shadow-md"
          >
            <Plus size={16} />
            <span>Add New Party (पार्टी जोड़ें)</span>
          </button>
        </div>
      </div>

      {/* ─── Date Filter Bar ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
          <Calendar size={16} className="text-[#B8860B]" />
          <span>Timeline Filter / समय फ़िल्टर:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { key: 'all', label: 'All Time' },
              { key: 'today', label: 'Today (आज)' },
              { key: 'month', label: 'This Month (इस माह)' },
              { key: '6months', label: 'Last 6 Months (6 महीने)' },
              { key: 'custom', label: 'Custom Range' },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setDateFilter(item.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                dateFilter === item.key
                  ? 'bg-[#083028] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {dateFilter === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="px-2.5 py-1 text-xs border border-gray-200 rounded-lg text-gray-700"
            />
            <span className="text-xs text-gray-400">to</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="px-2.5 py-1 text-xs border border-gray-200 rounded-lg text-gray-700"
            />
          </div>
        )}
      </div>

      {/* ─── Master Store Combined Overview ─────────────────────────────────────── */}
      {masterMetrics && (
        <div className="bg-gradient-to-br from-[#083028] to-[#041a15] rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-[11px] font-black tracking-wide uppercase mb-2">
                <ShieldCheck size={14} /> Master Store & Party Combined Inventory
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                कुल स्टोर इन्वेंटरी & वैल्यूएशन
              </h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-white/60 font-medium">Combined Stock Valuation</span>
              <p className="text-2xl sm:text-3xl font-black text-[#B8860B]">
                ₹{masterMetrics.totalInventoryValuation.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* 8 Primary Master Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-[11px] font-bold text-white/60 uppercase">Total Items Inward</p>
              <p className="text-xl sm:text-2xl font-black text-white mt-1">
                {masterMetrics.totalItemsInStore.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-white/40 mt-0.5">Total received units</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-[11px] font-bold text-emerald-400 uppercase">Final Sold Quantity</p>
              <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">
                {masterMetrics.finalSoldQuantity.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-emerald-300/60 mt-0.5">7-day window passed</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-[11px] font-bold text-amber-300 uppercase">In-Transit / Trial</p>
              <p className="text-xl sm:text-2xl font-black text-amber-300 mt-1">
                {masterMetrics.inTransitQuantity.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-amber-200/60 mt-0.5">Shipped or within 7 days</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-[11px] font-bold text-blue-300 uppercase">Available Stock Left</p>
              <p className="text-xl sm:text-2xl font-black text-blue-300 mt-1">
                {masterMetrics.availableStockLeft.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-blue-200/60 mt-0.5">Ready to sell</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-[11px] font-bold text-emerald-400 uppercase">Cleared Cost Value</p>
              <p className="text-lg sm:text-xl font-black text-emerald-400 mt-1">
                ₹{masterMetrics.clearedCostValue.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-emerald-300/60 mt-0.5">Cleared purchase cost</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-[11px] font-bold text-amber-300 uppercase">Hold Value (Pending)</p>
              <p className="text-lg sm:text-xl font-black text-amber-300 mt-1">
                ₹{masterMetrics.holdValue.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-amber-200/60 mt-0.5">In return window</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-[11px] font-bold text-blue-300 uppercase">Stock Value Left</p>
              <p className="text-lg sm:text-xl font-black text-blue-300 mt-1">
                ₹{masterMetrics.stockValueLeft.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-blue-200/60 mt-0.5">Available units value</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-[11px] font-bold text-white/60 uppercase">Sales Progress</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-lg sm:text-xl font-black text-[#B8860B]">
                  {masterMetrics.salesProgressPercentage}%
                </p>
                <div className="flex-1 bg-white/20 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#B8860B] h-full rounded-full transition-all"
                    style={{ width: `${masterMetrics.salesProgressPercentage}%` }}
                  />
                </div>
              </div>
              <p className="text-[10px] text-white/40 mt-1">Clearance rate</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Individual Party Stock Meter Cards ─────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-gray-900">
              पार्टी-वार स्टॉक मीटर (Party-Wise Stock Cards)
            </h3>
            <p className="text-xs text-gray-500">
              Independent stock progress, cleared cost, and hold metrics per party
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by party name..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083028]"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
            <Loader2 size={24} className="animate-spin text-[#083028]" />
            <span className="text-sm font-semibold">Loading Party Stock Meters...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Show Main Store (No Party) card first */}
            {masterMetrics?.parties?.find((p) => p.partyId === null) && (
              <PartyCard
                metrics={masterMetrics.parties.find((p) => p.partyId === null)!}
                party={null}
                onEdit={() => {}}
                onToggleActive={() => {}}
                isMainStore
              />
            )}

            {/* Individual Parties */}
            {filteredParties.map((party) => {
              const partyM = masterMetrics?.parties?.find((p) => p.partyId === party.id) || {
                partyId: party.id,
                partyName: party.name,
                totalInwardQuantity: 0,
                totalInvestedAmount: 0,
                finalSoldQuantity: 0,
                inTransitQuantity: 0,
                availableStockQuantity: 0,
                clearedCostValue: 0,
                holdValue: 0,
                remainingStockValue: 0,
                salesProgressPercentage: 0,
                totalRevenueGenerated: 0,
                batchesCount: 0,
                activeOrdersCount: 0,
              };

              return (
                <PartyCard
                  key={party.id}
                  party={party}
                  metrics={partyM}
                  onEdit={() => {
                    setSelectedParty(party);
                    setPartyForm({
                      name: party.name,
                      contactPerson: party.contactPerson || '',
                      phone: party.phone || '',
                      email: party.email || '',
                      address: party.address || '',
                      notes: party.notes || '',
                      isActive: party.isActive,
                    });
                    setModalMode('edit');
                    setModalOpen(true);
                  }}
                  onToggleActive={() => handleTogglePartyActive(party)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Add / Edit Party Modal ────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-lg font-black text-gray-900">
                {modalMode === 'edit' ? 'Edit Party Details / पार्टी एडिट करें' : 'Add New Party / नई पार्टी जोड़ें'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveParty} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Party Name / पार्टी का नाम <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={partyForm.name}
                  onChange={(e) => setPartyForm({ ...partyForm, name: e.target.value })}
                  placeholder="e.g. Ramesh Ji, Amit Bhai"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-[#083028]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={partyForm.contactPerson}
                    onChange={(e) => setPartyForm({ ...partyForm, contactPerson: e.target.value })}
                    placeholder="Representative name"
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083028]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={partyForm.phone}
                    onChange={(e) => setPartyForm({ ...partyForm, phone: e.target.value })}
                    placeholder="10-digit mobile"
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083028]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Address / Location</label>
                <input
                  type="text"
                  value={partyForm.address}
                  onChange={(e) => setPartyForm({ ...partyForm, address: e.target.value })}
                  placeholder="e.g. Surat, Gujarat / Civil Lines, Prayagraj"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083028]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Internal Notes</label>
                <textarea
                  rows={2}
                  value={partyForm.notes}
                  onChange={(e) => setPartyForm({ ...partyForm, notes: e.target.value })}
                  placeholder="Special terms, fabric types supplied, etc."
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083028]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="partyActive"
                  checked={partyForm.isActive}
                  onChange={(e) => setPartyForm({ ...partyForm, isActive: e.target.checked })}
                  className="w-4 h-4 text-[#083028] rounded accent-[#083028]"
                />
                <label htmlFor="partyActive" className="text-xs font-bold text-gray-700">
                  Active Party (Allow stock inward)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingParty}
                  className="px-5 py-2 bg-[#083028] text-white text-xs font-bold rounded-xl shadow-md hover:bg-[#051e19] disabled:opacity-50"
                >
                  {savingParty ? 'Saving...' : 'Save Party'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-Component: Individual Party Card ───────────────────────────────────────
function PartyCard({
  party,
  metrics,
  onEdit,
  onToggleActive,
  isMainStore = false,
}: {
  party: Party | null;
  metrics: PartyStockMeterMetrics;
  onEdit: () => void;
  onToggleActive: () => void;
  isMainStore?: boolean;
}) {
  return (
    <div className="bg-white rounded-3xl border-2 border-gray-200 overflow-hidden shadow-xs hover:border-[#083028]/40 hover:shadow-md transition-all flex flex-col justify-between">
      {/* Header */}
      <div
        className={`px-5 py-4 border-b flex items-center justify-between ${
          isMainStore
            ? 'bg-slate-800 text-white border-slate-700'
            : 'bg-emerald-50 text-[#083028] border-emerald-100'
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-extrabold text-base leading-tight">
              {isMainStore ? '🏢 Main Store (Direct Inventory)' : party?.name}
            </h4>
            {!isMainStore && party && (
              <span
                className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                  party.isActive ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                }`}
              >
                {party.isActive ? 'ACTIVE' : 'INACTIVE'}
              </span>
            )}
          </div>
          <p className="text-[11px] opacity-75 mt-0.5">
            {isMainStore ? 'Internal store purchases' : party?.address || party?.contactPerson || 'Registered Vendor'}
          </p>
        </div>

        {!isMainStore && (
          <button
            type="button"
            onClick={onEdit}
            className="text-xs font-bold text-gray-500 hover:text-gray-900 bg-white/80 px-2.5 py-1 rounded-lg border border-gray-200"
          >
            Edit
          </button>
        )}
      </div>

      {/* Body: Stock Meter Stats */}
      <div className="p-5 space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-xs font-bold mb-1">
            <span className="text-gray-600">Sales Clearance Rate</span>
            <span className="text-[#083028]">{metrics.salesProgressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all"
              style={{ width: `${metrics.salesProgressPercentage}%` }}
            />
          </div>
        </div>

        {/* Quantities Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
            <span className="text-gray-500 text-[10px] uppercase font-bold block">Total Inward</span>
            <span className="text-base font-black text-gray-900">
              {metrics.totalInwardQuantity.toLocaleString('en-IN')} pcs
            </span>
          </div>

          <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100">
            <span className="text-emerald-800 text-[10px] uppercase font-bold block">Final Sold</span>
            <span className="text-base font-black text-emerald-800">
              {metrics.finalSoldQuantity.toLocaleString('en-IN')} pcs
            </span>
          </div>

          <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-100">
            <span className="text-amber-800 text-[10px] uppercase font-bold block">In-Transit / Hold</span>
            <span className="text-base font-black text-amber-800">
              {metrics.inTransitQuantity.toLocaleString('en-IN')} pcs
            </span>
          </div>

          <div className="bg-blue-50/70 p-2.5 rounded-xl border border-blue-100">
            <span className="text-blue-800 text-[10px] uppercase font-bold block">Available Stock</span>
            <span className="text-base font-black text-blue-800">
              {metrics.availableStockQuantity.toLocaleString('en-IN')} pcs
            </span>
          </div>
        </div>

        {/* Financial Valuation Metrics */}
        <div className="space-y-1.5 pt-2 border-t border-gray-100 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Total Invested:</span>
            <span className="font-extrabold text-gray-900">
              ₹{metrics.totalInvestedAmount.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="flex justify-between text-emerald-700">
            <span className="font-medium">Cleared Cost Value:</span>
            <span className="font-black">₹{metrics.clearedCostValue.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-between text-amber-700">
            <span className="font-medium">Hold Value (Return Window):</span>
            <span className="font-black">₹{metrics.holdValue.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-between text-blue-700">
            <span className="font-medium">Remaining Stock Value:</span>
            <span className="font-black">₹{metrics.remainingStockValue.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Footer Link */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs">
        <span className="text-gray-500 font-medium">{metrics.batchesCount} inward batches</span>
        <Link
          href={`/admin/parties/${party ? party.id : 'main_store'}`}
          className="font-bold text-[#083028] hover:text-emerald-700 flex items-center gap-1 group"
        >
          <span>View Ledger & Batches</span>
          <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
