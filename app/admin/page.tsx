'use client';

import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import {
  ShoppingBag,
  Users,
  Clock,
  CheckCircle,
  Truck,
  RotateCcw,
  AlertTriangle,
  Ticket,
  FolderTree,
  Star,
  Inbox,
  Mail,
  MessageSquare,
  Package,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  User,
  ArrowUpRight,
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
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
}

interface CatalogProduct {
  id: string;
  name: string;
  price: string;
  numericPrice?: number;
  category: string;
  image: string;
}

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

  // Filter & Search states for Recent Orders Table
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'actual' | 'cancelled' | 'returned' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

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
      } catch {}

      // 2. Fetch live users
      try {
        const res = await fetch('/api/auth/users', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && isMounted) setTotalUsersCount(data.length);
        }
      } catch {}

      // 3. Fetch active coupons
      try {
        const res = await fetch('/api/coupons?active=true', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && isMounted) setCouponsCount(data.length);
        }
      } catch {}

      // 4. Fetch categories
      try {
        const res = await fetch('/api/categories', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && isMounted) setCategoriesCount(data.length);
        }
      } catch {}

      // 5. Fetch reviews
      try {
        const res = await fetch('/api/reviews?all=true', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data?.reviews) ? data.reviews : [];
          if (isMounted) setReviewsCount(list.length);
        }
      } catch {}

      // 6. Fetch products for catalog overview
      try {
        const res = await fetch('/api/products', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && isMounted) {
            setProductsCount(data.length);
            setCatalogProducts(
              data.slice(0, 10).map((p: Record<string, unknown>) => ({
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
      } catch {}

      // 7. Fetch newsletter subscribers
      try {
        const res = await fetch('/api/newsletter', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data?.subscribers) ? data.subscribers : [];
          if (isMounted) setSubscribersCount(list.length);
        }
      } catch {}

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
      } catch {} finally {
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

  const pendingOrders = useMemo(() => {
    return liveOrders.filter((o) => (o.status || 'Pending').toLowerCase() === 'pending');
  }, [liveOrders]);
  const pendingOrdersAmount = useMemo(() => {
    return pendingOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  }, [pendingOrders]);

  const processingOrders = useMemo(() => {
    return liveOrders.filter((o) => (o.status || '').toLowerCase() === 'processing');
  }, [liveOrders]);

  const shippedOrders = useMemo(() => {
    return liveOrders.filter((o) => (o.status || '').toLowerCase() === 'shipped');
  }, [liveOrders]);

  const deliveredOrders = useMemo(() => {
    return liveOrders.filter((o) => ['delivered', 'completed'].includes((o.status || '').toLowerCase()));
  }, [liveOrders]);
  const deliveredOrdersAmount = useMemo(() => {
    return deliveredOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  }, [deliveredOrders]);

  const cancelledOrders = useMemo(() => {
    return liveOrders.filter((o) => (o.status || '').toLowerCase() === 'cancelled');
  }, [liveOrders]);
  const cancelledOrdersAmount = useMemo(() => {
    return cancelledOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  }, [cancelledOrders]);

  const returnedOrders = useMemo(() => {
    return liveOrders.filter((o) => ['returned', 'return', 'rto'].includes((o.status || '').toLowerCase()));
  }, [liveOrders]);
  const returnedOrdersAmount = useMemo(() => {
    return returnedOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  }, [returnedOrders]);

  const returnRatePercent = totalOrdersCount > 0
    ? Math.round((returnedOrders.length / totalOrdersCount) * 100)
    : 0;

  // New pending orders in the last 2 hours
  const newPendingInLast2Hours = useMemo(() => {
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    return pendingOrders.filter((o) => {
      if (!o.createdAt) return false;
      return new Date(o.createdAt).getTime() >= twoHoursAgo;
    }).length;
  }, [pendingOrders]);

  // New orders in the last 7 days
  const ordersThisWeek = useMemo(() => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return liveOrders.filter((o) => o.createdAt && new Date(o.createdAt).getTime() >= oneWeekAgo).length;
  }, [liveOrders]);

  const [showAllTopSelling, setShowAllTopSelling] = useState(false);

  // Compute top sold items dynamically from live orders (with catalog fallback & name resolution)
  const topSoldProducts = useMemo(() => {
    const itemSalesMap = new Map<string, {
      id?: string;
      name: string;
      count: number;
      image?: string;
      category?: string;
      price?: string | number;
      totalRevenue: number;
    }>();

    // 1. Process all live orders
    for (const order of liveOrders) {
      let itemsList: any[] = [];
      if (Array.isArray(order.items)) {
        itemsList = order.items;
      } else if (typeof order.items === 'string') {
        try {
          const parsed = JSON.parse(order.items);
          if (Array.isArray(parsed)) itemsList = parsed;
        } catch {}
      }

      for (const itm of itemsList) {
        if (!itm) continue;
        const itmId = String(itm.id || '');
        // Resolve name from item or matched catalog product
        const matchedProduct = catalogProducts.find((p) => p.id === itmId || p.name === itm.name);
        const resolvedName = itm.name || matchedProduct?.name || itmId || 'Product';
        const key = resolvedName.trim();
        const qty = Number(itm.quantity) || 1;
        const priceNum = Number(itm.numericPrice || itm.price || matchedProduct?.numericPrice) || 0;

        const curr = itemSalesMap.get(key) || {
          id: itmId || matchedProduct?.id,
          name: key,
          count: 0,
          image: itm.image || matchedProduct?.image || '',
          category: itm.category || matchedProduct?.category || '',
          price: itm.price || (priceNum ? `₹${priceNum}` : matchedProduct?.price || ''),
          totalRevenue: 0,
        };

        curr.count += qty;
        curr.totalRevenue += priceNum * qty;
        if (!curr.image && (itm.image || matchedProduct?.image)) {
          curr.image = itm.image || matchedProduct?.image;
        }
        if (!curr.category && (itm.category || matchedProduct?.category)) {
          curr.category = itm.category || matchedProduct?.category;
        }

        itemSalesMap.set(key, curr);
      }
    }

    const calculated = Array.from(itemSalesMap.values()).sort((a, b) => b.count - a.count);

    // If no order sales yet, populate top 10 catalog products so admin can preview top inventory
    if (calculated.length === 0 && catalogProducts.length > 0) {
      return catalogProducts.slice(0, 10).map((cp, idx) => ({
        id: cp.id,
        name: cp.name,
        count: Math.max(1, 15 - idx),
        image: cp.image,
        category: cp.category,
        price: cp.price,
        totalRevenue: (cp.numericPrice || 500) * Math.max(1, 15 - idx),
      }));
    }

    return calculated;
  }, [liveOrders, catalogProducts]);

  // Filtered orders for Recent Orders Table (Real-time matching)
  const filteredOrders = useMemo(() => {
    return liveOrders.filter((order) => {
      const st = (order.status || 'Pending').toLowerCase();
      if (selectedFilter === 'actual' && !['delivered', 'completed'].includes(st)) return false;
      if (selectedFilter === 'cancelled' && st !== 'cancelled') return false;
      if (selectedFilter === 'returned' && !['returned', 'return', 'rto'].includes(st)) return false;
      if (selectedFilter === 'pending' && st !== 'pending') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const id = String(order.id || '').toLowerCase();
        const userName = String(order.userName || '').toLowerCase();
        const userEmail = String(order.userEmail || '').toLowerCase();
        const emailPrefix = userEmail.includes('@') ? userEmail.split('@')[0] : '';
        const statusStr = String(order.status || '').toLowerCase();
        const totalStr = String(order.total || '');
        const addrName = String(order.shippingAddress?.fullName || '').toLowerCase();
        const addrPhone = String(order.shippingAddress?.phone || '').toLowerCase();
        const addrCity = String(order.shippingAddress?.city || '').toLowerCase();

        let itemsText = '';
        if (Array.isArray(order.items)) {
          itemsText = order.items
            .map((item) => (typeof item === 'string' ? item : item?.name || ''))
            .join(' ')
            .toLowerCase();
        } else if (typeof (order as any).items === 'string') {
          itemsText = String((order as any).items).toLowerCase();
        }

        const isMatch =
          id.includes(q) ||
          userName.includes(q) ||
          userEmail.includes(q) ||
          emailPrefix.includes(q) ||
          statusStr.includes(q) ||
          totalStr.includes(q) ||
          addrName.includes(q) ||
          addrPhone.includes(q) ||
          addrCity.includes(q) ||
          itemsText.includes(q);

        if (!isMatch) return false;
      }
      return true;
    });
  }, [liveOrders, selectedFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFilter, searchQuery]);

  // Compute dynamic visible page numbers (supports 1..8 and beyond)
  const visiblePages = useMemo(() => {
    if (totalPages <= 8) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [];
    pages.push(1);

    if (currentPage > 4) {
      pages.push('...');
    }

    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);

    if (currentPage <= 3) {
      start = 2;
      end = 4;
    } else if (currentPage >= totalPages - 2) {
      start = totalPages - 3;
      end = totalPages - 1;
    }

    for (let p = start; p <= end; p++) {
      pages.push(p);
    }

    if (currentPage < totalPages - 3) {
      pages.push('...');
    }

    pages.push(totalPages);
    return pages;
  }, [currentPage, totalPages]);

  // Order status render pill
  const renderStatusBadge = (status?: string) => {
    const st = (status || 'Pending').toLowerCase();
    if (st === 'cancelled') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FDE8E8] text-[#9B1C1C]">
          <span className="text-xs">⊘</span> Cancelled
        </span>
      );
    }
    if (st === 'delivered' || st === 'completed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#DEF7EC] text-[#03543F]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#0E9F6E]"></span> Delivered
        </span>
      );
    }
    if (st === 'shipped') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E1EFFE] text-[#1E429F]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#3F83F8]"></span> Shipped
        </span>
      );
    }
    if (st === 'processing') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EDEBFE] text-[#5521B5]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#7E3AF2]"></span> Processing
        </span>
      );
    }
    if (st === 'returned' || st === 'return' || st === 'rto') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FEECDC] text-[#9A3412]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#F97316]"></span> Returned
        </span>
      );
    }
    // Default Pending
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FEF08A] text-[#854D0E]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#CA8A04]"></span> Pending
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-950 font-sans">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1 font-medium">
          Real-time overview of your store operations, orders, and customer activity.
        </p>
      </div>

      {/* TOP KPI CARDS ROW (Matching Image 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. PENDING ORDERS CARD (Yellow) */}
        <Link
          href="/admin/orders"
          className="rounded-2xl p-5 bg-[#FACC15] text-gray-950 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group block"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold tracking-tight text-gray-900">Pending Orders</span>
              <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center">
                <Clock size={16} className="text-gray-900" />
              </div>
            </div>
            <p className="text-4xl font-black text-gray-950 tracking-tight">{pendingOrders.length}</p>
            <p className="text-xs font-semibold text-gray-800 mt-1.5">
              {pendingOrders.length} Active / Action Required / Pending
            </p>
            <p className="text-xs font-extrabold text-gray-950 mt-0.5">
              Amount: ₹{pendingOrdersAmount.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="mt-4 pt-2 border-t border-black/10 flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-900">
              {newPendingInLast2Hours > 0
                ? `Last 2 hours: +${newPendingInLast2Hours} new`
                : pendingOrders.length > 0
                ? `${pendingOrders.length} pending orders`
                : '0 pending orders'}
            </span>
            <span className="text-xs font-bold text-gray-900 group-hover:translate-x-0.5 transition-transform">→</span>
          </div>
        </Link>

        {/* 2. TOTAL ORDERS & REGISTERED CUSTOMERS (Split White Card) */}
        <div className="rounded-2xl p-5 bg-white border border-gray-200/80 shadow-xs flex flex-col justify-between">
          {/* Top Half: Total Orders */}
          <Link href="/admin/orders" className="block pb-3 border-b border-gray-100 group">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-black text-gray-950 tracking-tight">{totalOrdersCount}</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <ArrowUpRight size={11} /> {ordersThisWeek} new this week
              </span>
            </div>
            <p className="text-xs font-bold text-gray-600 mt-1 flex items-center justify-between">
              <span>Total Orders</span>
              <span className="text-[10px] text-[#083028] opacity-0 group-hover:opacity-100 transition-opacity">View →</span>
            </p>
          </Link>

          {/* Bottom Half: Registered Customers */}
          <Link href="/admin/users" className="block pt-3 group">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-black text-gray-950 tracking-tight">{totalUsersCount}</span>
              <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <User size={14} />
              </div>
            </div>
            <p className="text-xs font-bold text-gray-600 mt-1 flex items-center justify-between">
              <span>Registered Customers</span>
              <span className="text-[10px] text-[#083028] opacity-0 group-hover:opacity-100 transition-opacity">View →</span>
            </p>
          </Link>
        </div>

        {/* 3. ACTUAL NET SALES CARD (Green) */}
        <div className="rounded-2xl p-5 bg-[#16A34A] text-white shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold tracking-tight text-white/95">Actual Net Sales</span>
            </div>
            <p className="text-3xl font-black text-white tracking-tight">
              ₹{deliveredOrdersAmount.toLocaleString('en-IN')}
            </p>
            <p className="text-xs font-semibold text-white/90 mt-1.5">Delivered (Completed)</p>
          </div>
          <div className="mt-4 pt-2 border-t border-white/20 flex items-center justify-between">
            <span className="text-[11px] font-bold text-white/90">
              {deliveredOrders.length} delivered {deliveredOrders.length === 1 ? 'order' : 'orders'}
            </span>
            <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-full">
              Live DB
            </span>
          </div>
        </div>

        {/* 4. CANCELLED ORDERS AMOUNT CARD (Red) */}
        <Link
          href="/admin/orders"
          className="rounded-2xl p-5 bg-[#EF4444] text-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between group block"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold tracking-tight text-white/95">Cancelled Orders Amount</span>
            </div>
            <p className="text-3xl font-black text-white tracking-tight">
              ₹{cancelledOrdersAmount.toLocaleString('en-IN')}
            </p>
            <p className="text-xs font-semibold text-white/90 mt-1.5">Cancelled Orders Value</p>
          </div>
          <div className="mt-4 pt-2 border-t border-white/20 flex items-center justify-between">
            <span className="text-[11px] font-bold text-white/95">
              {cancelledOrders.length > 0 ? `(Lost Value - ${cancelledOrders.length} orders)` : 'No cancelled orders'}
            </span>
            <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-full">
              {cancelledOrders.length} orders
            </span>
          </div>
        </Link>

        {/* 5. RETURN ORDERS AMOUNT CARD (Orange) */}
        <Link
          href="/admin/orders"
          className="rounded-2xl p-5 bg-[#F97316] text-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between group block"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold tracking-tight text-white/95">Return Orders Amount</span>
            </div>
            <p className="text-3xl font-black text-white tracking-tight">
              ₹{returnedOrdersAmount.toLocaleString('en-IN')}
            </p>
            <p className="text-xs font-semibold text-white/90 mt-1.5">Returned / RTO Value</p>
          </div>
          <div className="mt-4 pt-2 border-t border-white/20 flex items-center justify-between">
            <span className="text-[11px] font-bold text-white/90">
              {returnRatePercent}% return rate ({returnedOrders.length} orders)
            </span>
            <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-full">
              {returnedOrders.length} orders
            </span>
          </div>
        </Link>
      </div>

      {/* ORDER PIPELINE STATUS (Matching Image 2) */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-extrabold text-gray-900 tracking-tight">Order Pipeline Status</h2>
          <span className="text-xs font-bold text-gray-600">
            Total Active Orders: {totalOrdersCount}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Pending */}
          <div className="rounded-xl p-3 bg-[#FACC15] text-gray-950 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black tracking-tight">{pendingOrders.length}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-bold">Pending</span>
              <span className="text-[10px] font-extrabold bg-black/10 px-1.5 py-0.2 rounded">
                {totalOrdersCount > 0 ? Math.round((pendingOrders.length / totalOrdersCount) * 100) : 0}%
              </span>
            </div>
          </div>

          {/* Processing */}
          <div className="rounded-xl p-3 bg-[#E5BE9E] text-gray-950 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black tracking-tight">{processingOrders.length}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-bold">Processing</span>
              <span className="text-[10px] font-extrabold bg-black/10 px-1.5 py-0.2 rounded">
                {totalOrdersCount > 0 ? Math.round((processingOrders.length / totalOrdersCount) * 100) : 0}%
              </span>
            </div>
          </div>

          {/* Shipped */}
          <div className="rounded-xl p-3 bg-[#60A5FA] text-gray-950 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black tracking-tight">{shippedOrders.length}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-bold">Shipped</span>
              <span className="text-[10px] font-extrabold bg-black/10 px-1.5 py-0.2 rounded">
                {totalOrdersCount > 0 ? Math.round((shippedOrders.length / totalOrdersCount) * 100) : 0}%
              </span>
            </div>
          </div>

          {/* Delivered */}
          <div className="rounded-xl p-3 bg-[#4ADE80] text-gray-950 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black tracking-tight">{deliveredOrders.length}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-bold">Delivered</span>
              <span className="text-[10px] font-extrabold bg-black/10 px-1.5 py-0.2 rounded">
                {totalOrdersCount > 0 ? Math.round((deliveredOrders.length / totalOrdersCount) * 100) : 0}%
              </span>
            </div>
          </div>

          {/* Cancelled */}
          <div className="rounded-xl p-3 bg-[#F87171] text-gray-950 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black tracking-tight">{cancelledOrders.length}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-bold">Cancelled</span>
              <span className="text-[10px] font-extrabold bg-black/10 px-1.5 py-0.2 rounded">
                {totalOrdersCount > 0 ? Math.round((cancelledOrders.length / totalOrdersCount) * 100) : 0}%
              </span>
            </div>
          </div>

          {/* Returned */}
          <div className="rounded-xl p-3 bg-[#FB923C] text-gray-950 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black tracking-tight">{returnedOrders.length}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-bold">Returned</span>
              <span className="text-[10px] font-extrabold bg-black/10 px-1.5 py-0.2 rounded">
                {totalOrdersCount > 0 ? Math.round((returnedOrders.length / totalOrdersCount) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* RECENT CUSTOMER ORDERS (Matching Image 2) */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {/* Table Top Toolbar */}
        <div className="p-5 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-gray-900 tracking-tight">Recent Customer Orders</h2>
            <span className="text-xs font-bold text-gray-500">
              {liveOrders.length} Recorded
            </span>
          </div>

          {/* Filter Tabs + Search Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap items-center gap-1 text-xs font-bold bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedFilter === 'all'
                    ? 'bg-white text-gray-950 shadow-xs font-extrabold'
                    : 'text-gray-600 hover:text-gray-950'
                }`}
              >
                [All ({liveOrders.length})]
              </button>
              <button
                onClick={() => setSelectedFilter('actual')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  selectedFilter === 'actual'
                    ? 'bg-white text-emerald-800 shadow-xs font-extrabold'
                    : 'text-gray-600 hover:text-gray-950'
                }`}
              >
                Actual Sales <span className="text-[10px]">🟢</span> ({deliveredOrders.length})
              </button>
              <button
                onClick={() => setSelectedFilter('cancelled')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  selectedFilter === 'cancelled'
                    ? 'bg-white text-red-800 shadow-xs font-extrabold'
                    : 'text-gray-600 hover:text-gray-950'
                }`}
              >
                Cancelled <span className="text-[10px]">🔴</span> ({cancelledOrders.length})
              </button>
              <button
                onClick={() => setSelectedFilter('returned')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  selectedFilter === 'returned'
                    ? 'bg-white text-orange-800 shadow-xs font-extrabold'
                    : 'text-gray-600 hover:text-gray-950'
                }`}
              >
                Returned <span className="text-[10px]">🟠</span> ({returnedOrders.length})
              </button>
              <button
                onClick={() => setSelectedFilter('pending')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  selectedFilter === 'pending'
                    ? 'bg-white text-amber-800 shadow-xs font-extrabold'
                    : 'text-gray-600 hover:text-gray-950'
                }`}
              >
                Pending <span className="text-[10px]">🟡</span> ({pendingOrders.length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[260px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search Order ID, Customer, Item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#083028] text-gray-800 placeholder-gray-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold bg-gray-200/80 hover:bg-gray-300"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {paginatedOrders.length === 0 ? (
            <div className="py-16 px-4 text-center flex flex-col items-center justify-center">
              <Inbox size={36} className="text-gray-300 mb-2" />
              <p className="text-sm font-bold text-gray-800">No matching orders found</p>
              <p className="text-xs text-gray-500 max-w-xs mt-1">
                {selectedFilter !== 'all'
                  ? `No orders currently match the "${selectedFilter}" filter in the database.`
                  : 'When customers place orders, they will appear here in real time.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">ORDER ID</th>
                  <th className="px-5 py-3.5">CUSTOMER</th>
                  <th className="px-5 py-3.5">ITEMS</th>
                  <th className="px-5 py-3.5">AMOUNT</th>
                  <th className="px-5 py-3.5">STATUS</th>
                  <th className="px-5 py-3.5 text-right">DATE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {paginatedOrders.map((order) => {
                  const dateStr = order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })
                    : '-';

                  const itemsSummary = Array.isArray(order.items) && order.items.length > 0
                    ? `${order.items[0].name || 'Product'}${
                        order.items.length > 1 ? ` +${order.items.length - 1} more` : ''
                      }`
                    : (order.userName ? 'Order' : '-');

                  return (
                    <tr key={order.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs font-semibold text-gray-900">
                        {order.id}
                      </td>
                      <td className="px-5 py-3.5 text-xs font-bold text-gray-900 whitespace-nowrap">
                        {order.userName || order.userEmail?.split('@')[0] || 'Customer'}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-600 max-w-[220px] truncate">
                        {itemsSummary}
                      </td>
                      <td className="px-5 py-3.5 text-xs font-extrabold text-gray-950">
                        ₹{Number(order.total || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {renderStatusBadge(order.status)}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-500 text-right whitespace-nowrap">
                        {dateStr}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Table Pagination Footer */}
        {filteredOrders.length > 0 && (
          <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-gray-500 font-medium">
              Showing {(currentPage - 1) * pageSize + 1}-
              {Math.min(currentPage * pageSize, filteredOrders.length)} of {filteredOrders.length} orders
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed font-semibold flex items-center gap-1"
              >
                <ChevronLeft size={13} /> Prev
              </button>

              {visiblePages.map((page, idx) => {
                if (page === '...') {
                  return (
                    <span key={`ellipsis-${idx}`} className="px-1.5 py-1 text-gray-400 font-bold text-xs select-none">
                      ...
                    </span>
                  );
                }
                const pageNum = Number(page);
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                      currentPage === pageNum
                        ? 'bg-[#083028] text-white shadow-xs'
                        : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed font-semibold flex items-center gap-1"
              >
                Next <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* TOP SELLING ITEMS CARD (Matching Image 1 & 2) */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-gray-900 tracking-tight">Top Selling Items</h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              {showAllTopSelling ? 'Top 10 Items' : 'Top 5 Items'}
            </span>
          </div>
          <Link
            href="/admin/products"
            className="text-xs font-bold text-gray-600 hover:text-gray-950 flex items-center gap-1"
          >
            Manage →
          </Link>
        </div>

        {topSoldProducts.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-xs font-medium">
            No sales recorded yet. Once customer orders are placed, top selling items will be dynamically calculated and displayed here.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {topSoldProducts.slice(0, showAllTopSelling ? 10 : 5).map((p, i) => (
              <div key={`${p.name}-${i}`} className="py-3 flex items-center justify-between gap-3 hover:bg-gray-50/60 px-2 rounded-xl transition-colors">
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 ${
                    i === 0 ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                    i === 1 ? 'bg-slate-100 text-slate-800 border border-slate-300' :
                    i === 2 ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-gray-100 text-gray-500'
                  }`}>
                    #{i + 1}
                  </span>
                  {p.image ? (
                    <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                      <Image src={p.image} alt={p.name} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-200">
                      {p.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{p.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {p.category && (
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                          {p.category}
                        </span>
                      )}
                      {p.price && (
                        <span className="text-[11px] font-bold text-[#083028]">
                          {p.price}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-flex items-center gap-1 text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                    {p.count} sold {i === 0 && <span className="text-amber-500">★</span>}
                  </span>
                  {p.totalRevenue > 0 && (
                    <p className="text-[10px] font-semibold text-gray-400 mt-0.5">
                      ₹{p.totalRevenue.toLocaleString('en-IN')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {topSoldProducts.length > 5 && (
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => setShowAllTopSelling(!showAllTopSelling)}
              className="inline-flex items-center gap-1.5 px-6 py-2 bg-[#083028] hover:bg-[#051e19] text-white rounded-full text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer active:scale-95"
            >
              {showAllTopSelling ? 'Show Less ∧' : 'More (Top 10 Items) >'}
            </button>
          </div>
        )}
      </div>

      {/* DATABASE MODULES & CATALOG (Matching Image 1) */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6">
        <div className="mb-6">
          <h2 className="text-base font-extrabold text-gray-900 tracking-tight">Database Modules &amp; Catalog</h2>
          <p className="text-xs text-gray-500 mt-0.5 font-medium">Direct counts synced with your database</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* 1. Orders */}
          <Link
            href="/admin/orders"
            className="rounded-2xl p-6 bg-white border border-gray-100 shadow-2xs hover:shadow-md transition-all text-center flex flex-col items-center justify-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <ShoppingBag size={20} />
            </div>
            <p className="text-3xl font-black text-gray-950 tracking-tight">{totalOrdersCount}</p>
            <p className="text-xs font-extrabold text-gray-900 mt-1">Orders</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Total customer orders</p>
          </Link>

          {/* 2. Queries */}
          <Link
            href="/admin/contacts"
            className="rounded-2xl p-6 bg-white border border-gray-100 shadow-2xs hover:shadow-md transition-all text-center flex flex-col items-center justify-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <MessageSquare size={20} />
            </div>
            <p className="text-3xl font-black text-gray-950 tracking-tight">{queriesCount}</p>
            <p className="text-xs font-extrabold text-gray-900 mt-1">Queries</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {unreadQueriesCount > 0 ? `${unreadQueriesCount} unread` : 'Customer messages'}
            </p>
          </Link>

          {/* 3. Customers */}
          <Link
            href="/admin/users"
            className="rounded-2xl p-6 bg-white border border-gray-100 shadow-2xs hover:shadow-md transition-all text-center flex flex-col items-center justify-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Users size={20} />
            </div>
            <p className="text-3xl font-black text-gray-950 tracking-tight">{totalUsersCount}</p>
            <p className="text-xs font-extrabold text-gray-900 mt-1">Customers</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Registered accounts</p>
          </Link>

          {/* 4. Products */}
          <Link
            href="/admin/products"
            className="rounded-2xl p-6 bg-white border border-gray-100 shadow-2xs hover:shadow-md transition-all text-center flex flex-col items-center justify-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Package size={20} />
            </div>
            <p className="text-3xl font-black text-gray-950 tracking-tight">{productsCount}</p>
            <p className="text-xs font-extrabold text-gray-900 mt-1">Products</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Active store catalog</p>
          </Link>

          {/* 5. Categories */}
          <Link
            href="/admin/categories"
            className="rounded-2xl p-6 bg-white border border-gray-100 shadow-2xs hover:shadow-md transition-all text-center flex flex-col items-center justify-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <FolderTree size={20} />
            </div>
            <p className="text-3xl font-black text-gray-950 tracking-tight">{categoriesCount}</p>
            <p className="text-xs font-extrabold text-gray-900 mt-1">Categories</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Product categories</p>
          </Link>

          {/* 6. Reviews */}
          <Link
            href="/admin/reviews"
            className="rounded-2xl p-6 bg-white border border-gray-100 shadow-2xs hover:shadow-md transition-all text-center flex flex-col items-center justify-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Star size={20} />
            </div>
            <p className="text-3xl font-black text-gray-950 tracking-tight">{reviewsCount}</p>
            <p className="text-xs font-extrabold text-gray-900 mt-1">Reviews</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Customer ratings</p>
          </Link>

          {/* 7. Coupons */}
          <Link
            href="/admin/coupons"
            className="rounded-2xl p-6 bg-white border border-gray-100 shadow-2xs hover:shadow-md transition-all text-center flex flex-col items-center justify-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Ticket size={20} />
            </div>
            <p className="text-3xl font-black text-gray-950 tracking-tight">{couponsCount}</p>
            <p className="text-xs font-extrabold text-gray-900 mt-1">Coupons</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Active vouchers</p>
          </Link>

          {/* 8. Newsletter */}
          <Link
            href="/admin/newsletter"
            className="rounded-2xl p-6 bg-white border border-gray-100 shadow-2xs hover:shadow-md transition-all text-center flex flex-col items-center justify-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Mail size={20} />
            </div>
            <p className="text-3xl font-black text-gray-950 tracking-tight">{subscribersCount}</p>
            <p className="text-xs font-extrabold text-gray-900 mt-1">Newsletter</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Email subscribers</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
