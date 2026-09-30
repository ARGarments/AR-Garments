'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Star,
  Search,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ExternalLink,
  Filter,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';

interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userEmail: string;
  rating: number;
  title?: string;
  comment: string;
  status: 'approved' | 'pending' | 'rejected';
  createdAt: string;
}

export default function AdminReviewsPage() {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const showToast = (msg: string, isError = false) => {
    if (isError) {
      toast.error(msg, { title: 'Reviews' });
    } else {
      toast.success(msg, { title: 'Reviews' });
    }
  };

  const loadReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reviews?all=true', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setReviews(Array.isArray(data?.reviews) ? data.reviews : []);
      }
    } catch {
      showToast('Could not load reviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleStatusChange = async (id: string, newStatus: 'approved' | 'rejected' | 'pending') => {
    setUpdatingId(id);
    try {
      const res = await fetch('/api/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        showToast(`Review marked as ${newStatus}`);
        setReviews((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
        );
      } else {
        showToast('Failed to update review status');
      }
    } catch {
      showToast('Error updating review status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this review?')) return;
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/reviews?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showToast('Review deleted successfully');
        setReviews((prev) => prev.filter((r) => r.id !== id));
      } else {
        showToast('Failed to delete review');
      }
    } catch {
      showToast('Error deleting review');
    } finally {
      setUpdatingId(null);
    }
  };

  // Stats calculation
  const totalCount = reviews.length;
  const approvedCount = reviews.filter((r) => r.status === 'approved').length;
  const pendingCount = reviews.filter((r) => r.status === 'pending').length;
  const avgRating =
    totalCount > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalCount).toFixed(1)
      : '0.0';

  // Filtering
  const filteredReviews = reviews.filter((r) => {
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      r.userName.toLowerCase().includes(query) ||
      r.userEmail.toLowerCase().includes(query) ||
      r.comment.toLowerCase().includes(query) ||
      (r.title && r.title.toLowerCase().includes(query)) ||
      r.productId.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <Star className="w-7 h-7 text-[#B8860B] fill-amber-400" />
            Product Reviews Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Review customer feedback, moderate ratings, and oversee product reputations.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Total Reviews</p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">{totalCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Average Rating</p>
          <div className="flex items-center gap-1.5 mt-1">
            <Star size={20} className="text-amber-500 fill-amber-400" />
            <span className="text-2xl font-extrabold text-gray-900">{avgRating}</span>
            <span className="text-xs text-gray-400">/ 5.0</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Approved</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{approvedCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Pending</p>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">{pendingCount}</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer, product ID, or comment..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083028]/20 focus:border-[#083028] transition"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl text-xs font-semibold">
          {(['all', 'approved', 'pending', 'rejected'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg capitalize transition ${
                statusFilter === st
                  ? 'bg-white text-[#083028] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews Table / List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-[#083028] animate-spin" />
            <p className="text-sm text-gray-500">Loading reviews from database...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="p-16 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800">No reviews found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all'
                ? 'No reviews match your filters.'
                : 'Customer reviews will appear here as buyers review items.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-[#FAF8F3] text-xs uppercase font-bold text-[#083028] border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Rating</th>
                  <th className="px-6 py-4">Review Content</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredReviews.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/70 transition">
                    {/* Product */}
                    <td className="px-6 py-4 align-top">
                      <Link
                        href={`/product/${r.productId}`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-[#083028] hover:text-[#B8860B] transition-colors bg-gray-100 px-2 py-1 rounded"
                      >
                        <span>{r.productId}</span>
                        <ExternalLink size={11} />
                      </Link>
                    </td>

                    {/* Customer */}
                    <td className="px-6 py-4 align-top">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{r.userName}</p>
                        <p className="text-xs text-gray-400">{r.userEmail || '—'}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {new Date(r.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </td>

                    {/* Rating */}
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-center gap-1 text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={i < r.rating ? 'fill-amber-400 text-amber-500' : 'text-gray-200'}
                          />
                        ))}
                        <span className="ml-1 text-xs font-bold text-gray-700">{r.rating}/5</span>
                      </div>
                    </td>

                    {/* Content */}
                    <td className="px-6 py-4 max-w-md align-top">
                      {r.title && (
                        <p className="font-bold text-gray-900 text-xs mb-1">
                          &quot;{r.title}&quot;
                        </p>
                      )}
                      <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {r.comment}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 text-center align-top">
                      {r.status === 'approved' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle size={12} /> Approved
                        </span>
                      )}
                      {r.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock size={12} /> Pending
                        </span>
                      )}
                      {r.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
                          <XCircle size={12} /> Rejected
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right align-top">
                      <div className="flex items-center justify-end gap-2">
                        {r.status !== 'approved' && (
                          <button
                            onClick={() => handleStatusChange(r.id, 'approved')}
                            disabled={updatingId === r.id}
                            title="Approve Review"
                            className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition"
                          >
                            Approve
                          </button>
                        )}
                        {r.status !== 'rejected' && (
                          <button
                            onClick={() => handleStatusChange(r.id, 'rejected')}
                            disabled={updatingId === r.id}
                            title="Reject Review"
                            className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg transition"
                          >
                            Reject
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(r.id)}
                          disabled={updatingId === r.id}
                          title="Delete Review"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
