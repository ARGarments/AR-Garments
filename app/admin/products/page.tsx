'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Plus, Search, Upload, Trash2, Edit2,
  ImageIcon, Loader2, X, Sparkles, Flame, RefreshCw, Star, Info, FileText, Truck
} from 'lucide-react';
import { uploadImageToImageKit } from '@/lib/imagekit';
import { Product } from '@/lib/adminData';

const DEFAULT_CATEGORIES = [
  'All', 'Sarees', 'Suits & Dress Material',
  'Dupatta Sets', 'Men Fashion', 'Kids Fashion',
];

type FormData = {
  name: string;
  price: string;
  category: string;
  image: string;
  images: string[];
  description: string;
  specification: string;
  shippingCare: string;
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
  images: [],
  description: '',
  specification: '',
  shippingCare: '',
  stock: 15,
  active: true,
  isNewArrival: false,
  isBestSeller: false,
});

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categoriesList, setCategoriesList] = useState<string[]>(DEFAULT_CATEGORIES);
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
        images: Array.isArray(d.images) && d.images.length > 0
          ? (d.images as string[])
          : (d.image ? [d.image as string] : []),
        description: (d.description as string) || '',
        specification: (d.specification as string) || '',
        shippingCare: (d.shipping_care as string) || '',
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
    // Load categories dynamically from database
    fetch('/api/categories?active=true')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: { name: string }[]) => {
        if (Array.isArray(data) && data.length > 0) {
          const names = ['All', ...data.map((c) => c.name)];
          setCategoriesList(names);
        }
      })
      .catch(() => {});
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
    const existingImages = Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : (product.image ? [product.image] : []);

    setFormData({
      name: product.name,
      price: product.price,
      category: product.category || 'Sarees',
      image: product.image || (existingImages[0] ?? ''),
      images: existingImages,
      description: product.description || '',
      specification: product.specification || '',
      shippingCare: product.shippingCare || '',
      stock: product.stock ?? 15,
      active: product.active,
      isNewArrival: !!product.isNewArrival,
      isBestSeller: !!product.isBestSeller,
    });
    setUploadError('');
    setSaveError('');
    setModalOpen(true);
  };

  // ─── ImageKit Multi-upload ─────────────────────────────────────────────────
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setUploadError('');

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        try {
          const res = await uploadImageToImageKit(file, file.name, '/products');
          return res.url;
        } catch {
          return URL.createObjectURL(file);
        }
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setFormData((prev) => {
        const combined = [...prev.images, ...uploadedUrls];
        return {
          ...prev,
          images: combined,
          image: prev.image || combined[0] || '',
        };
      });
    } catch {
      setUploadError('One or more images failed to upload.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const setPrimaryImage = (imgUrl: string) => {
    setFormData((prev) => ({
      ...prev,
      image: imgUrl,
    }));
  };

  const removeImage = (imgUrl: string) => {
    setFormData((prev) => {
      const remaining = prev.images.filter((img) => img !== imgUrl);
      const newPrimary = prev.image === imgUrl ? (remaining[0] || '') : prev.image;
      return {
        ...prev,
        images: remaining,
        image: newPrimary,
      };
    });
  };

  // ─── Save to Supabase via API ──────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setSaving(true);
    setSaveError('');

    const primaryImg = formData.image || formData.images[0] || '';
    const allImages = formData.images.length > 0 ? formData.images : (primaryImg ? [primaryImg] : []);

    const payload = {
      ...formData,
      image: primaryImg,
      images: allImages,
      specification: formData.specification,
      shippingCare: formData.shippingCare,
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
            Manage multi-image galleries, detailed specifications, descriptions, shipping details &amp; pricing.
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
          {categoriesList.map((cat) => (
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
                  {['Product', 'Category', 'Price', 'Images & Details', 'Homepage Badges', 'Status', 'Actions'].map((h) => (
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
                          {product.image ? (
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              className="object-cover object-top"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <ImageIcon size={18} />
                            </div>
                          )}
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
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-1 text-xs">
                        <span className="inline-flex items-center gap-1 font-semibold text-gray-700">
                          <ImageIcon size={12} className="text-[#083028]" />
                          {Array.isArray(product.images) && product.images.length > 0 ? product.images.length : (product.image ? 1 : 0)} photos
                        </span>
                        <div className="flex items-center gap-1 text-[11px]">
                          {product.description && <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-medium">Desc</span>}
                          {product.specification && <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">Specs</span>}
                          {product.shippingCare && <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-medium">Care</span>}
                        </div>
                      </div>
                    </td>
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
          <div className="relative bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl z-10 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Upload multiple photos, set description, specifications, care details &amp; pricing.
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full">
                <X size={20} />
              </button>
            </div>

            {saveError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                ❌ {saveError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Product Title */}
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

              {/* Price & Category */}
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
                    {categoriesList.filter((c) => c !== 'All').map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Multiple Images Upload via ImageKit */}
              <div className="p-4 bg-gray-50/70 border border-gray-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-gray-800 uppercase">
                    Product Images (Upload Multiple)
                  </label>
                  <span className="text-xs text-gray-500 font-semibold">
                    {formData.images.length} photo{formData.images.length === 1 ? '' : 's'} added
                  </span>
                </div>

                {/* Upload Trigger Dropzone */}
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-[#083028] transition-colors bg-white">
                  <div className="flex flex-col items-center justify-center py-2">
                    <ImageIcon className="text-[#083028]/70 mb-2" size={32} />
                    <p className="text-xs text-gray-700 font-bold mb-1">
                      Upload Photos for Product Gallery
                    </p>
                    <p className="text-[11px] text-gray-400 mb-3">
                      Select multiple images at once (PNG, JPG, WEBP via ImageKit CDN)
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#083028] hover:bg-[#051e19] px-4 py-2.5 rounded-xl transition-colors shadow-xs"
                    >
                      <Upload size={14} /> Select &amp; Upload Multiple Images
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </div>

                {isUploading && (
                  <p className="text-xs text-[#083028] flex items-center gap-1.5 font-semibold">
                    <Loader2 size={14} className="animate-spin" /> Uploading image(s) to ImageKit CDN...
                  </p>
                )}
                {uploadError && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg">ℹ️ {uploadError}</p>
                )}

                {/* Uploaded Images List with Set Primary & Delete actions */}
                {formData.images.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-bold text-gray-600">
                      Gallery Photos (Click Star to select Default Main image):
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {formData.images.map((imgUrl, index) => {
                        const isMain = formData.image === imgUrl || (!formData.image && index === 0);
                        return (
                          <div
                            key={imgUrl + index}
                            className={`relative group rounded-xl overflow-hidden border-2 transition-all bg-white p-1 ${
                              isMain ? 'border-[#083028] shadow-sm ring-2 ring-[#083028]/20' : 'border-gray-200'
                            }`}
                          >
                            <div className="relative w-full h-28 rounded-lg overflow-hidden bg-gray-50">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={imgUrl}
                                alt={`Image ${index + 1}`}
                                className="w-full h-full object-cover object-top"
                              />
                            </div>

                            {/* Main Badge */}
                            {isMain && (
                              <span className="absolute top-2 left-2 bg-[#083028] text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-0.5">
                                <Star size={10} fill="currentColor" /> Main
                              </span>
                            )}

                            {/* Control overlay */}
                            <div className="flex items-center justify-between mt-1 px-1">
                              {!isMain ? (
                                <button
                                  type="button"
                                  onClick={() => setPrimaryImage(imgUrl)}
                                  className="text-[11px] text-[#083028] hover:underline font-semibold flex items-center gap-1"
                                >
                                  <Star size={11} /> Set Main
                                </button>
                              ) : (
                                <span className="text-[11px] text-emerald-700 font-bold">Default</span>
                              )}
                              <button
                                type="button"
                                onClick={() => removeImage(imgUrl)}
                                className="text-gray-400 hover:text-red-600 p-1 transition-colors"
                                title="Remove Image"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 1. Product Description */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 uppercase mb-1">
                  <Info size={14} className="text-[#083028]" />
                  Product Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Overview of the product design, embroidery highlights, drape, and aesthetic appeal..."
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083028] leading-relaxed"
                />
              </div>

              {/* 2. Product Specifications */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 uppercase mb-1">
                  <FileText size={14} className="text-[#083028]" />
                  Product Specifications (Fabric, Occasion, Work, Dimensions)
                </label>
                <textarea
                  rows={3}
                  value={formData.specification}
                  onChange={(e) => setFormData({ ...formData, specification: e.target.value })}
                  placeholder="e.g. Fabric: Pure Silk Blend | Work: Zari Woven Border | Length: 5.5 meters saree + 0.8 meter blouse | Occasion: Festive & Wedding"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083028] leading-relaxed"
                />
              </div>

              {/* 3. Shipping & Care Instructions */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 uppercase mb-1">
                  <Truck size={14} className="text-[#083028]" />
                  Shipping &amp; Care Details
                </label>
                <textarea
                  rows={3}
                  value={formData.shippingCare}
                  onChange={(e) => setFormData({ ...formData, shippingCare: e.target.value })}
                  placeholder="e.g. Dispatch Time: Dispatched within 24 hours | Wash Care: Dry Clean Recommended | Returns: 7-day easy exchange & return"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083028] leading-relaxed"
                />
              </div>

              {/* Stock Quantity */}
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
