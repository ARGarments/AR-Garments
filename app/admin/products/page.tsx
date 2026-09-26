'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Plus, Search, Upload, Trash2, Edit2,
  ImageIcon, Loader2, X, Sparkles, Flame, RefreshCw,
} from 'lucide-react';
import { uploadImageToImageKit } from '@/lib/imagekit';
import { Product } from '@/lib/adminData';

const CATEGORIES = [
  'All', 'Sarees', 'Suits & Dress Material',
  'Dupatta Sets', 'Men Fashion', 'Kids Fashion',
];

type FormData = {
  name: string;
  price: string;
  category: string;
  image: string;
  stock: number;
  active: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
};

const emptyForm = (): FormData => ({
  name: '',
  price: '₹',
  category: 'Sarees',
  image: '',
  stock: 15,
  active: true,
  isNewArrival: false,
  isBestSeller: false,
});

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm());
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Load products from Supabase via API ──────────────────────────────────
  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      // Map DB columns to Product shape
      const mapped: Product[] = data.map((d: Record<string, unknown>) => ({
        id: d.id as string,
        name: d.name as string,
        price: d.price as string,
        numericPrice: d.numeric_price as number,
        category: d.category as string,
        image: d.image as string,
        stock: d.stock as number,
        active: d.active as boolean,
        isNewArrival: d.is_new_arrival as boolean,
        isBestSeller: d.is_best_seller as boolean,
        order: d.sort_order as number,
      }));
      setProducts(mapped);
    } catch {
      setSaveError('Could not load products from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // ─── Filtered list ─────────────────────────────────────────────────────────
  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.price.includes(searchQuery);
    return matchCat && matchSearch;
  });

  // ─── Modal helpers ─────────────────────────────────────────────────────────
  const openAddModal = () => {
    setEditingProduct(null);
    setFormData(emptyForm());
    setUploadError('');
    setSaveError('');
    setModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price,
      category: product.category || 'Sarees',
      image: product.image,
      stock: product.stock ?? 15,
      active: product.active,
      isNewArrival: !!product.isNewArrival,
      isBestSeller: !!product.isBestSeller,
    });
    setUploadError('');
    setSaveError('');
    setModalOpen(true);
  };

  // ─── ImageKit upload ───────────────────────────────────────────────────────
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadError('');
    try {
      const res = await uploadImageToImageKit(file, file.name, '/products');
      setFormData((prev) => ({ ...prev, image: res.url }));
    } catch {
      const previewUrl = URL.createObjectURL(file);
      setFormData((prev) => ({ ...prev, image: previewUrl }));
      setUploadError('Using local preview — ImageKit fallback.');
    } finally {
      setIsUploading(false);
    }
  };

  // ─── Save to Supabase via API ──────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setSaving(true);
    setSaveError('');

    const payload = {
      ...formData,
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      order: editingProduct ? editingProduct.order : products.length + 1,
    };

    try {
      let res: Response;
      if (editingProduct) {
        res = await fetch(`/api/products?id=${editingProduct.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Save failed');
      }

      setModalOpen(false);
      await loadProducts(); // Refresh from DB
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete from Supabase ──────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      await loadProducts();
    } catch {
      alert('Failed to delete product.');
    }
  };

  // ─── Quick toggle via PATCH ────────────────────────────────────────────────
  const toggleFlag = async (
    product: Product,
    flag: 'isNewArrival' | 'isBestSeller' | 'active'
  ) => {
    const updated = { [flag]: !product[flag] };
    try {
      const res = await fetch(`/api/products?id=${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error();
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, ...updated } : p))
      );
    } catch {
      alert('Failed to update. Please try again.');
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products &amp; Catalog</h1>
          <p className="text-sm text-gray-500 mt-1">
            All changes save directly to Supabase and appear live on the website.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadProducts}
            title="Refresh"
            className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 bg-[#083028] hover:bg-[#051e19] text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-sm"
          >
            <Plus size={18} />
            Add Product
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or price..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083028]"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#083028] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
            <Loader2 size={22} className="animate-spin" />
            <span className="text-sm font-medium">Loading from database...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            No products found. Add your first product!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Product', 'Category', 'Price', 'Homepage Badges', 'Status', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider ${
                        h === 'Actions' ? 'text-right pr-5' : 'text-left'
                      } ${h === 'Homepage Badges' ? 'text-center' : ''}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover object-top"
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 leading-tight">{product.name}</p>
                          <p className="text-[11px] text-gray-400 font-mono mt-0.5">ID: {product.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg font-medium">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-[#083028]">{product.price}</td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => toggleFlag(product, 'isNewArrival')}
                          title="Toggle New Arrivals"
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                            product.isNewArrival
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-gray-100 text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          <Sparkles size={12} />
                          New
                        </button>
                        <button
                          onClick={() => toggleFlag(product, 'isBestSeller')}
                          title="Toggle Best Sellers"
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                            product.isBestSeller
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-gray-100 text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          <Flame size={12} />
                          Best
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => toggleFlag(product, 'active')}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                          product.active
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${product.active ? 'bg-green-600' : 'bg-gray-400'}`} />
                        {product.active ? 'Active' : 'Draft'}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(product)}
                        className="p-1.5 text-gray-500 hover:text-[#083028] hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <h2 className="text-lg font-bold text-gray-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-full">
                <X size={20} />
              </button>
            </div>

            {saveError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                ❌ {saveError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Product Title *</label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Royal Embroidered Silk Saree"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083028]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Price *</label>
                  <input
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="₹1,499"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083028]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#083028]"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Stock Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083028]"
                />
              </div>

              {/* Homepage section flags */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3">
                <p className="text-xs font-extrabold text-gray-900 uppercase tracking-wide">
                  Show on Homepage Sections
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2.5 p-2.5 bg-white rounded-xl border border-gray-200 cursor-pointer hover:border-[#083028] transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.isNewArrival}
                      onChange={(e) => setFormData({ ...formData, isNewArrival: e.target.checked })}
                      className="w-4 h-4 accent-[#083028] cursor-pointer"
                    />
                    <span className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                      <Sparkles size={14} className="text-emerald-600" /> New Arrivals
                    </span>
                  </label>
                  <label className="flex items-center gap-2.5 p-2.5 bg-white rounded-xl border border-gray-200 cursor-pointer hover:border-[#083028] transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.isBestSeller}
                      onChange={(e) => setFormData({ ...formData, isBestSeller: e.target.checked })}
                      className="w-4 h-4 accent-[#083028] cursor-pointer"
                    />
                    <span className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                      <Flame size={14} className="text-amber-600" /> Best Sellers
                    </span>
                  </label>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 accent-[#083028] cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-gray-700">Active on Storefront</span>
                </label>
              </div>

              {/* ImageKit Upload */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Product Image (ImageKit)
                </label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-[#083028] transition-colors">
                  {formData.image ? (
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={formData.image} alt="Preview" className="w-full h-full object-cover object-top" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-xs font-medium text-gray-700 truncate">{formData.image}</p>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="mt-2 text-xs font-bold text-[#083028] hover:underline flex items-center gap-1"
                        >
                          <Upload size={13} /> Replace image
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <ImageIcon className="mx-auto text-gray-400 mb-2" size={28} />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs font-bold text-[#083028] bg-[#083028]/10 hover:bg-[#083028]/20 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Upload to ImageKit
                      </button>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
                </div>
                {isUploading && (
                  <p className="text-xs text-[#083028] mt-1.5 flex items-center gap-1.5 font-medium">
                    <Loader2 size={13} className="animate-spin" /> Uploading to ImageKit CDN...
                  </p>
                )}
                {uploadError && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg mt-2">ℹ️ {uploadError}</p>
                )}
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-gray-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || saving}
                  className="flex-1 py-2.5 bg-[#083028] hover:bg-[#051e19] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : (editingProduct ? 'Save Changes' : 'Create Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
