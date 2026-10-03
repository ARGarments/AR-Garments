'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Search,
  Trash2,
  Mail,
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  Copy,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  Send,
  User,
  X,
  FileText,
  Inbox,
  Sparkles,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { ContactMessage, ContactStatus } from '@/lib/contactMessages';

const STATUS_CONFIG: Record<
  ContactStatus,
  { label: string; badgeCls: string; dotCls: string }
> = {
  unread: {
    label: 'Unread',
    badgeCls: 'bg-rose-50 text-rose-700 border-rose-200',
    dotCls: 'bg-rose-500',
  },
  read: {
    label: 'Read',
    badgeCls: 'bg-blue-50 text-blue-700 border-blue-200',
    dotCls: 'bg-blue-500',
  },
  replied: {
    label: 'Replied',
    badgeCls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotCls: 'bg-emerald-500',
  },
  archived: {
    label: 'Archived',
    badgeCls: 'bg-gray-100 text-gray-600 border-gray-200',
    dotCls: 'bg-gray-400',
  },
};

export default function AdminContactsPage() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ContactStatus>('all');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [adminNotesInput, setAdminNotesInput] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/contact', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      }
    } catch {
      toast.error('Failed to load customer queries', { title: 'Network Error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  // Sync admin notes when selecting a message
  useEffect(() => {
    if (selectedMessage) {
      setAdminNotesInput(selectedMessage.adminNotes || '');
    }
  }, [selectedMessage]);

  // Update status (optimistic + API)
  const handleStatusChange = async (id: string, newStatus: ContactStatus) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
    );
    if (selectedMessage && selectedMessage.id === id) {
      setSelectedMessage((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    toast.info(`Marked query as "${STATUS_CONFIG[newStatus].label}"`, {
      title: 'Status Updated',
    });

    try {
      await fetch('/api/contact', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
    } catch {
      toast.error('Failed to update status on server');
    }
  };

  // Save admin notes
  const handleSaveNotes = async () => {
    if (!selectedMessage) return;
    setSavingNotes(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedMessage.id,
          adminNotes: adminNotesInput,
        }),
      });

      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === selectedMessage.id ? { ...m, adminNotes: adminNotesInput } : m
          )
        );
        setSelectedMessage((prev) =>
          prev ? { ...prev, adminNotes: adminNotesInput } : null
        );
        toast.success('Admin notes saved successfully!', { title: 'Notes Saved' });
      } else {
        throw new Error('Save failed');
      }
    } catch {
      toast.error('Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  // Delete message
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete inquiry from "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/contact?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== id));
        if (selectedMessage?.id === id) {
          setSelectedMessage(null);
        }
        toast.success(`Inquiry from ${name} deleted successfully`, {
          title: 'Query Deleted',
        });
      } else {
        throw new Error('Delete failed');
      }
    } catch {
      toast.error('Failed to delete query');
    }
  };

  // Copy helper
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} to clipboard!`, { title: 'Copied' });
  };

  // Filtering
  const filteredMessages = useMemo(() => {
    return messages.filter((m) => {
      const matchesStatus =
        statusFilter === 'all' ? true : m.status === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.phone && m.phone.toLowerCase().includes(q)) ||
        m.subject.toLowerCase().includes(q) ||
        m.message.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [messages, statusFilter, searchQuery]);

  const counts = useMemo(() => {
    return {
      total: messages.length,
      unread: messages.filter((m) => m.status === 'unread').length,
      read: messages.filter((m) => m.status === 'read').length,
      replied: messages.filter((m) => m.status === 'replied').length,
    };
  }, [messages]);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <MessageSquare className="text-[#083028]" size={26} />
            Customer Inquiries &amp; Messages
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            View, track, and respond to direct customer messages submitted via the Contact page.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchMessages}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 text-xs font-semibold hover:bg-gray-50 shadow-xs transition"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <Link
            href="/contact"
            target="_blank"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#083028] text-white text-xs font-semibold hover:bg-[#051e19] shadow-xs transition"
          >
            <ExternalLink size={14} />
            Open Contact Form ↗
          </Link>
        </div>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Inquiries</p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">{counts.total}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">All customer messages</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs bg-rose-50/20">
          <p className="text-xs font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            Unread Queries
          </p>
          <p className="text-2xl font-extrabold text-rose-700 mt-1">{counts.unread}</p>
          <p className="text-[11px] text-rose-600/80 mt-0.5">Awaiting staff response</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-xs">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Reviewed / Read</p>
          <p className="text-2xl font-extrabold text-blue-700 mt-1">{counts.read}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Seen by support team</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-xs">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Replied</p>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1">{counts.replied}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Resolved inquiries</p>
        </div>
      </div>

      {/* SEARCH & FILTER CONTROLS */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer name, email, phone, subject, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083028]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(['all', 'unread', 'read', 'replied', 'archived'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-[#083028] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {st === 'all' ? `All (${counts.total})` : `${st} (${messages.filter((m) => m.status === st).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* MESSAGES LIST / TABLE */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <RefreshCw size={28} className="animate-spin text-[#083028]" />
            <p className="text-sm font-medium text-gray-500">Loading customer inquiries...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
              <Inbox size={26} />
            </div>
            <p className="text-base font-bold text-gray-800">No customer messages found</p>
            <p className="text-xs text-gray-500 max-w-sm">
              {searchQuery
                ? 'No inquiries match your current search query.'
                : 'When customers submit the Contact Us form, their messages and inquiries will appear here.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 text-xs font-semibold text-[#083028] underline"
              >
                Clear Search Filter
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/70 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Subject &amp; Query</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Date Received</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMessages.map((msg) => {
                  const cfg = STATUS_CONFIG[msg.status] || STATUS_CONFIG.unread;
                  const isUnread = msg.status === 'unread';

                  return (
                    <tr
                      key={msg.id}
                      onClick={() => setSelectedMessage(msg)}
                      className={`hover:bg-gray-50/80 transition-colors cursor-pointer ${
                        isUnread ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      {/* Customer Info */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#083028]/10 text-[#083028] font-bold text-xs flex items-center justify-center shrink-0">
                            {msg.name[0]?.toUpperCase() || 'U'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                              {msg.name}
                              {isUnread && (
                                <span className="w-2 h-2 rounded-full bg-rose-500" title="Unread" />
                              )}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{msg.email}</p>
                            {msg.phone && (
                              <p className="text-[11px] text-gray-400 font-mono mt-0.5">{msg.phone}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Subject & Snippet */}
                      <td className="px-4 py-4 max-w-md">
                        <span className="inline-block text-[11px] font-bold text-[#083028] bg-[#083028]/10 px-2 py-0.5 rounded-md mb-1">
                          {msg.subject}
                        </span>
                        <p className="text-xs text-gray-700 line-clamp-2 leading-relaxed">
                          {msg.message}
                        </p>
                        {msg.adminNotes && (
                          <p className="text-[11px] text-amber-700 font-medium mt-1 flex items-center gap-1">
                            <FileText size={11} /> Note: {msg.adminNotes}
                          </p>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center"
                        >
                          <select
                            value={msg.status}
                            onChange={(e) =>
                              handleStatusChange(msg.id, e.target.value as ContactStatus)
                            }
                            className={`text-xs font-bold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#083028]/20 ${cfg.badgeCls}`}
                          >
                            <option value="unread">🔴 Unread</option>
                            <option value="read">🔵 Read</option>
                            <option value="replied">🟢 Replied</option>
                            <option value="archived">⚪ Archived</option>
                          </select>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-4 text-xs text-gray-500 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock size={12} className="text-gray-400" />
                          <span>{formatDate(msg.createdAt)}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5"
                        >
                          {/* Direct email reply */}
                          <a
                            href={`mailto:${msg.email}?subject=${encodeURIComponent(
                              `Re: ${msg.subject} - AR Garment Support`
                            )}`}
                            title="Reply via Email"
                            className="p-1.5 text-gray-500 hover:text-[#083028] hover:bg-gray-100 rounded-lg transition"
                          >
                            <Mail size={15} />
                          </a>

                          {/* Quick details view */}
                          <button
                            onClick={() => setSelectedMessage(msg)}
                            title="View Full Query"
                            className="px-2.5 py-1 text-xs font-semibold text-[#083028] bg-[#083028]/10 hover:bg-[#083028]/20 rounded-lg transition"
                          >
                            View
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(msg.id, msg.name)}
                            title="Delete Inquiry"
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
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

      {/* QUERY DETAILS MODAL */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#083028] text-white flex items-center justify-center font-bold text-lg">
                  {selectedMessage.name[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedMessage.name}</h3>
                  <p className="text-xs text-gray-500">
                    Received: {formatDate(selectedMessage.createdAt)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedMessage(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Details */}
            <div className="py-5 space-y-4">
              {/* Contact info badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Email Address</p>
                    <p className="text-xs font-semibold text-gray-800 truncate">
                      {selectedMessage.email}
                    </p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(selectedMessage.email, 'email')}
                    className="p-1 text-gray-400 hover:text-gray-700"
                    title="Copy Email"
                  >
                    <Copy size={13} />
                  </button>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Phone Number</p>
                    <p className="text-xs font-semibold text-gray-800 truncate">
                      {selectedMessage.phone || 'Not provided'}
                    </p>
                  </div>
                  {selectedMessage.phone && (
                    <button
                      onClick={() => copyToClipboard(selectedMessage.phone || '', 'phone')}
                      className="p-1 text-gray-400 hover:text-gray-700"
                      title="Copy Phone"
                    >
                      <Copy size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Inquiry Subject */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Inquiry Subject
                </p>
                <span className="inline-block text-xs font-bold text-[#083028] bg-[#083028]/10 px-3 py-1 rounded-lg">
                  {selectedMessage.subject}
                </span>
              </div>

              {/* Full Message Box */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Customer Message
                </p>
                <div className="p-4 bg-[#FAF8F3] rounded-2xl border border-amber-900/10 text-xs sm:text-sm text-gray-800 leading-relaxed font-serif whitespace-pre-wrap">
                  {selectedMessage.message}
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                  Status
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['unread', 'read', 'replied', 'archived'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleStatusChange(selectedMessage.id, st)}
                      className={`py-2 text-xs font-bold rounded-xl border transition capitalize ${
                        selectedMessage.status === st
                          ? 'bg-[#083028] text-white border-[#083028]'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Internal Admin Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 flex items-center justify-between">
                  <span>Internal Staff Notes</span>
                  <span className="text-[10px] text-gray-400 font-normal">Only visible to admin</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Called customer on phone, resolved color preference, follow up on Friday..."
                  value={adminNotesInput}
                  onChange={(e) => setAdminNotesInput(e.target.value)}
                  className="w-full p-3 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083028]"
                />
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="mt-2 text-xs font-semibold bg-gray-900 text-white px-3.5 py-1.5 rounded-lg hover:bg-black transition disabled:opacity-50"
                >
                  {savingNotes ? 'Saving Notes...' : 'Save Notes'}
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
              <a
                href={`mailto:${selectedMessage.email}?subject=${encodeURIComponent(
                  `Re: ${selectedMessage.subject} - AR Garment Support`
                )}`}
                className="inline-flex items-center gap-2 bg-[#083028] hover:bg-[#051e19] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-xs"
              >
                <Send size={14} />
                Reply to Customer via Email
              </a>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDelete(selectedMessage.id, selectedMessage.name)}
                  className="px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition"
                >
                  Delete
                </button>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl border border-gray-200 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
