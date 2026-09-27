'use client';

import { useState, useEffect } from 'react';
import {
  Ticket,
  Plus,
  Search,
  Check,
  Copy,
  Trash2,
  Edit2,
  Sparkles,
  Percent,
  CircleDollarSign,
  Truck,
  CheckCircle2,
  XCircle,
  Tag,
  AlertCircle,
  Clock,
  Layers,
  Calendar,
  X,
  RefreshCw,
} from 'lucide-react';
import { Coupon, DiscountType, defaultCoupons } from '@/lib/adminData';

const AVAILABLE_CATEGORIES = [
  'All',
  'Sarees',
  'Suits & Dress Material',
  'Dupatta Sets',
  'Men Fashion',
  'Kids Fashion',
];

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Form Fields
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [applicableCategory, setApplicableCategory] = useState('All');
  const [minOrderValue, setMinOrderValue] = useState<number>(499);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<string>('');
  const [usageLimit, setUsageLimit] = useState<string>('');
  const [validUntil, setValidUntil] = useState('');
  const [active, setActive] = useState(true);

  // Live simulation for test calculation in modal
  const [testAmount, setTestAmount] = useState(1500);

  // Fetch Coupons
  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/coupons', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setCoupons(Array.isArray(data) && data.length > 0 ? data : defaultCoupons);
      } else {
        setCoupons(defaultCoupons);
      }
    } catch {
      setCoupons(defaultCoupons);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  // Quick code generator
  const generateRandomCode = () => {
    const prefixes = applicableCategory !== 'All' 
      ? [applicableCategory.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, '')] 
      : ['SAVE', 'FESTIVE', 'AR', 'SPECIAL', 'DEAL'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)] || 'DEAL';
    const val = discountType === 'percentage' ? discountValue : (discountValue || 100);
    const randomSuffix = Math.floor(10 + Math.random() * 90);
    setCode(`${prefix}${val || randomSuffix}`);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setCode('FESTIVE20');
    setTitle('Festive Season Discount');
    setDescription('Special discount on select festival collections');
    setDiscountType('percentage');
    setDiscountValue(20);
    setApplicableCategory('Sarees');
    setMinOrderValue(999);
    setMaxDiscountAmount('500');
    setUsageLimit('200');
    setValidUntil('');
    setActive(true);
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (c: Coupon) => {
    setEditingCoupon(c);
    setCode(c.code);
    setTitle(c.title);
    setDescription(c.description || '');
    setDiscountType(c.discountType);
    setDiscountValue(c.discountValue);
    setApplicableCategory(c.applicableCategory || 'All');
    setMinOrderValue(c.minOrderValue || 0);
    setMaxDiscountAmount(c.maxDiscountAmount ? String(c.maxDiscountAmount) : '');
    setUsageLimit(c.usageLimit ? String(c.usageLimit) : '');
    setValidUntil(c.validUntil ? c.validUntil.split('T')[0] : '');
    setActive(c.active);
    setFormError('');
    setIsModalOpen(true);
  };

  // Save Coupon (Create / Update)
  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setFormError('Coupon code is required.');
      return;
    }
    if (!title.trim()) {
      setFormError('Title is required.');
      return;
    }

    setSaving(true);
    setFormError('');

    const payload = {
      code: code.trim().toUpperCase(),
      title: title.trim(),
      description: description.trim(),
      discountType,
      discountValue: Number(discountValue) || 0,
      applicableCategory,
      minOrderValue: Number(minOrderValue) || 0,
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
      usageLimit: usageLimit ? Number(usageLimit) : null,
      validUntil: validUntil ? new Date(validUntil).toISOString() : null,
      active,
    };

    try {
      if (editingCoupon) {
        // PATCH
        const res = await fetch(`/api/coupons?id=${editingCoupon.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to update coupon');
      } else {
        // POST
        const res = await fetch('/api/coupons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to create coupon');
      }

      setIsModalOpen(false);
      fetchCoupons();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error saving coupon');
    } finally {
      setSaving(false);
    }
  };

  // Delete Coupon
  const handleDeleteCoupon = async (id: string, couponCode: string) => {
    if (!confirm(`Are you sure you want to delete coupon '${couponCode}'?`)) return;
    try {
      await fetch(`/api/coupons?id=${id}`, { method: 'DELETE' });
      setCoupons((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      alert('Error deleting coupon');
    }
  };

  // Toggle Active Status
  const handleToggleActive = async (coupon: Coupon) => {
    const updatedStatus = !coupon.active;
    // Optimistic update
    setCoupons((prev) =>
      prev.map((c) => (c.id === coupon.id ? { ...c, active: updatedStatus } : c))
    );

    try {
      await fetch(`/api/coupons?id=${coupon.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: updatedStatus }),
      });
    } catch {
      fetchCoupons();
    }
  };

  // Copy Code to Clipboard
  const handleCopyCode = (c: string) => {
    navigator.clipboard?.writeText(c);
    setCopiedCode(c);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Filtered list
  const filteredCoupons = coupons.filter((c) => {
    const matchesSearch =
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.applicableCategory && c.applicableCategory.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategoryFilter === 'All' ||
      c.applicableCategory === selectedCategoryFilter ||
      (selectedCategoryFilter !== 'All' && c.applicableCategory === 'All');

    const matchesStatus =
      statusFilter === 'All'
        ? true
        : statusFilter === 'Active'
        ? c.active
        : !c.active;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Stats calculation
  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter((c) => c.active).length;
  const categorySpecificCount = coupons.filter((c) => c.applicableCategory && c.applicableCategory !== 'All').length;
  const totalRedemptions = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0);

  // Live simulation math
  const calculateSimulatedDiscount = () => {
    if (discountType === 'percentage') {
      const raw = Math.round((testAmount * (discountValue || 0)) / 100);
      const cap = maxDiscountAmount ? Number(maxDiscountAmount) : null;
      return cap !== null && raw > cap ? cap : raw;
    } else if (discountType === 'flat') {
      return Math.min(Number(discountValue) || 0, testAmount);
    }
    return 0; // free shipping
  };

  const simulatedDiscount = calculateSimulatedDiscount();
  const simulatedFinal = Math.max(0, testAmount - simulatedDiscount);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#083028] text-white flex items-center justify-center shadow-sm">
              <Ticket size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">Coupons &amp; Discounts</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Create and manage storewide and <span className="font-semibold text-[#083028]">category-specific</span> promo codes
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchCoupons}
            className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors shadow-xs"
            title="Refresh list"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 bg-[#083028] hover:bg-[#051e19] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm hover:shadow"
          >
            <Plus size={18} />
            Create Coupon
          </button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#083028] flex items-center justify-center flex-shrink-0">
            <Ticket size={22} />
          </div>
          <div>
            <p className="text-2xl font-black text-gray-900">{totalCoupons}</p>
            <p className="text-xs text-gray-500 font-medium">Total Coupons</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <p className="text-2xl font-black text-gray-900">{activeCoupons}</p>
            <p className="text-xs text-gray-500 font-medium">Active Coupons</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <Layers size={22} />
          </div>
          <div>
            <p className="text-2xl font-black text-gray-900">{categorySpecificCount}</p>
            <p className="text-xs text-gray-500 font-medium">Category Specific</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Sparkles size={22} />
          </div>
          <div>
            <p className="text-2xl font-black text-gray-900">{totalRedemptions}</p>
            <p className="text-xs text-gray-500 font-medium">Total Redemptions</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by code, title, or category..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#083028]"
          />
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap hidden sm:inline">
            Category:
          </span>
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:border-[#083028]"
          >
            {AVAILABLE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'All' ? '🌐 All Categories' : `🎯 ${cat}`}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:border-[#083028]"
          >
            <option value="All">All Status</option>
            <option value="Active">Active Only</option>
            <option value="Inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Coupons Table / Cards */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {filteredCoupons.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Ticket size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-base font-bold text-gray-700">No coupons found</p>
            <p className="text-xs text-gray-400 mt-1 mb-4">Try adjusting your search query or filters.</p>
            <button
              onClick={handleOpenCreate}
              className="bg-[#083028] text-white px-4 py-2 rounded-xl text-xs font-semibold"
            >
              + Create New Coupon
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAF8F3] border-b border-gray-100 text-gray-600 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-5">Coupon Code</th>
                  <th className="py-4 px-5">Discount</th>
                  <th className="py-4 px-5">Applicable Category</th>
                  <th className="py-4 px-5">Order Rules</th>
                  <th className="py-4 px-5">Usage</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCoupons.map((coupon) => {
                  const isCategorySpecific = coupon.applicableCategory && coupon.applicableCategory !== 'All';

                  return (
                    <tr key={coupon.id} className="hover:bg-gray-50/70 transition-colors">
                      {/* Code + Title */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-[#083028] bg-[#083028]/10 px-2.5 py-1 rounded-lg border border-[#083028]/20 flex items-center gap-1.5">
                            <Tag size={13} />
                            {coupon.code}
                          </span>
                          <button
                            onClick={() => handleCopyCode(coupon.code)}
                            title="Copy code"
                            className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                          >
                            {copiedCode === coupon.code ? (
                              <Check size={14} className="text-emerald-600" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>
                        <p className="text-xs font-semibold text-gray-800 mt-1">{coupon.title}</p>
                        {coupon.description && (
                          <p className="text-[11px] text-gray-400 line-clamp-1 max-w-xs">{coupon.description}</p>
                        )}
                      </td>

                      {/* Discount badge */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        {coupon.discountType === 'percentage' && (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 font-bold px-2.5 py-1 rounded-full text-xs border border-amber-200">
                            <Percent size={12} /> {coupon.discountValue}% OFF
                          </span>
                        )}
                        {coupon.discountType === 'flat' && (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 font-bold px-2.5 py-1 rounded-full text-xs border border-emerald-200">
                            <CircleDollarSign size={12} /> ₹{coupon.discountValue} FLAT OFF
                          </span>
                        )}
                        {coupon.discountType === 'free_shipping' && (
                          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 font-bold px-2.5 py-1 rounded-full text-xs border border-blue-200">
                            <Truck size={12} /> Free Shipping
                          </span>
                        )}
                      </td>

                      {/* Applicable Category */}
                      <td className="py-4 px-5">
                        {isCategorySpecific ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-800 bg-purple-100/70 border border-purple-200 px-3 py-1 rounded-full">
                            🎯 {coupon.applicableCategory}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                            🌐 All Categories
                          </span>
                        )}
                      </td>

                      {/* Order Rules */}
                      <td className="py-4 px-5 text-xs text-gray-600">
                        <p>
                          Min Order:{' '}
                          <span className="font-bold text-gray-900">
                            ₹{coupon.minOrderValue || 0}
                          </span>
                        </p>
                        {coupon.maxDiscountAmount && (
                          <p className="text-gray-400 text-[11px]">
                            Max cap: ₹{coupon.maxDiscountAmount}
                          </p>
                        )}
                      </td>

                      {/* Usage */}
                      <td className="py-4 px-5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{coupon.usedCount || 0}</span>
                          <span className="text-gray-400">
                            / {coupon.usageLimit ? `${coupon.usageLimit} max` : '∞'}
                          </span>
                        </div>
                        {coupon.usageLimit && (
                          <div className="w-20 bg-gray-100 h-1.5 rounded-full mt-1 overflow-hidden">
                            <div
                              className="bg-[#083028] h-full rounded-full"
                              style={{
                                width: `${Math.min(100, ((coupon.usedCount || 0) / coupon.usageLimit) * 100)}%`,
                              }}
                            />
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleActive(coupon)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            coupon.active
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {coupon.active ? (
                            <>
                              <CheckCircle2 size={13} /> Active
                            </>
                          ) : (
                            <>
                              <XCircle size={13} /> Inactive
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(coupon)}
                            className="p-1.5 text-gray-500 hover:text-[#083028] hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit Coupon"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteCoupon(coupon.id, coupon.code)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Coupon"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#083028] text-white flex items-center justify-center">
                  <Ticket size={16} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
                  </h2>
                  <p className="text-xs text-gray-400">Configure discount value, category restriction &amp; rules</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCoupon} className="p-6 space-y-5">
              {formError && (
                <div className="bg-red-50 text-red-700 p-3 rounded-xl text-xs font-semibold border border-red-200">
                  {formError}
                </div>
              )}

              {/* Coupon Code + Randomizer */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                  Coupon Code *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                    placeholder="e.g. SAREE20, FESTIVE500"
                    className="flex-1 px-4 py-2.5 font-mono font-bold text-base uppercase rounded-xl border border-gray-200 focus:outline-none focus:border-[#083028] bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={generateRandomCode}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
                  >
                    <Sparkles size={14} className="text-[#083028]" />
                    Auto-Generate
                  </button>
                </div>
              </div>

              {/* Title & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Saree Festive Special"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#083028]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    Description / Banner Subtitle
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. 20% off exclusively on all sarees"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#083028]"
                  />
                </div>
              </div>

              {/* Discount Type */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                  Discount Type *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDiscountType('percentage')}
                    className={`py-3 px-3 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition-all ${
                      discountType === 'percentage'
                        ? 'bg-[#083028] text-white border-[#083028] shadow-sm'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Percent size={16} />
                    Percentage (%)
                  </button>

                  <button
                    type="button"
                    onClick={() => setDiscountType('flat')}
                    className={`py-3 px-3 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition-all ${
                      discountType === 'flat'
                        ? 'bg-[#083028] text-white border-[#083028] shadow-sm'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <CircleDollarSign size={16} />
                    Flat Amount (₹)
                  </button>

                  <button
                    type="button"
                    onClick={() => setDiscountType('free_shipping')}
                    className={`py-3 px-3 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition-all ${
                      discountType === 'free_shipping'
                        ? 'bg-[#083028] text-white border-[#083028] shadow-sm'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Truck size={16} />
                    Free Shipping
                  </button>
                </div>
              </div>

              {/* Discount Value + Max Cap */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    {discountType === 'percentage' ? 'Discount Percentage (%)' : 'Discount Value (₹)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={discountType === 'free_shipping'}
                    value={discountType === 'free_shipping' ? 0 : discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:border-[#083028] disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    Max Discount Cap (₹) {discountType !== 'percentage' && '(N/A)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={discountType !== 'percentage'}
                    value={maxDiscountAmount}
                    onChange={(e) => setMaxDiscountAmount(e.target.value)}
                    placeholder="Leave blank for no limit"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#083028] disabled:bg-gray-100"
                  />
                </div>
              </div>

              {/* CATEGORY RESTRICTION — USER'S KEY REQUIREMENT */}
              <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-purple-900 font-bold text-xs uppercase tracking-wide">
                  <Layers size={15} className="text-purple-700" />
                  Category Specific Restriction *
                </div>
                <p className="text-xs text-purple-800/80">
                  Select which category this coupon is valid for. If set to a specific category, it will strictly reject products from other categories.
                </p>

                <select
                  value={applicableCategory}
                  onChange={(e) => setApplicableCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-purple-300 text-sm font-bold bg-white text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  <option value="All">🌐 All Categories (Storewide)</option>
                  {AVAILABLE_CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                    <option key={cat} value={cat}>
                      🎯 {cat} Only
                    </option>
                  ))}
                </select>

                {applicableCategory !== 'All' ? (
                  <p className="text-xs font-semibold text-purple-700 flex items-center gap-1.5 pt-1">
                    <CheckCircle2 size={13} />
                    Only shoppers purchasing from <strong>&ldquo;{applicableCategory}&rdquo;</strong> can use this coupon.
                  </p>
                ) : (
                  <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5 pt-1">
                    🌐 Valid for any item across all collections.
                  </p>
                )}
              </div>

              {/* Order Minimum & Usage Limit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    Min Order Value (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#083028]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    Usage Limit (Total Redemptions)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    placeholder="Unlimited"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#083028]"
                  />
                </div>
              </div>

              {/* Expiry Date & Active */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    Expiry Date (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#083028]"
                    />
                  </div>
                </div>

                <div className="pt-5 sm:pt-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                      className="w-5 h-5 accent-[#083028] rounded cursor-pointer"
                    />
                    <span className="text-xs font-bold text-gray-800">
                      Enable this coupon immediately (Active)
                    </span>
                  </label>
                </div>
              </div>

              {/* LIVE SIMULATOR PREVIEW */}
              <div className="p-4 bg-[#FAF8F3] border border-[#EDE8DF] rounded-2xl">
                <div className="flex items-center justify-between text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  <span>Live Discount Calculator</span>
                  <span className="text-[#083028]">Test with Order: ₹{testAmount}</span>
                </div>
                <input
                  type="range"
                  min="300"
                  max="5000"
                  step="100"
                  value={testAmount}
                  onChange={(e) => setTestAmount(Number(e.target.value))}
                  className="w-full accent-[#083028] cursor-pointer mb-2"
                />
                <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-200">
                  <span className="text-gray-500">
                    Order from: <strong>{applicableCategory}</strong>
                  </span>
                  <span className="text-emerald-700 font-bold">
                    Discount: -₹{simulatedDiscount} | Customer Pays: ₹{simulatedFinal}
                  </span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 bg-[#083028] hover:bg-[#051e19] text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingCoupon ? 'Save Changes' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
