'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  MapPin,
  ShoppingBag,
  LogOut,
  CheckCircle,
  Package,
  Truck,
  XCircle,
  Clock,
  ChevronRight,
  Save,
  Home,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'profile' | 'address' | 'orders';

interface Address {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
}

interface OrderItem {
  name: string;
  quantity: number;
  price?: number;
}

interface Order {
  id: string;
  createdAt: string;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  items: OrderItem[];
  total: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh',
];

const ADDRESS_KEY = 'ar_user_address';

const EMPTY_ADDRESS: Address = {
  fullName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  pincode: '',
};

const STATUS_CONFIG: Record<
  Order['status'],
  { label: string; classes: string; icon: React.ReactNode }
> = {
  Pending: {
    label: 'Pending',
    classes: 'bg-orange-100 text-orange-700',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  Processing: {
    label: 'Processing',
    classes: 'bg-amber-100 text-amber-700',
    icon: <Package className="w-3.5 h-3.5" />,
  },
  Shipped: {
    label: 'Shipped',
    classes: 'bg-blue-100 text-blue-700',
    icon: <Truck className="w-3.5 h-3.5" />,
  },
  Delivered: {
    label: 'Delivered',
    classes: 'bg-green-100 text-green-700',
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  Cancelled: {
    label: 'Cancelled',
    classes: 'bg-red-100 text-red-700',
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
};

// ─── Tab definition ───────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'profile', label: 'My Profile', icon: <User className="w-4 h-4" /> },
  { id: 'address', label: 'My Address', icon: <MapPin className="w-4 h-4" /> },
  { id: 'orders', label: 'My Orders', icon: <ShoppingBag className="w-4 h-4" /> },
];

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-[#083028] text-white px-5 py-3 rounded-xl shadow-lg animate-fade-in-up text-sm font-medium">
      <CheckCircle className="w-4 h-4 text-[#B8860B]" />
      {message}
    </div>
  );
}

// ─── Profile Section ──────────────────────────────────────────────────────────

function ProfileSection({ user }: { user: { name?: string; email?: string } }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
      <h2 className="text-lg font-semibold text-[#083028] mb-6 flex items-center gap-2">
        <User className="w-5 h-5 text-[#B8860B]" />
        My Profile
      </h2>

      {/* Avatar */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-8">
        <div className="w-20 h-20 rounded-full bg-[#083028]/10 flex items-center justify-center shrink-0">
          <span className="text-3xl font-bold text-[#083028]">
            {(user.name?.[0] ?? user.email?.[0] ?? 'U').toUpperCase()}
          </span>
        </div>
        <div className="text-center sm:text-left">
          <p className="text-xl font-semibold text-gray-800">{user.name ?? 'AR Garment User'}</p>
          <p className="text-sm text-gray-500 mt-0.5">{user.email ?? '—'}</p>
          <span className="inline-block mt-2 text-xs bg-[#083028]/10 text-[#083028] font-medium px-3 py-1 rounded-full">
            Verified Member
          </span>
        </div>
      </div>

      {/* Info Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InfoField label="Full Name" value={user.name ?? '—'} />
        <InfoField label="Email Address" value={user.email ?? '—'} />
        <InfoField label="Account Type" value="Customer" />
        <InfoField label="Member Since" value="2026" />
      </div>

      <p className="mt-6 text-xs text-gray-400">
        * To update profile details, please contact support.
      </p>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#FAF8F3] border border-gray-100 px-4 py-3">
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-800 truncate">{value}</p>
    </div>
  );
}

// ─── Address Section ──────────────────────────────────────────────────────────

function AddressSection({
  userId,
  onToast,
}: {
  userId: string;
  onToast: (msg: string) => void;
}) {
  const [form, setForm] = useState<Address>(EMPTY_ADDRESS);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load from DB first, then fallback to localStorage
  useEffect(() => {
    let isMounted = true;

    async function loadAddress() {
      try {
        const res = await fetch(`/api/user/address?userId=${encodeURIComponent(userId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.address && isMounted) {
            setForm({
              fullName: data.address.fullName || '',
              phone: data.address.phone || '',
              addressLine1: data.addressLine1 || data.address.addressLine1 || '',
              addressLine2: data.addressLine2 || data.address.addressLine2 || '',
              city: data.address.city || '',
              state: data.address.state || '',
              pincode: data.address.pincode || '',
            });
            localStorage.setItem(ADDRESS_KEY, JSON.stringify(data.address));
            setLoading(false);
            return;
          }
        }
      } catch {
        // fallback to localStorage
      }

      // Check localStorage
      try {
        const stored = localStorage.getItem(ADDRESS_KEY);
        if (stored && isMounted) {
          const parsed = JSON.parse(stored) as Address;
          setForm(parsed);
        }
      } catch {
        // ignore
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (userId) {
      loadAddress();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // 1. Save to Database via API
      const res = await fetch('/api/user/address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          fullName: form.fullName,
          phone: form.phone,
          addressLine1: form.addressLine1,
          addressLine2: form.addressLine2,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
        }),
      });

      // 2. Also keep localStorage in sync
      localStorage.setItem(ADDRESS_KEY, JSON.stringify(form));

      if (res.ok) {
        onToast('Address saved to database successfully!');
      } else {
        onToast('Address saved locally!');
      }
    } catch {
      localStorage.setItem(ADDRESS_KEY, JSON.stringify(form));
      onToast('Address saved locally!');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to remove your saved address?')) return;
    setSaving(true);
    try {
      await fetch(`/api/user/address?userId=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      });
      localStorage.removeItem(ADDRESS_KEY);
      setForm(EMPTY_ADDRESS);
      onToast('Address removed successfully.');
    } catch {
      onToast('Failed to remove address.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-gray-200 bg-[#FAF8F3] px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#083028]/30 focus:border-[#083028] transition';

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-[#083028] flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[#B8860B]" />
          My Address
        </h2>
        <span className="text-xs bg-[#083028]/10 text-[#083028] font-medium px-3 py-1 rounded-full flex items-center gap-1">
          <Home className="w-3 h-3" />
          Default Delivery Address
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="w-6 h-6 border-2 border-[#083028] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          {/* Row 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                required
                placeholder="John Doe"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                Phone Number <span className="text-red-400">*</span>
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                type="tel"
                maxLength={10}
                placeholder="9876543210"
                className={inputClass}
              />
            </div>
          </div>

          {/* Address Lines */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Address Line 1 <span className="text-red-400">*</span>
            </label>
            <input
              name="addressLine1"
              value={form.addressLine1}
              onChange={handleChange}
              required
              placeholder="House No, Street Name"
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Address Line 2{' '}
              <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <input
              name="addressLine2"
              value={form.addressLine2}
              onChange={handleChange}
              placeholder="Area, Landmark"
              className={inputClass}
            />
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                City <span className="text-red-400">*</span>
              </label>
              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                required
                placeholder="Mumbai"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                State <span className="text-red-400">*</span>
              </label>
              <select
                name="state"
                value={form.state}
                onChange={handleChange}
                required
                className={inputClass}
              >
                <option value="">Select State</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                Pincode <span className="text-red-400">*</span>
              </label>
              <input
                name="pincode"
                value={form.pincode}
                onChange={handleChange}
                required
                type="text"
                maxLength={6}
                placeholder="400001"
                className={inputClass}
              />
            </div>
          </div>

          {/* Submit & Delete Actions */}
          <div className="pt-2 flex items-center justify-between flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-[#083028] hover:bg-[#083028]/90 text-white text-sm font-medium px-6 py-2.5 rounded-xl transition disabled:opacity-60 shadow-xs"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Updating…' : 'Update Address'}
            </button>

            {form.addressLine1 && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="text-xs text-red-600 hover:text-red-700 hover:underline font-medium px-2 py-1"
              >
                Remove Address
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

// ─── Orders Section ───────────────────────────────────────────────────────────

function OrdersSection({ userId }: { userId: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/orders?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      // Support both { orders: [...] } and plain array
      setOrders(Array.isArray(data) ? data : data.orders ?? []);
    } catch (err) {
      setError('Could not load orders. Please try again later.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
      <h2 className="text-lg font-semibold text-[#083028] mb-6 flex items-center gap-2">
        <ShoppingBag className="w-5 h-5 text-[#B8860B]" />
        My Orders
      </h2>

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 rounded-xl bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <XCircle className="w-10 h-10 text-red-300" />
          <p className="text-sm text-gray-500">{error}</p>
          <button
            onClick={fetchOrders}
            className="text-xs text-[#083028] underline underline-offset-2"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-[#083028]/5 flex items-center justify-center">
            <ShoppingBag className="w-8 h-8 text-[#083028]/30" />
          </div>
          <p className="text-gray-500 text-sm">No orders yet. Start shopping!</p>
          <Link
            href="/category"
            className="inline-flex items-center gap-1 bg-[#083028] text-white text-sm font-medium px-5 py-2 rounded-xl hover:bg-[#083028]/90 transition"
          >
            Browse Collections
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((order) => {
            const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.Pending;
            const date = new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            });

            return (
              <div
                key={order.id}
                className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition"
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div>
                    <p className="text-xs text-gray-400">Order ID</p>
                    <p className="text-sm font-semibold text-[#083028] font-mono">
                      #{order.id}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">{date}</p>
                    <span
                      className={`inline-flex items-center gap-1 mt-0.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${cfg.classes}`}
                    >
                      {cfg.icon}
                      {cfg.label}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="border-t border-gray-100 pt-3 mb-3 space-y-1">
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-700 truncate max-w-[70%]">
                        {item.name}
                      </span>
                      <span className="text-gray-400 text-xs shrink-0">
                        × {item.quantity}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  <span className="text-xs text-gray-400">Order Total</span>
                  <span className="text-sm font-bold text-[#B8860B]">
                    ₹{order.total.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function AccountContent() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as Tab) || 'profile';
  const [activeTab, setActiveTab] = useState<Tab>(
    ['profile', 'address', 'orders'].includes(initialTab) ? initialTab : 'profile'
  );
  const [toast, setToast] = useState('');

  // Sync tab if URL param changes
  useEffect(() => {
    const tabParam = searchParams.get('tab') as Tab;
    if (tabParam && ['profile', 'address', 'orders'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Redirect ONLY when auth check is complete and no user is found
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login?redirect=/account');
    }
  }, [user, loading, router]);

  const showToast = useCallback((msg: string) => setToast(msg), []);
  const clearToast = useCallback(() => setToast(''), []);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#083028] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-500 font-medium">Loading account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F3] flex flex-col">
      <Header />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-[#083028]">
            My Account
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Welcome back,{' '}
            <span className="font-medium text-[#083028]">
              {user.name ?? user.email}
            </span>
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* ── Sidebar (desktop) ─── */}
          <aside className="hidden md:flex flex-col w-56 shrink-0 gap-1 self-start sticky top-24">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition text-left ${
                  activeTab === tab.id
                    ? 'bg-[#083028] text-white shadow-sm'
                    : 'text-gray-600 hover:bg-[#083028]/8 hover:text-[#083028]'
                }`}
              >
                <span
                  className={
                    activeTab === tab.id ? 'text-[#B8860B]' : 'text-gray-400'
                  }
                >
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            ))}

            <div className="mt-4 border-t border-gray-200 pt-4">
              <button
                onClick={logout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition w-full text-left"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </aside>

          {/* ── Tab bar (mobile) ─── */}
          <div className="md:hidden w-full overflow-x-auto pb-1">
            <div className="flex gap-2 min-w-max">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                    activeTab === tab.id
                      ? 'bg-[#083028] text-white shadow-sm'
                      : 'bg-white text-gray-600 border border-gray-200'
                  }`}
                >
                  <span
                    className={
                      activeTab === tab.id ? 'text-[#B8860B]' : 'text-gray-400'
                    }
                  >
                    {tab.icon}
                  </span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Content ─── */}
          <div className="flex-1 min-w-0">
            {activeTab === 'profile' && <ProfileSection user={user} />}
            {activeTab === 'address' && <AddressSection userId={user.id} onToast={showToast} />}
            {activeTab === 'orders' && <OrdersSection userId={user.id} />}

            {/* Mobile Sign Out */}
            <div className="md:hidden mt-6">
              <button
                onClick={logout}
                className="flex items-center gap-2 text-sm text-red-500 font-medium px-4 py-2 rounded-xl border border-red-100 hover:bg-red-50 transition"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Toast */}
      {toast && <Toast message={toast} onClose={clearToast} />}
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#083028] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AccountContent />
    </Suspense>
  );
}
