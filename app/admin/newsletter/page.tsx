'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Mail,
  ArrowLeft,
  Search,
  Trash2,
  Copy,
  CheckCircle,
  Download,
  Calendar,
  RefreshCw,
  Users,
  Check,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';

interface Subscriber {
  id: string;
  email: string;
  status: 'active' | 'unsubscribed';
  createdAt: string;
}

function formatDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminNewsletterPage() {
  const { toast } = useToast();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const showToast = (msg: string, isError = false) => {
    if (isError) {
      toast.error(msg, { title: 'Newsletter' });
    } else {
      toast.success(msg, { title: 'Newsletter' });
    }
  };

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/newsletter', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setSubscribers(Array.isArray(data.subscribers) ? data.subscribers : []);
      }
    } catch {
      showToast('Failed to load newsletter subscribers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Are you sure you want to remove ${email} from the newsletter list?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/newsletter?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showToast(`Removed ${email}`);
        setSubscribers((prev) => prev.filter((s) => s.id !== id));
      } else {
        showToast('Failed to remove subscriber');
      }
    } catch {
      showToast('Error removing subscriber');
    }
  };

  const copyEmail = (email: string, id: string) => {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    showToast(`Copied ${email}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyAllEmails = () => {
    if (subscribers.length === 0) return;
    const all = subscribers.map((s) => s.email).join(', ');
    navigator.clipboard.writeText(all);
    setCopiedAll(true);
    showToast(`Copied ${subscribers.length} email addresses`);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const exportCSV = () => {
    if (subscribers.length === 0) return;
    const headers = 'ID,Email,Status,SubscribedAt\n';
    const rows = subscribers
      .map((s) => `"${s.id}","${s.email}","${s.status}","${s.createdAt}"`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `newsletter_subscribers_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Exported CSV successfully');
  };

  const filtered = subscribers.filter((s) =>
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <Mail className="text-[#083028]" size={26} />
            Newsletter Subscribers
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            View and manage emails collected from the &ldquo;Join Our Fashion Family&rdquo; footer form.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={fetchSubscribers}
            className="flex items-center gap-1.5 text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-3.5 py-2 rounded-xl transition shadow-xs"
            title="Refresh list"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={copyAllEmails}
            disabled={subscribers.length === 0}
            className="flex items-center gap-1.5 text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-3.5 py-2 rounded-xl transition shadow-xs disabled:opacity-50"
          >
            {copiedAll ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
            {copiedAll ? 'Copied!' : 'Copy All Emails'}
          </button>
          <button
            onClick={exportCSV}
            disabled={subscribers.length === 0}
            className="flex items-center gap-1.5 text-xs font-semibold bg-[#083028] hover:bg-[#051e19] text-white px-4 py-2 rounded-xl transition shadow-xs disabled:opacity-50"
          >
            <Download size={13} />
            Export CSV
          </button>
          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-3.5 py-2 rounded-xl transition shadow-xs"
          >
            <ArrowLeft size={14} />
            Back
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#083028]/10 text-[#083028] flex items-center justify-center shrink-0">
            <Mail size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Subscribers</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{subscribers.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Status</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">
              {subscribers.filter((s) => s.status === 'active').length}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#B8860B]/10 text-[#B8860B] flex items-center justify-center shrink-0">
            <Users size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Storage Target</p>
            <p className="text-sm font-bold text-gray-800 mt-1">Supabase DB + Memory</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subscribers by email..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083028]/20 focus:border-[#083028] transition"
          />
        </div>
        <p className="text-xs text-gray-500 font-medium">
          Showing {filtered.length} of {subscribers.length} subscriber{subscribers.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Subscribers Table */}
      {loading ? (
        <div className="flex justify-center items-center h-48 bg-white rounded-2xl border border-gray-100 shadow-xs">
          <div className="w-8 h-8 border-4 border-[#083028] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-xs">
          <Mail size={48} className="mx-auto text-gray-300 mb-3" />
          <h3 className="text-base font-bold text-gray-800">
            {searchQuery ? 'No matching subscribers found' : 'No Subscribers Yet'}
          </h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No email matched "${searchQuery}". Try a different keyword.`
              : 'When visitors enter their email into the "Join Our Fashion Family" form, their email will show up here.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#083028] text-white">
              <tr>
                <th className="text-left px-5 py-3.5 font-semibold text-xs">#</th>
                <th className="text-left px-5 py-3.5 font-semibold text-xs">Email Address</th>
                <th className="text-left px-5 py-3.5 font-semibold text-xs">Status</th>
                <th className="text-left px-5 py-3.5 font-semibold text-xs">Subscribed Date</th>
                <th className="text-right px-5 py-3.5 font-semibold text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((subscriber, idx) => (
                <tr
                  key={subscriber.id}
                  className={`border-t border-gray-100 hover:bg-[#083028]/5 transition ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  }`}
                >
                  <td className="px-5 py-4 text-gray-400 font-mono text-xs">{idx + 1}</td>
                  <td className="px-5 py-4 font-semibold text-gray-800">
                    <div className="flex items-center gap-2">
                      <span>{subscriber.email}</span>
                      <button
                        onClick={() => copyEmail(subscriber.email, subscriber.id)}
                        className="text-gray-400 hover:text-gray-700 transition p-1 rounded"
                        title="Copy email"
                      >
                        {copiedId === subscriber.id ? (
                          <Check size={12} className="text-emerald-600" />
                        ) : (
                          <Copy size={12} />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-500 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-[#B8860B]" />
                      <span>{formatDate(subscriber.createdAt)}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => handleDelete(subscriber.id, subscriber.email)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Remove subscriber"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
