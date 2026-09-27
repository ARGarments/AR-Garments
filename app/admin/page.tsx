'use client';

import { useEffect, useState } from 'react';
import {
  ShoppingBag, Users, TrendingUp, Package,
  ArrowUpRight, ArrowDownRight, Eye, Clock,
  CheckCircle, Truck, RotateCcw, AlertTriangle,
  ExternalLink, Ticket,
} from 'lucide-react';
import Link from 'next/link';
import { adminData } from '@/lib/adminData';

const statsCards = [
  {
    label: 'Total Orders',
    value: '1,284',
    change: '+12.5%',
    up: true,
    period: 'vs last month',
    icon: ShoppingBag,
    color: 'bg-blue-50 text-blue-600',
  },
  {
    label: 'Total Revenue',
    value: '₹8,42,500',
    change: '+18.2%',
    up: true,
    period: 'vs last month',
    icon: TrendingUp,
    color: 'bg-green-50 text-green-600',
  },
  {
    label: 'Total Customers',
    value: '3,921',
    change: '+6.8%',
    up: true,
    period: 'vs last month',
    icon: Users,
    color: 'bg-purple-50 text-purple-600',
  },
  {
    label: 'Pending Orders',
    value: '47',
    change: '-3.2%',
    up: false,
    period: 'vs last month',
    icon: Package,
    color: 'bg-amber-50 text-amber-600',
  },
];

const recentOrders = [
  { id: '#ORD-1091', customer: 'Priya Sharma', product: 'Silk Blend Saree', amount: '₹1,499', status: 'Delivered', date: 'Sep 25, 2026' },
  { id: '#ORD-1090', customer: 'Rohan Verma', product: 'Anarkali Suit', amount: '₹999', status: 'Shipped', date: 'Sep 25, 2026' },
  { id: '#ORD-1089', customer: 'Meena Patel', product: 'Cotton Suit Set', amount: '₹899', status: 'Processing', date: 'Sep 24, 2026' },
  { id: '#ORD-1088', customer: 'Sonia Gupta', product: 'Embroidered Saree', amount: '₹1,299', status: 'Pending', date: 'Sep 24, 2026' },
  { id: '#ORD-1087', customer: 'Kavya Singh', product: 'Party Wear Saree', amount: '₹1,799', status: 'Delivered', date: 'Sep 23, 2026' },
  { id: '#ORD-1086', customer: 'Aarav Mishra', product: 'Rayon Kurti Set', amount: '₹799', status: 'Returned', date: 'Sep 23, 2026' },
];

const topProducts = [
  { name: 'Silk Blend Saree', sold: 142, revenue: '₹2,12,858', image: '/home-images/Silk Blend Saree.jpg' },
  { name: 'Embroidered Saree', sold: 118, revenue: '₹1,53,282', image: '/home-images/Embroidered Saree.jpg' },
  { name: 'Anarkali Suit', sold: 94, revenue: '₹93,906', image: '/home-images/Anarkali Suit.jpg' },
  { name: 'Rayon Kurti Set', sold: 87, revenue: '₹69,513', image: '/home-images/Rayon Kurti Set.jpg' },
  { name: 'Cotton Suit Set', sold: 76, revenue: '₹68,324', image: '/home-images/Cotton Suit Set.jpg' },
];

const orderStatusConfig: Record<string, { icon: React.ReactNode; cls: string }> = {
  Delivered: { icon: <CheckCircle size={12} />, cls: 'bg-green-100 text-green-700' },
  Shipped: { icon: <Truck size={12} />, cls: 'bg-blue-100 text-blue-700' },
  Processing: { icon: <Clock size={12} />, cls: 'bg-amber-100 text-amber-700' },
  Pending: { icon: <AlertTriangle size={12} />, cls: 'bg-orange-100 text-orange-700' },
  Returned: { icon: <RotateCcw size={12} />, cls: 'bg-red-100 text-red-700' },
};

const orderPipeline = [
  { label: 'Pending', count: 47, color: 'bg-orange-400' },
  { label: 'Processing', count: 23, color: 'bg-amber-400' },
  { label: 'Shipped', count: 89, color: 'bg-blue-400' },
  { label: 'Delivered', count: 1087, color: 'bg-green-400' },
  { label: 'Returned', count: 38, color: 'bg-red-400' },
];

export default function AdminDashboard() {
  const [heroCount, setHeroCount] = useState(0);
  const [newArrivalsCount, setNewArrivalsCount] = useState(0);
  const [bestSellersCount, setBestSellersCount] = useState(0);
  const [testimonialsCount, setTestimonialsCount] = useState(0);
  const [couponsCount, setCouponsCount] = useState(0);

  useEffect(() => {
    setHeroCount(adminData.getHeroSlides().filter(s => s.active).length);
    setNewArrivalsCount(adminData.getNewArrivals().filter(p => p.active).length);
    setBestSellersCount(adminData.getBestSellers().filter(p => p.active).length);
    setTestimonialsCount(adminData.getTestimonials().filter(t => t.active).length);

    fetch('/api/coupons?active=true', { cache: 'no-store' })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data)) setCouponsCount(data.length);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back! Here&apos;s what&apos;s happening with your store.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {statsCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${card.color}`}>
                  <Icon size={20} />
                </div>
                <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                  card.up ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                }`}>
                  {card.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {card.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-sm text-gray-500 mt-1">{card.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{card.period}</p>
            </div>
          );
        })}
      </div>

      {/* Order Pipeline */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 mb-5">Order Pipeline</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {orderPipeline.map((item) => (
            <div key={item.label} className="text-center">
              <div className={`w-full h-2 rounded-full ${item.color} mb-3`} />
              <p className="text-2xl font-bold text-gray-900">{item.count}</p>
              <p className="text-xs text-gray-500 mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Two-column: Recent Orders + Top Products */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">Recent Orders</h2>
            <button className="text-xs text-[#083028] font-semibold hover:underline flex items-center gap-1">
              View All <ExternalLink size={12} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Order ID', 'Customer', 'Product', 'Amount', 'Status', 'Date'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders.map((order) => {
                  const statusCfg = orderStatusConfig[order.status];
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-[#083028] font-semibold">{order.id}</td>
                      <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{order.customer}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-[140px] truncate">{order.product}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{order.amount}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.cls}`}>
                          {statusCfg.icon} {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{order.date}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">Top Selling Products</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {topProducts.map((product, i) => (
              <div key={product.name} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                <span className="text-xs font-bold text-gray-300 w-4">#{i + 1}</span>
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover object-top" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{product.name}</p>
                  <p className="text-xs text-gray-400">{product.sold} sold</p>
                </div>
                <p className="text-xs font-bold text-[#083028]">{product.revenue}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Website Content Overview */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-900">Website Content Overview</h2>
          <Link
            href="/admin/homepage"
            className="text-xs bg-[#083028] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#051e19] transition-colors flex items-center gap-1"
          >
            Manage <ExternalLink size={12} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label: 'Hero Slides', count: heroCount, desc: 'Active slides', icon: Eye, color: 'text-blue-500' },
            { label: 'New Arrivals', count: newArrivalsCount, desc: 'Active products', icon: ShoppingBag, color: 'text-green-500' },
            { label: 'Best Sellers', count: bestSellersCount, desc: 'Active products', icon: TrendingUp, color: 'text-purple-500' },
            { label: 'Coupons', count: couponsCount, desc: 'Active discounts', icon: Ticket, color: 'text-emerald-600', link: '/admin/coupons' },
            { label: 'Testimonials', count: testimonialsCount, desc: 'Active reviews', icon: Users, color: 'text-amber-500' },
          ].map((item) => {
            const Icon = item.icon;
            const content = (
              <div key={item.label} className="bg-gray-50 rounded-xl p-4 text-center hover:bg-gray-100 transition-colors">
                <Icon size={20} className={`mx-auto mb-2 ${item.color}`} />
                <p className="text-2xl font-bold text-gray-900">{item.count}</p>
                <p className="text-xs font-semibold text-gray-700 mt-0.5">{item.label}</p>
                <p className="text-xs text-gray-400">{item.desc}</p>
              </div>
            );
            return item.link ? (
              <Link key={item.label} href={item.link} className="block">
                {content}
              </Link>
            ) : (
              content
            );
          })}
        </div>
      </div>
    </div>
  );
}
