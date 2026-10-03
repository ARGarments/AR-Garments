'use client';

import { useEffect, useState } from 'react';
import {
  ShoppingBag,
  Users,
  TrendingUp,
  Package,
  Clock,
  CheckCircle,
  Truck,
  RotateCcw,
  AlertTriangle,
  ExternalLink,
  Ticket,
  FolderTree,
  Star,
  Inbox,
  ArrowRight,
  Mail,
  MessageSquare,
} from 'lucide-react';
import Link from 'next/link';

interface OrderItem {
  id?: string;
  name: string;
  quantity: number;
  price?: string | number;
}

interface Order {
  id: string;
  userName?: string;
  userEmail?: string;
  items?: OrderItem[];
  total?: number;
  status?: string;
  createdAt?: string;
}

interface CatalogProduct {
  id: string;
  name: string;
  price: string;
  numericPrice?: number;
  category: string;
  image: string;
}

const orderStatusConfig: Record<string, { icon: React.ReactNode; cls: string }> = {
  Delivered: { icon: <CheckCircle size={12} />, cls: 'bg-green-100 text-green-700' },
  Shipped: { icon: <Truck size={12} />, cls: 'bg-blue-100 text-blue-700' },
  Processing: { icon: <Clock size={12} />, cls: 'bg-amber-100 text-amber-700' },
  Pending: { icon: <AlertTriangle size={12} />, cls: 'bg-orange-100 text-orange-700' },
  Cancelled: { icon: <RotateCcw size={12} />, cls: 'bg-red-100 text-red-700' },
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [liveOrders, setLiveOrders] = useState<Order[]>([]);
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [couponsCount, setCouponsCount] = useState(0);
  const [categoriesCount, setCategoriesCount] = useState(0);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [productsCount, setProductsCount] = useState(0);
  const [subscribersCount, setSubscribersCount] = useState(0);
  const [queriesCount, setQueriesCount] = useState(0);
  const [unreadQueriesCount, setUnreadQueriesCount] = useState(0);
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      setLoading(true);

      // 1. Fetch live orders
      try {
        const res = await fetch('/api/orders?all=true', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const list: Order[] = Array.isArray(data) ? data : data?.orders || [];
          if (isMounted) setLiveOrders(list);
        }
      } catch {
        // ignore
      }

      // 2. Fetch live users
      try {
        const res = await fetch('/api/auth/users', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && isMounted) setTotalUsersCount(data.length);
        }
      } catch {
        // ignore
      }

      // 3. Fetch active coupons
      try {
        const res = await fetch('/api/coupons?active=true', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && isMounted) setCouponsCount(data.length);
        }
      } catch {
        // ignore
      }

      // 4. Fetch categories
      try {
        const res = await fetch('/api/categories', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && isMounted) setCategoriesCount(data.length);
        }
      } catch {
        // ignore
      }

      // 5. Fetch reviews
      try {
        const res = await fetch('/api/reviews?all=true', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data?.reviews) ? data.reviews : [];
          if (isMounted) setReviewsCount(list.length);
        }
      } catch {
        // ignore
      }

      // 6. Fetch products for catalog overview
      try {
        const res = await fetch('/api/products', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && isMounted) {
            setProductsCount(data.length);
            setCatalogProducts(
              data.slice(0, 5).map((p: Record<string, unknown>) => ({
                id: String(p.id),
                name: String(p.name),
                price: String(p.price),
                numericPrice: Number(p.numeric_price) || 0,
                category: String(p.category || ''),
                image: String(p.image || ''),
              }))
            );
          }
        }
      } catch {
        // ignore
      }

      // 7. Fetch newsletter subscribers
      try {
        const res = await fetch('/api/newsletter', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data?.subscribers) ? data.subscribers : [];
          if (isMounted) setSubscribersCount(list.length);
        }
      } catch {
        // ignore
      }

      // 8. Fetch customer inquiries
      try {
        const res = await fetch('/api/contact', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data?.messages) ? data.messages : [];
          if (isMounted) {
            setQueriesCount(data?.counts?.total ?? list.length);
            setUnreadQueriesCount(data?.counts?.unread ?? list.filter((m: { status: string }) => m.status === 'unread').length);
          }
        }
      } catch {
        // ignore
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute live calculations from DB orders
  const totalOrdersCount = liveOrders.length;
  const totalRevenueNumber = liveOrders.reduce(
    (sum, o) => sum + (Number(o.total) || 0),
    0
  );
  const totalRevenueFormatted = `₹${totalRevenueNumber.toLocaleString('en-IN')}`;

  const pendingOrdersCount = liveOrders.filter(
    (o) => (o.status || 'Pending').toLowerCase() === 'pending'
  ).length;

  const processingOrdersCount = liveOrders.filter(
    (o) => (o.status || '').toLowerCase() === 'processing'
  ).length;

  const shippedOrdersCount = liveOrders.filter(
    (o) => (o.status || '').toLowerCase() === 'shipped'
  ).length;

  const deliveredOrdersCount = liveOrders.filter(
    (o) => (o.status || '').toLowerCase() === 'delivered'
  ).length;

  const cancelledOrdersCount = liveOrders.filter(
    (o) => (o.status || '').toLowerCase() === 'cancelled'
  ).length;

  // Compute top sold items dynamically from live orders
  const itemSalesMap = new Map<string, { count: number; name: string }>();
  for (const order of liveOrders) {
    if (Array.isArray(order.items)) {
      for (const itm of order.items) {
        const key = itm.name || 'Product';
        const curr = itemSalesMap.get(key) || { count: 0, name: key };
        curr.count += itm.quantity || 1;
        itemSalesMap.set(key, curr);
      }
    }
  }
  const topSoldProducts = Array.from(itemSalesMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const statsCards = [
    {
      label: 'Total Orders',
      value: `${totalOrdersCount}`,
      period: 'all orders placed',
      icon: ShoppingBag,
      color: 'bg-blue-50 text-blue-600',
      href: '/admin/orders',
    },
    {
      label: 'Total Revenue',
      value: totalRevenueFormatted,
      period: 'lifetime sales volume',
      icon: TrendingUp,
      color: 'bg-green-50 text-green-600',
      href: '/admin/orders',
    },
    {
      label: 'Registered Customers',
      value: `${totalUsersCount}`,
      period: 'database accounts',
      icon: Users,
      color: 'bg-purple-50 text-purple-600',
      href: '/admin/users',
    },
    {
      label: 'Pending Orders',
      value: `${pendingOrdersCount}`,
      period: 'orders requiring fulfillment',
      icon: Package,
      color: 'bg-amber-50 text-amber-600',
      href: '/admin/orders',
    },
  ];

  const pipelineItems = [
    { label: 'Pending', count: pendingOrdersCount, color: 'bg-orange-400' },
    { label: 'Processing', count: processingOrdersCount, color: 'bg-amber-400' },
    { label: 'Shipped', count: shippedOrdersCount, color: 'bg-blue-400' },
    { label: 'Delivered', count: deliveredOrdersCount, color: 'bg-green-400' },
    { label: 'Cancelled', count: cancelledOrdersCount, color: 'bg-red-400' },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Real-time overview of your store operations, orders, and customer activity.
        </p>
      </div>

      {/* Stats Cards — 100% DB Live Data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {statsCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs hover:shadow-md transition-all group block"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center ${card.color} group-hover:scale-105 transition-transform`}
                >
                  <Icon size={20} />
                </div>
                <span className="text-[11px] font-bold text-[#083028] bg-[#083028]/5 px-2.5 py-1 rounded-full border border-[#083028]/10">
                  Live DB
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-sm text-gray-600 mt-1 flex items-center justify-between">
                <span>{card.label}</span>
                <span className="text-xs text-[#083028] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  View →
                </span>
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{card.period}</p>
            </Link>
          );
        })}
      </div>

      {/* Order Pipeline — Calculated from Live DB Orders */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-900">Order Pipeline Status</h2>
          <span className="text-xs text-gray-400 font-medium">
            Total Orders: {totalOrdersCount}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {pipelineItems.map((item) => (
            <div key={item.label} className="text-center p-3 bg-gray-50/70 rounded-xl border border-gray-100">
              <div className={`w-full h-2 rounded-full ${item.color} mb-3`} />
              <p className="text-2xl font-bold text-gray-900">{item.count}</p>
              <p className="text-xs font-semibold text-gray-600 mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Two-column: Recent Orders + Top Products */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Orders — Real DB Only */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900">Recent Customer Orders</h2>
              {liveOrders.length > 0 && (
                <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                  {liveOrders.length} Recorded
                </span>
              )}
            </div>
            <Link
              href="/admin/orders"
              className="text-xs text-[#083028] font-semibold hover:underline flex items-center gap-1"
            >
              View All Orders <ExternalLink size={12} />
            </Link>
          </div>

          <div className="flex-1 overflow-x-auto">
            {liveOrders.length === 0 ? (
              <div className="py-16 px-4 text-center flex flex-col items-center justify-center">
                <Inbox size={36} className="text-gray-300 mb-2" />
                <p className="text-sm font-bold text-gray-800">No orders placed yet</p>
                <p className="text-xs text-gray-500 max-w-xs mt-1">
                  When customers complete checkout, new orders will be tracked and displayed here in real time.
                </p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Order ID', 'Customer', 'Items', 'Amount', 'Status', 'Date'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {liveOrders.slice(0, 6).map((order) => {
                    const statusCfg = orderStatusConfig[order.status || 'Pending'] || {
                      icon: <Clock size={12} />,
                      cls: 'bg-gray-100 text-gray-700',
                    };
                    const dateStr = order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })
                      : 'Recent';

                    const itemsSummary = order.items?.[0]
                      ? `${order.items[0].name}${
                          order.items.length > 1 ? ` +${order.items.length - 1} more` : ''
                        }`
                      : '1 Item';

                    return (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-[#083028] font-semibold">
                          {order.id}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                          {order.userName || order.userEmail?.split('@')[0] || 'Customer'}
                        </td>
                        <td className="px-4 py-3 text-gray-600 max-w-[140px] truncate">
                          {itemsSummary}
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          ₹{Number(order.total || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.cls}`}
                          >
                            {statusCfg.icon} {order.status || 'Pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                          {dateStr}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Top Products / Catalog Overview — Real DB */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">
              {topSoldProducts.length > 0 ? 'Top Selling Items' : 'Product Catalog'}
            </h2>
            <Link
              href="/admin/products"
              className="text-xs text-[#083028] font-semibold hover:underline"
            >
              Manage →
            </Link>
          </div>

          <div className="p-4 flex-1">
            {topSoldProducts.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {topSoldProducts.map((p, i) => (
                  <div key={p.name} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="w-5 text-center text-xs font-bold text-gray-400">
                        #{i + 1}
                      </span>
                      <p className="text-sm font-semibold text-gray-800 line-clamp-1">{p.name}</p>
                    </div>
                    <span className="text-xs font-bold text-[#083028] bg-[#083028]/5 px-2.5 py-1 rounded-lg shrink-0">
                      {p.count} sold
                    </span>
                  </div>
                ))}
              </div>
            ) : catalogProducts.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-gray-400 mb-2">Active items in your store:</p>
                {catalogProducts.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 p-2 rounded-xl bg-gray-50 border border-gray-100"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{p.name}</p>
                      <p className="text-[11px] text-gray-500">{p.category}</p>
                    </div>
                    <span className="text-xs font-bold text-[#B8860B] shrink-0 font-mono">
                      {p.price}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-gray-400 text-xs">
                No products in catalog yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Website Modules Overview — 100% DB Live Data */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-gray-900">Database Modules &amp; Catalog</h2>
            <p className="text-xs text-gray-500 mt-0.5">Direct counts synced with your database</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          {[
            {
              label: 'Orders',
              count: totalOrdersCount,
              desc: 'Total customer orders',
              icon: ShoppingBag,
              color: 'text-indigo-600',
              link: '/admin/orders',
            },
            {
              label: 'Queries',
              count: queriesCount,
              desc: unreadQueriesCount > 0 ? `${unreadQueriesCount} unread` : 'Customer messages',
              icon: MessageSquare,
              color: 'text-amber-600',
              link: '/admin/contacts',
            },
            {
              label: 'Customers',
              count: totalUsersCount,
              desc: 'Registered accounts',
              icon: Users,
              color: 'text-purple-600',
              link: '/admin/users',
            },
            {
              label: 'Products',
              count: productsCount,
              desc: 'Active store catalog',
              icon: Package,
              color: 'text-emerald-600',
              link: '/admin/products',
            },
            {
              label: 'Categories',
              count: categoriesCount,
              desc: 'Product categories',
              icon: FolderTree,
              color: 'text-blue-600',
              link: '/admin/categories',
            },
            {
              label: 'Reviews',
              count: reviewsCount,
              desc: 'Customer ratings',
              icon: Star,
              color: 'text-amber-500',
              link: '/admin/reviews',
            },
            {
              label: 'Coupons',
              count: couponsCount,
              desc: 'Active vouchers',
              icon: Ticket,
              color: 'text-rose-600',
              link: '/admin/coupons',
            },
            {
              label: 'Newsletter',
              count: subscribersCount,
              desc: 'Email subscribers',
              icon: Mail,
              color: 'text-teal-600',
              link: '/admin/newsletter',
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.link}
                className="bg-gray-50 rounded-xl p-4 text-center hover:bg-gray-100 hover:shadow-xs transition-all border border-gray-100 group block"
              >
                <Icon size={20} className={`mx-auto mb-2 ${item.color} group-hover:scale-110 transition-transform`} />
                <p className="text-2xl font-bold text-gray-900">{item.count}</p>
                <p className="text-xs font-bold text-gray-700 mt-0.5">{item.label}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{item.desc}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
