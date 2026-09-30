'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, ArrowLeft, Mail, CreditCard, Package, MapPin, Phone } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

interface OrderItem {
  id?: string;
  name: string;
  quantity: number;
  price?: string | number;
}

interface ShippingAddress {
  fullName?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

interface Order {
  id: string;
  userName: string;
  userEmail: string;
  items: OrderItem[];
  shippingAddress?: ShippingAddress;
  total: number;
  paymentMethod: string;
  status: OrderStatus;
  createdAt: string;
}

const ALL_STATUSES: OrderStatus[] = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const STATUS_STYLES: Record<OrderStatus, string> = {
  Pending: 'bg-orange-100 text-orange-700 border-orange-200',
  Processing: 'bg-amber-100 text-amber-700 border-amber-200',
  Shipped: 'bg-blue-100 text-blue-700 border-blue-200',
  Delivered: 'bg-green-100 text-green-700 border-green-200',
  Cancelled: 'bg-red-100 text-red-700 border-red-200',
};

const STATUS_DOT: Record<OrderStatus, string> = {
  Pending: 'bg-orange-500',
  Processing: 'bg-amber-500',
  Shipped: 'bg-blue-500',
  Delivered: 'bg-green-500',
  Cancelled: 'bg-red-500',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function itemsSummary(items: OrderItem[]) {
  if (!items || items.length === 0) return 'No items';
  return items.map((i) => `${i.name}${i.quantity > 1 ? ` ×${i.quantity}` : ''}`).join(', ');
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const normalized = ALL_STATUSES.includes(status) ? status : 'Pending';
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLES[normalized]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[normalized]}`} />
      {normalized}
    </span>
  );
}

function StatusDropdown({
  orderId,
  current,
  onChange,
}: {
  orderId: string;
  current: OrderStatus;
  onChange: (id: string, status: OrderStatus) => void;
}) {
  const normalized = ALL_STATUSES.includes(current) ? current : 'Pending';
  return (
    <select
      value={normalized}
      onChange={(e) => onChange(orderId, e.target.value as OrderStatus)}
      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#083028]/30 cursor-pointer"
    >
      {ALL_STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}

export default function AdminOrdersPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch('/api/orders?all=true', { cache: 'no-store' });
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        // Parse either { success: true, orders: [...] } or plain array
        const list: Order[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.orders)
          ? data.orders
          : [];
        setOrders(list);
      } catch {
        setError('Failed to fetch orders from database.');
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  async function handleStatusChange(orderId: string, newStatus: OrderStatus) {
    // 1. Optimistic UI update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    toast.success(`Order ${orderId} status updated to ${newStatus}`, { title: 'Order Status' });

    // 2. Persist to DB API
    try {
      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
    } catch {
      // non-blocking
    }
  }

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <Package className="text-[#083028]" size={26} />
            Customer Orders
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? 'Loading orders from database...' : `${orders.length} order${orders.length !== 1 ? 's' : ''} stored in database`}
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
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
          <Package size={48} className="mx-auto text-gray-300 mb-3" />
          <h3 className="text-base font-bold text-gray-800">No Orders in Database</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            When customer orders are placed on the website, they will appear here directly from Supabase.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#083028] text-white">
                <tr>
                  <th className="text-left px-5 py-3.5 font-semibold">Order ID</th>
                  <th className="text-left px-5 py-3.5 font-semibold">Customer & Delivery Address</th>
                  <th className="text-left px-5 py-3.5 font-semibold">Items</th>
                  <th className="text-left px-5 py-3.5 font-semibold">Total</th>
                  <th className="text-left px-5 py-3.5 font-semibold">Payment</th>
                  <th className="text-left px-5 py-3.5 font-semibold">Date</th>
                  <th className="text-left px-5 py-3.5 font-semibold">Status</th>
                  <th className="text-left px-5 py-3.5 font-semibold">Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order, idx) => (
                  <tr
                    key={order.id}
                    className={`hover:bg-[#083028]/5 transition ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'
                    }`}
                  >
                    <td className="px-5 py-4 font-mono text-xs text-[#083028] font-bold align-top">
                      {order.id}
                    </td>
                    <td className="px-5 py-4 align-top max-w-[260px]">
                      <p className="font-semibold text-gray-900">{order.userName}</p>
                      <p className="text-xs text-gray-400">{order.userEmail}</p>
                      {order.shippingAddress && (
                        <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-200/70 space-y-0.5">
                          <p className="font-medium text-gray-800 flex items-center gap-1">
                            <MapPin size={11} className="text-[#083028]" />
                            {order.shippingAddress.addressLine1}
                            {order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ''}
                          </p>
                          <p className="text-gray-500 pl-3.5">
                            {[order.shippingAddress.city, order.shippingAddress.state].filter(Boolean).join(', ')} - {order.shippingAddress.pincode}
                          </p>
                          {order.shippingAddress.phone && (
                            <p className="text-gray-500 pl-3.5 font-mono text-[11px]">
                              📞 {order.shippingAddress.phone}
                            </p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-gray-600 max-w-[180px] align-top">
                      <span className="line-clamp-3 text-xs leading-relaxed font-medium text-gray-700">
                        {itemsSummary(order.items)}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-bold text-[#083028] align-top whitespace-nowrap">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-5 py-4 capitalize text-gray-600 align-top text-xs whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-gray-100 font-medium">
                        {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs align-top whitespace-nowrap">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-5 py-4 align-top">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-4 align-top">
                      <StatusDropdown
                        orderId={order.id}
                        current={order.status}
                        onChange={handleStatusChange}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile / tablet cards */}
          <div className="lg:hidden space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3"
              >
                {/* Card header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-xs font-bold text-[#083028]">{order.id}</p>
                    <p className="font-bold text-[#083028] text-base mt-0.5">{formatCurrency(order.total)}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                {/* Customer & address */}
                <div className="text-xs text-gray-600 space-y-1 pt-1 border-t border-gray-100">
                  <p className="font-semibold text-gray-900">{order.userName}</p>
                  <p className="text-gray-400 flex items-center gap-1">
                    <Mail size={12} /> {order.userEmail}
                  </p>
                  {order.shippingAddress && (
                    <div className="mt-2 bg-gray-50 p-2 rounded-xl border border-gray-200/70 text-xs space-y-0.5">
                      <p className="font-medium text-gray-800 flex items-center gap-1">
                        <MapPin size={11} className="text-[#083028]" />
                        {order.shippingAddress.addressLine1}
                      </p>
                      <p className="text-gray-500 pl-3.5">
                        {[order.shippingAddress.city, order.shippingAddress.state].filter(Boolean).join(', ')} - {order.shippingAddress.pincode}
                      </p>
                      {order.shippingAddress.phone && (
                        <p className="text-gray-500 pl-3.5 font-mono text-[11px]">
                          📞 {order.shippingAddress.phone}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Items & Payment */}
                <div className="pt-2 border-t border-gray-100 text-xs space-y-1">
                  <div className="flex items-start gap-1.5 text-gray-700">
                    <Package size={13} className="text-[#B8860B] shrink-0 mt-0.5" />
                    <span>{itemsSummary(order.items)}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-500 pt-1">
                    <span className="capitalize">{order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}</span>
                    <span>{formatDate(order.createdAt)}</span>
                  </div>
                </div>

                {/* Status update dropdown */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-500 font-medium">Update Status:</span>
                  <StatusDropdown
                    orderId={order.id}
                    current={order.status}
                    onChange={handleStatusChange}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
