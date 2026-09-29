'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, ArrowLeft, Mail, Phone, Calendar, ShoppingBag } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  orderCount?: number;
}

function formatDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getInitials(name: string) {
  if (!name) return 'U';
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch('/api/auth/users', { cache: 'no-store' });
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        const fetched: User[] = Array.isArray(data) ? data : [];
        setUsers(fetched);
      } catch {
        setError('Failed to load registered users from database.');
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <Users className="text-[#083028]" size={26} />
            Registered Customers
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? 'Loading users...' : `${users.length} registered customer${users.length !== 1 ? 's' : ''} in database`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-3.5 py-2 rounded-xl transition shadow-xs"
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </Link>
        </div>
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
      ) : users.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
          <Users size={48} className="mx-auto text-gray-300 mb-3" />
          <h3 className="text-base font-bold text-gray-800">No Registered Users in Database</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            When users register on your website, their account details and order history will show up here directly from Supabase.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#083028] text-white">
                <tr>
                  <th className="text-left px-5 py-3.5 font-semibold">#</th>
                  <th className="text-left px-5 py-3.5 font-semibold">Name</th>
                  <th className="text-left px-5 py-3.5 font-semibold">Email</th>
                  <th className="text-left px-5 py-3.5 font-semibold">Phone</th>
                  <th className="text-left px-5 py-3.5 font-semibold">Joined Date</th>
                  <th className="text-left px-5 py-3.5 font-semibold">Orders Placed</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, idx) => (
                  <tr
                    key={user.id}
                    className={`border-t border-gray-100 hover:bg-[#083028]/5 transition ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'
                    }`}
                  >
                    <td className="px-5 py-4 text-gray-400 font-mono text-xs">{idx + 1}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-[#083028] text-white text-xs font-bold flex items-center justify-center shrink-0">
                          {getInitials(user.name)}
                        </span>
                        <div>
                          <span className="font-semibold text-gray-800 block">{user.name}</span>
                          <span className="text-[11px] text-gray-400 font-mono">ID: {user.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600 font-medium">{user.email}</td>
                    <td className="px-5 py-4 text-gray-600">{user.phone || '—'}</td>
                    <td className="px-5 py-4 text-gray-600">{formatDate(user.createdAt)}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 bg-[#083028]/10 text-[#083028] text-xs font-semibold px-2.5 py-1 rounded-full">
                        <ShoppingBag size={12} />
                        {user.orderCount ?? 0} {user.orderCount === 1 ? 'order' : 'orders'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-[#083028] text-white text-sm font-bold flex items-center justify-center shrink-0">
                    {getInitials(user.name)}
                  </span>
                  <div>
                    <p className="font-semibold text-gray-800">{user.name}</p>
                    <p className="text-xs text-gray-400 font-mono truncate max-w-[180px]">{user.id}</p>
                  </div>
                  <span className="ml-auto inline-flex items-center gap-1 bg-[#083028]/10 text-[#083028] text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap">
                    <ShoppingBag size={11} />
                    {user.orderCount ?? 0} orders
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-gray-600 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <Mail size={13} className="text-[#B8860B] shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-[#B8860B] shrink-0" />
                    <span>{user.phone || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={13} className="text-[#B8860B] shrink-0" />
                    <span>Joined {formatDate(user.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
