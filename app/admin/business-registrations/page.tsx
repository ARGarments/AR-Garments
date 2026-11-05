'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  Store,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  X,
  Phone,
  Mail,
  MapPin,
  FileImage,
  ShoppingBag,
  Loader2,
  ExternalLink,
  RotateCcw,
  Trash2,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────
interface BusinessReg {
  id: string;
  full_name: string;
  mobile: string;
  applicant_email: string;
  shop_address: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  business_type: 'retail_store' | 'hawker';
  has_gstin: boolean;
  gstin: string;
  document_url: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string;
  created_at: string;
  reviewed_at: string | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function StatusBadge({ status }: { status: BusinessReg['status'] }) {
  const map = {
    pending:  { cls: 'bg-amber-50 text-amber-700 border-amber-200',  icon: <Clock size={12} />,        label: 'Pending' },
    approved: { cls: 'bg-green-50 text-green-700 border-green-200', icon: <CheckCircle2 size={12} />, label: 'Approved' },
    rejected: { cls: 'bg-red-50  text-red-700   border-red-200',    icon: <XCircle size={12} />,      label: 'Rejected' },
  }[status];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${map.cls}`}>
      {map.icon} {map.label}
    </span>
  );
}

// ── Detail Modal ─────────────────────────────────────────────────────────────
function DetailModal({
  reg,
  onClose,
  onUpdate,
}: {
  reg: BusinessReg;
  onClose: () => void;
  onUpdate: (id: string, status: 'approved' | 'rejected' | 'pending', note: string) => Promise<void>;
}) {
  const [note, setNote]                   = useState(reg.admin_note || '');
  const [busy, setBusy]                   = useState(false);
  const [action, setAction]               = useState<'approved' | 'rejected' | 'pending' | null>(null);
  const [mounted, setMounted]             = useState(false);
  const [docUrl, setDocUrl]               = useState(reg.document_url || '');
  const [deletingPhoto, setDeletingPhoto] = useState(false);

  useEffect(() => {
    setMounted(true);
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = origOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  async function handleAction(status: 'approved' | 'rejected' | 'pending') {
    setBusy(true);
    setAction(status);
    await onUpdate(reg.id, status, note);
    setBusy(false);
  }

  async function handleDeletePhoto() {
    if (!confirm('Are you sure you want to permanently delete this verification document from ImageKit cloud storage to free up space?')) {
      return;
    }
    setDeletingPhoto(true);
    try {
      const res = await fetch('/api/admin/business-registrations/cleanup-docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reg.id }),
      });
      if (res.ok) {
        setDocUrl('DELETED_MANUALLY');
      } else {
        alert('Failed to delete photo from storage.');
      }
    } catch {
      alert('Network error while deleting photo.');
    } finally {
      setDeletingPhoto(false);
    }
  }

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Review Business Application"
      onClick={onClose}
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl md:max-w-2xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden"
      >
        {/* Fixed Header — NEVER cut off */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#083028]/10 text-[#083028] flex items-center justify-center flex-shrink-0">
              <Store size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                  Application Review
                </h2>
                <StatusBadge status={reg.status} />
              </div>
              <p className="text-xs text-gray-500 truncate">
                {reg.full_name} • Applied on {formatDate(reg.created_at)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition flex-shrink-0 ml-2"
            title="Close (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
          {/* Personal Info & Business Details in 2 columns on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Personal Info */}
            <div className="bg-gray-50/80 border border-gray-100 rounded-xl p-3.5 space-y-2">
              <p className="text-[10px] font-bold text-[#083028] uppercase tracking-wider">
                Applicant Details
              </p>
              <div className="space-y-1.5 text-xs text-gray-700">
                <div className="font-semibold text-gray-900 text-sm">
                  {reg.full_name}
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={13} className="text-gray-400 flex-shrink-0" />
                  <a href={`tel:${reg.mobile}`} className="hover:text-[#083028] hover:underline font-mono">
                    {reg.mobile}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={13} className="text-gray-400 flex-shrink-0" />
                  <a href={`mailto:${reg.applicant_email}`} className="hover:text-[#083028] hover:underline truncate">
                    {reg.applicant_email}
                  </a>
                </div>
              </div>
            </div>

            {/* Business Details */}
            <div className="bg-gray-50/80 border border-gray-100 rounded-xl p-3.5 space-y-2">
              <p className="text-[10px] font-bold text-[#083028] uppercase tracking-wider">
                Business Type
              </p>
              <div className="space-y-2 text-xs text-gray-700">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={14} className="text-[#083028]" />
                  <span className="font-semibold text-gray-900">
                    {reg.business_type === 'retail_store' ? 'Retail Store Owner' : 'Hawker / Street Vendor'}
                  </span>
                </div>
                {reg.has_gstin && reg.gstin ? (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase font-semibold text-gray-500">GSTIN</span>
                    <span className="font-mono text-xs bg-white border border-gray-200 px-2 py-1 rounded-lg text-gray-900 tracking-wider">
                      {reg.gstin}
                    </span>
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-400 italic">No GSTIN provided</p>
                )}
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-gray-50/80 border border-gray-100 rounded-xl p-3.5 space-y-1.5">
            <p className="text-[10px] font-bold text-[#083028] uppercase tracking-wider">
              Business Address
            </p>
            <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-700">
              <MapPin size={15} className="text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-medium text-gray-900">{reg.shop_address}</p>
                {reg.landmark && (
                  <p className="text-xs text-gray-500">Landmark: {reg.landmark}</p>
                )}
                <p className="text-xs text-gray-600 font-medium">
                  {reg.city}, {reg.state} — <span className="font-mono">{reg.pincode}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Document Section with Storage Management */}
          <div className="bg-gray-50/80 border border-gray-100 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-[#083028] uppercase tracking-wider">
                Verification Document (Shop Front / Visiting Card / Pheri Photo)
              </p>
              {docUrl && docUrl.startsWith('http') && (
                <a
                  href={docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#083028] font-semibold hover:underline inline-flex items-center gap-1"
                >
                  Open Full Size <ExternalLink size={12} />
                </a>
              )}
            </div>

            {docUrl && docUrl.startsWith('http') ? (
              <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-white">
                <a href={docUrl} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={docUrl}
                    alt="Verification document"
                    className="w-full max-h-56 sm:max-h-64 object-contain bg-gray-950/5 mx-auto hover:opacity-95 transition cursor-zoom-in"
                  />
                </a>
                <div className="px-3 py-2 bg-gray-50/90 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                  <a
                    href={docUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#083028] font-bold hover:underline inline-flex items-center gap-1"
                  >
                    View High-Res <ExternalLink size={12} />
                  </a>
                  <button
                    type="button"
                    onClick={handleDeletePhoto}
                    disabled={deletingPhoto}
                    className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition text-xs font-medium"
                    title="Delete photo permanently to free ImageKit storage"
                  >
                    {deletingPhoto ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    Delete Photo (Free Storage)
                  </button>
                </div>
              </div>
            ) : docUrl?.startsWith('DELETED') ? (
              <div className="flex items-center gap-2.5 p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl text-emerald-800 text-xs">
                <ShieldCheck size={18} className="text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Document Photo Purged to Free Up Cloud Storage</p>
                  <p className="text-[11px] text-emerald-700/90 mt-0.5">
                    {docUrl === 'DELETED_AUTO_48H'
                      ? 'Auto-deleted after 48 hours per privacy and storage retention policy.'
                      : 'Manually deleted by admin after verification.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center p-6 border border-dashed border-gray-200 rounded-xl text-gray-400 text-xs">
                <FileImage size={16} className="mr-2" />
                <span>No verification document was attached</span>
              </div>
            )}
          </div>

          {/* Admin Note */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#083028] uppercase tracking-wider block">
              Admin Note / Remarks <span className="text-gray-400 font-normal">({reg.status === 'pending' ? 'Optional' : 'Editable'})</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder={
                reg.status === 'rejected'
                  ? 'Update rejection remarks or reason for reconsideration...'
                  : 'Add a remark or reason if rejecting/approving with comments...'
              }
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#083028] focus:bg-white resize-none transition"
            />
          </div>
        </div>

        {/* Fixed Footer with Action Buttons */}
        <div className="flex-shrink-0 px-5 sm:px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-gray-600 hover:bg-gray-200/80 transition"
          >
            Close
          </button>

          {reg.status === 'pending' ? (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleAction('rejected')}
                disabled={busy}
                className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 font-semibold text-xs sm:text-sm transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {busy && action === 'rejected' ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <XCircle size={15} />
                )}
                Reject
              </button>
              <button
                type="button"
                onClick={() => handleAction('approved')}
                disabled={busy}
                className="px-5 py-2 sm:px-6 sm:py-2.5 rounded-xl bg-[#083028] hover:bg-[#051e19] text-white font-semibold text-xs sm:text-sm transition flex items-center gap-1.5 disabled:opacity-50 shadow-md hover:shadow-lg"
              >
                {busy && action === 'approved' ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={15} />
                )}
                Approve Application
              </button>
            </div>
          ) : reg.status === 'rejected' ? (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleAction('approved')}
                disabled={busy}
                className="px-5 py-2 sm:px-6 sm:py-2.5 rounded-xl bg-[#083028] hover:bg-[#051e19] text-white font-semibold text-xs sm:text-sm transition flex items-center gap-1.5 disabled:opacity-50 shadow-md hover:shadow-lg"
              >
                {busy && action === 'approved' ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={15} />
                )}
                Approve Application
              </button>
            </div>
          ) : (
            <span className="text-xs text-emerald-700 font-medium">
              Approved on {reg.reviewed_at ? formatDate(reg.reviewed_at) : 'recently'}
            </span>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function AdminBusinessRegistrationsPage() {
  const [registrations, setRegistrations] = useState<BusinessReg[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [filter, setFilter]               = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selected, setSelected]           = useState<BusinessReg | null>(null);
  const [cleaningDocs, setCleaningDocs]   = useState(false);
  const [cleanupNotice, setCleanupNotice] = useState<string | null>(null);

  async function fetchRegistrations(statusFilter: typeof filter) {
    setLoading(true);
    setError(null);
    try {
      const url = statusFilter === 'all'
        ? '/api/admin/business-registrations'
        : `/api/admin/business-registrations?status=${statusFilter}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setRegistrations(Array.isArray(data) ? data : []);
    } catch {
      setError('Failed to load business registrations.');
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchRegistrations(filter); }, [filter]);

  async function handleUpdate(id: string, status: 'approved' | 'rejected' | 'pending', admin_note: string) {
    const res = await fetch('/api/admin/business-registrations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, admin_note }),
    });
    if (res.ok) {
      setSelected(null);
      fetchRegistrations(filter);
    }
  }

  async function handleAutoCleanup() {
    if (!confirm('Run auto-cleanup for all approved verification photos older than 48 hours? This frees up ImageKit cloud storage while keeping verification records intact.')) {
      return;
    }
    setCleaningDocs(true);
    try {
      const res = await fetch('/api/admin/business-registrations/cleanup-docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hoursOlderThan: 48 }),
      });
      const data = await res.json();
      if (res.ok) {
        setCleanupNotice(data.message || `Cleaned up ${data.purgedCount} photo(s).`);
        fetchRegistrations(filter);
        setTimeout(() => setCleanupNotice(null), 6000);
      } else {
        alert(data.error || 'Cleanup failed.');
      }
    } catch {
      alert('Network error while running cleanup.');
    } finally {
      setCleaningDocs(false);
    }
  }

  const counts = {
    all:      registrations.length,
    pending:  registrations.filter((r) => r.status === 'pending').length,
    approved: registrations.filter((r) => r.status === 'approved').length,
    rejected: registrations.filter((r) => r.status === 'rejected').length,
  };

  const tabs: { key: typeof filter; label: string; count: number; color: string }[] = [
    { key: 'all',      label: 'All',      count: counts.all,      color: 'bg-gray-100 text-gray-700' },
    { key: 'pending',  label: 'Pending',  count: counts.pending,  color: 'bg-amber-50 text-amber-700 border border-amber-200' },
    { key: 'approved', label: 'Approved', count: counts.approved, color: 'bg-green-50 text-green-700 border border-green-200' },
    { key: 'rejected', label: 'Rejected', count: counts.rejected, color: 'bg-red-50  text-red-700   border border-red-200' },
  ];

  return (
    <div className="space-y-6">
      {selected && (
        <DetailModal
          reg={selected}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <Store className="text-[#083028]" size={26} />
            Business Registrations
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? 'Loading...' : `${registrations.length} application${registrations.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleAutoCleanup}
            disabled={cleaningDocs}
            className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 px-3.5 py-2 rounded-xl transition shadow-xs disabled:opacity-50"
            title="Automatically delete verification photos of approved applications older than 48 hours to save cloud storage"
          >
            {cleaningDocs ? (
              <Loader2 size={14} className="animate-spin text-emerald-700" />
            ) : (
              <Sparkles size={14} className="text-emerald-700" />
            )}
            Auto-Clean 48h Photos
          </button>
          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-3.5 py-2 rounded-xl transition shadow-xs"
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </Link>
        </div>
      </div>

      {cleanupNotice && (
        <div className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl flex items-center gap-2">
          <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
          <span>{cleanupNotice}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map(({ key, label, count, color }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filter === key
                ? color + ' shadow-sm ring-2 ring-offset-1 ring-[#083028]/30'
                : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
            }`}
          >
            <span>{label}</span>
            <span className="text-[11px] opacity-75 bg-black/5 px-1.5 py-0.2 rounded-full font-mono">
              {count}
            </span>
          </button>
        ))}
      </div>

      {error && (
        <div className="text-xs bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2.5 rounded-xl">
          ⚠ {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="w-8 h-8 border-4 border-[#083028] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : registrations.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
          <Store size={48} className="mx-auto text-gray-300 mb-3" />
          <h3 className="text-base font-bold text-gray-800">No Registrations Found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {filter === 'pending'
              ? 'No pending applications right now.'
              : 'Business registration applications will appear here.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-left">
                  <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Applicant</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Type</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Location</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Applied On</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {registrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-gray-900 text-sm">{reg.full_name}</p>
                      <p className="text-xs text-gray-500">{reg.applicant_email}</p>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <span className="text-xs text-gray-600 capitalize">
                        {reg.business_type === 'retail_store' ? 'Retail Store' : 'Hawker'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-xs text-gray-600">{reg.city}, {reg.state}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={reg.status} />
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className="text-xs text-gray-500">{formatDate(reg.created_at)}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => setSelected(reg)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm ${
                          reg.status === 'rejected'
                            ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                            : 'bg-[#083028] hover:bg-[#051e19] text-white'
                        }`}
                        title={
                          reg.status === 'rejected'
                            ? 'Reopen and view review form'
                            : 'Review application'
                        }
                      >
                        {reg.status === 'rejected' ? (
                          <>
                            <RotateCcw size={12} />
                            Reopen Form
                          </>
                        ) : reg.status === 'approved' ? (
                          <>
                            <Eye size={13} />
                            View Details
                          </>
                        ) : (
                          <>
                            <Eye size={13} />
                            Review
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
