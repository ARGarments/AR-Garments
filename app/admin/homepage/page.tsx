'use client';

import { useState } from 'react';
import { Image as ImageIcon, ShoppingBag, TrendingUp } from 'lucide-react';
import HeroManager from '@/components/admin/homepage/HeroManager';
import NewArrivalsManager from '@/components/admin/homepage/NewArrivalsManager';
import BestSellersManager from '@/components/admin/homepage/BestSellersManager';

const tabs = [
  { id: 'hero', label: 'Hero Section', icon: ImageIcon },
  { id: 'new-arrivals', label: 'New Arrivals', icon: ShoppingBag },
  { id: 'best-sellers', label: 'Best Sellers', icon: TrendingUp },
];

export default function HomepageAdminPage() {
  const [activeTab, setActiveTab] = useState('hero');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Home Page Management</h1>
        <p className="text-sm text-gray-500 mt-1">Manage what visitors see on your homepage.</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex overflow-x-auto border-b border-gray-100 px-2 pt-2 gap-1 scrollbar-none">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-t-xl whitespace-nowrap transition-all border-b-2 -mb-px ${
                activeTab === id
                  ? 'border-[#083028] text-[#083028] bg-[#083028]/5'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'hero' && <HeroManager />}
          {activeTab === 'new-arrivals' && <NewArrivalsManager />}
          {activeTab === 'best-sellers' && <BestSellersManager />}
        </div>
      </div>
    </div>
  );
}
