'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2, RefreshCw, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/lib/adminData';

export default function NewArrivalsManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedMsg, setSavedMsg] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products?is_new_arrival=true');
      const data: Record<string, unknown>[] = await res.json();
      setProducts(
        data.map((d) => ({
          id: d.id as string,
          name: d.name as string,
          price: d.price as string,
          image: d.image as string,
          active: d.active as boolean,
          isNewArrival: d.is_new_arrival as boolean,
          isBestSeller: d.is_best_seller as boolean,
          order: d.sort_order as number,
        })).sort((a, b) => a.order - b.order)
      );
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const flash = (msg: string) => {
    setSavedMsg(msg);
    setTimeout(() => setSavedMsg(''), 2500);
  };

  const toggleActive = async (product: Product) => {
    try {
      await fetch(`/api/products?id=${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !product.active }),
      });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, active: !p.active } : p))
      );
      flash('✓ Updated!');
    } catch {
      alert('Failed to update product.');
    }
  };

  const removeFromSection = async (product: Product) => {
    if (!confirm(`Remove "${product.name}" from New Arrivals section?`)) return;
    try {
      await fetch(`/api/products?id=${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isNewArrival: false }),
      });
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      flash('✓ Removed from New Arrivals!');
    } catch {
      alert('Failed to remove product.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">New Arrivals</h2>
          <p className="text-sm text-gray-500">
            {loading ? 'Loading...' : `${products.filter((p) => p.active).length} active · ${products.length} total`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {savedMsg && (
            <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">{savedMsg}</span>
          )}
          <button onClick={load} className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <Link
            href="/admin/products"
            className="flex items-center gap-1.5 text-xs font-bold text-[#083028] border border-[#083028] px-3 py-2 rounded-xl hover:bg-[#083028] hover:text-white transition-colors"
          >
            <ExternalLink size={13} /> Manage in Products
          </Link>
        </div>
      </div>

      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 font-medium">
        ℹ️ To add a product here, go to <strong>Products &amp; Catalog</strong> and check the <strong>New Arrivals</strong> checkbox on any product.
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 gap-3 text-gray-400">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm">Loading from database...</span>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border border-gray-100">
          <p className="text-sm font-medium">No New Arrivals set yet.</p>
          <p className="text-xs mt-1">Mark products as <strong>New Arrivals</strong> in the Products page.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product, idx) => (
            <div
              key={product.id}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                product.active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'
              }`}
            >
              <span className="text-xs font-bold text-gray-300 w-5 text-center">{idx + 1}</span>
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
                <Image src={product.image} alt={product.name} fill className="object-cover object-top" sizes="56px" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{product.name}</p>
                <p className="text-sm font-bold text-[#083028]">{product.price}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleActive(product)}
                  title={product.active ? 'Hide from storefront' : 'Show on storefront'}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    product.active ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  {product.active ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button
                  onClick={() => removeFromSection(product)}
                  title="Remove from New Arrivals"
                  className="w-8 h-8 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
