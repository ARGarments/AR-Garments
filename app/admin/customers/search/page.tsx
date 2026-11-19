'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Phone,
  Mail,
  User,
  MapPin,
  Calendar,
  ShoppingBag,
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Loader2,
  RotateCcw,
  ShieldCheck,
  Eye,
} from 'lucide-react';

interface CustomerResult {
  id: string;
  fullName: string;
  mobile: string;
  email: string;
  shopAddress: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  businessType: string;
  status: 'pending' | 'approved' | 'rejected' | string;
  createdAt: string;
  totalOrders: number;
}

function formatDate(iso: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function AdminCustomerSearchPage() {
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [customers, setCustomers] = useState<CustomerResult[]>([]);

  // Execute Search
  const handleSearch = async () => {
    const term = searchInput.trim();

    // 1. Empty search validation
    if (!term) {
      setValidationError('Please enter a mobile number or email address to search.');
      setSearched(false);
      setCustomers([]);
      setNotFound(false);
      return;
    }

    // 2. Validate input format
    const isEmail = term.includes('@');
    const isPhone = /^[0-9+\s-]{7,15}$/.test(term);

    if (isEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(term)) {
        setValidationError('Please enter a valid email address format (e.g. name@example.com).');
        return;
      }
    } else if (!isPhone) {
      setValidationError('Please enter a valid mobile number (at least 7 digits) or valid email address.');
      return;
    }

    setValidationError(null);
    setLoading(true);
    setSearched(true);
    setNotFound(false);

    try {
      const res = await fetch(`/api/admin/customers/search?q=${encodeURIComponent(term)}&_t=${Date.now()}`, {
        cache: 'no-store',
      });
      const data = await res.json();

      if (!res.ok) {
        setValidationError(data.error || 'Failed to search customer. Please verify credentials.');
        setCustomers([]);
        setNotFound(false);
      } else if (!data.found || !data.customers || data.customers.length === 0) {
        setNotFound(true);
        setCustomers([]);
      } else {
        setNotFound(false);
        setCustomers(data.customers);
      }
    } catch {
      setValidationError('Network error. Failed to connect to server.');
      setCustomers([]);
      setNotFound(false);
    } finally {
      setLoading(false);
    }
  };

  // Reset / Clear button
  const handleReset = () => {
    setSearchInput('');
    setValidationError(null);
    setSearched(false);
    setNotFound(false);
    setCustomers([]);
  };

  const getStatusBadge = (status: string) => {
    const st = (status || '').toLowerCase();
    if (st === 'approved' || st === 'active') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 size={12} /> Active
        </span>
      );
    }
    if (st === 'rejected' || st === 'inactive') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
          <XCircle size={12} /> Inactive
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock size={12} /> Pending Approval
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mt-0.5">
            <Search className="text-[#083028]" size={24} />
            Customer Search
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Instantly search and retrieve registered customer details by registered Phone Number or Email ID.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
            <ShieldCheck size={14} /> Admin Authorized
          </span>
        </div>
      </div>

      {/* ── Search Box Card ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Search size={16} className="text-[#083028]" />
            Search Customer
          </h2>
          {searched && (
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-semibold text-gray-500 hover:text-gray-800 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-gray-100 transition"
            >
              <RotateCcw size={12} /> Clear / Reset
            </button>
          )}
        </div>

        {/* Unified Search Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="Search by Mobile number or Email address..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#083028] focus:border-transparent text-sm transition"
            />
            <Search className="absolute left-3.5 top-3.5 text-gray-400" size={17} />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#083028] hover:bg-[#0c4035] text-white text-sm font-bold shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search size={16} />
                  Search
                </>
              )}
            </button>
            {searchInput && (
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-3 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm font-semibold transition"
              >
                Clear
              </button>
            )}
          </div>
        </form>

        {/* Validation Error Banner */}
        {validationError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-700 animate-in fade-in duration-150">
            <AlertCircle size={15} className="flex-shrink-0 text-red-600" />
            <span>{validationError}</span>
          </div>
        )}
      </div>

      {/* ── Loading State ───────────────────────────────────────────────────── */}
      {loading && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-xs">
          <Loader2 size={32} className="animate-spin text-[#083028] mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-800">Retrieving Customer Information...</p>
          <p className="text-xs text-gray-500 mt-1">Searching database for phone or email matches.</p>
        </div>
      )}

      {/* ── No Customer Found ───────────────────────────────────────────────── */}
      {!loading && searched && notFound && (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center shadow-xs space-y-3">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">No Customer Found</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
              No registered customer record matched <span className="font-semibold text-gray-800">&quot;{searchInput}&quot;</span>.
              Please check the phone number or email spelling and try again.
            </p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
          >
            <RotateCcw size={12} /> Try Another Search
          </button>
        </div>
      )}

      {/* ── Results Found: Profile & Detailed Table ─────────────────────────── */}
      {!loading && searched && customers.length > 0 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Profile Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <User size={16} className="text-[#083028]" />
                Customer Profile ({customers.length})
              </h2>
              <span className="text-xs text-gray-500 font-medium">
                Retrieved instantly ⚡
              </span>
            </div>

            {customers.map((cust) => (
              <div
                key={cust.id}
                className="bg-white rounded-2xl border-2 border-emerald-100 hover:border-emerald-300 shadow-sm p-6 space-y-5 transition"
              >
                {/* Header row with avatar and basic info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-emerald-50 border-2 border-emerald-200 text-[#083028] flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-xs">
                      {cust.fullName ? cust.fullName[0].toUpperCase() : 'C'}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 leading-tight">
                        {cust.fullName || '—'}
                      </h3>
                      <p className="text-xs font-mono text-gray-500 mt-0.5">
                        Customer ID: <span className="font-semibold text-emerald-900">#{cust.id.slice(0, 8)}</span>
                      </p>
                    </div>
                  </div>
                  <div>{getStatusBadge(cust.status)}</div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-3.5 gap-x-6 text-xs">
                  <div>
                    <span className="text-gray-500 font-medium block">Phone:</span>
                    <span className="font-bold text-gray-900 flex items-center gap-1.5 mt-0.5">
                      <Phone size={13} className="text-[#083028]" />
                      {cust.mobile || '—'}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-500 font-medium block">Email:</span>
                    <span className="font-bold text-gray-900 flex items-center gap-1.5 mt-0.5">
                      <Mail size={13} className="text-[#083028]" />
                      {cust.email || '—'}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-500 font-medium block">Business Type:</span>
                    <span className="font-bold text-gray-900 flex items-center gap-1.5 mt-0.5">
                      <Building2 size={13} className="text-[#083028]" />
                      {cust.businessType || '—'}
                    </span>
                  </div>

                  <div className="sm:col-span-2">
                    <span className="text-gray-500 font-medium block">Shop Address:</span>
                    <span className="font-semibold text-gray-800 flex items-start gap-1.5 mt-0.5">
                      <MapPin size={13} className="text-[#083028] mt-0.5 flex-shrink-0" />
                      {cust.shopAddress}
                      {cust.landmark ? `, ${cust.landmark}` : ''}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-500 font-medium block">City & State:</span>
                    <span className="font-bold text-gray-900 mt-0.5 block">
                      {cust.city}, {cust.state} {cust.pincode ? `(${cust.pincode})` : ''}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-500 font-medium block">Registered Date:</span>
                    <span className="font-bold text-gray-900 flex items-center gap-1.5 mt-0.5">
                      <Calendar size={13} className="text-[#083028]" />
                      {formatDate(cust.createdAt)}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-500 font-medium block">Total Orders:</span>
                    <span className="font-black text-[#083028] text-sm flex items-center gap-1.5 mt-0.5">
                      <ShoppingBag size={14} />
                      {cust.totalOrders} {cust.totalOrders === 1 ? 'Order' : 'Orders'}
                    </span>
                  </div>
                </div>

                {/* Profile Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-gray-100">
                  <Link
                    href={`/admin/orders?search=${encodeURIComponent(cust.mobile || cust.email)}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#083028] text-white hover:bg-[#0c4035] transition shadow-xs"
                  >
                    <ShoppingBag size={13} /> View Order History
                  </Link>

                  <Link
                    href={`/admin/business-registrations?search=${encodeURIComponent(cust.mobile || cust.email)}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                  >
                    <Eye size={13} /> View Full Registration
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Full Customer Details Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Customer Details Table
              </h3>
              <span className="text-[11px] text-gray-500">
                {customers.length} record{customers.length !== 1 ? 's' : ''} found
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100/70 border-b border-gray-200 text-gray-600 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Full Name</th>
                    <th className="px-4 py-3">Mobile</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Shop Address</th>
                    <th className="px-4 py-3">City</th>
                    <th className="px-4 py-3">State</th>
                    <th className="px-4 py-3">Business Type</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/80 transition">
                      <td className="px-4 py-3 font-mono font-bold text-gray-800">
                        #{c.id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900 whitespace-nowrap">
                        {c.fullName || '—'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">
                        {c.mobile || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {c.email || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={c.shopAddress}>
                        {c.shopAddress || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">
                        {c.city || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">
                        {c.state || '—'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#083028] whitespace-nowrap">
                        {c.businessType || '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getStatusBadge(c.status)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {formatDate(c.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
