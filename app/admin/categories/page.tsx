'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  FolderTree,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  X,
  Layers,
  Sparkles,
  ArrowUpDown,
  ExternalLink,
  UploadCloud,
  Image as ImageIcon,
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  sortOrder?: number;
  active: boolean;
  createdAt?: string;
}

const PRESET_IMAGES = [
  { label: 'Sarees', url: '/home-images/Sarees.jpg' },
  { label: 'Suits', url: '/home-images/Suits & Dress Materia.jpg' },
  { label: 'Dupatta', url: '/home-images/Dupatta Sets.jpg' },
  { label: 'Men Fashion', url: '/home-images/Men Fashion.jpg' },
  { label: 'Kids Fashion', url: '/home-images/Kids Fashion.jpg' },
];

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [active, setActive] = useState(true);

  // ImageKit upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/categories', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : []);
      }
    } catch {
      showToast('Could not load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setImage('');
    setSortOrder(categories.length + 1);
    setActive(true);
    setError(null);
    setUploadError(null);
    setUploadingImage(false);
    setModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setImage(cat.image || '');
    setSortOrder(cat.sortOrder ?? 0);
    setActive(cat.active);
    setError(null);
    setUploadError(null);
    setUploadingImage(false);
    setModalOpen(true);
  };

  const handleFileProcess = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WEBP, etc.)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image size exceeds 10MB limit.');
      return;
    }

    setUploadingImage(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', '/categories');
      const safeName = name ? name.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'category';
      formData.append('fileName', `${safeName}_${Date.now()}`);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload image to ImageKit');
      }

      setImage(data.url);
      showToast('Image uploaded to ImageKit!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setUploadError(msg);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingCategory) {
      // Auto generate slug
      const generated = val
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generated);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a category name.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (editingCategory) {
        // PUT
        const res = await fetch('/api/categories', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingCategory.id,
            name: name.trim(),
            slug: slug.trim(),
            description: description.trim(),
            image: image.trim(),
            sortOrder,
            active,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to update category');
        }
        showToast('Category updated successfully');
      } else {
        // POST
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            slug: slug.trim(),
            description: description.trim(),
            image: image.trim(),
            sortOrder,
            active,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to create category');
        }
        showToast('Category created successfully');
      }

      setModalOpen(false);
      loadCategories();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    if (!confirm(`Are you sure you want to delete category "${catName}"?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/categories?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showToast(`Category "${catName}" deleted`);
        loadCategories();
      } else {
        showToast('Failed to delete category');
      }
    } catch {
      showToast('Error deleting category');
    }
  };

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-[#083028] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-top-2">
          <CheckCircle size={18} className="text-[#B8860B]" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <FolderTree className="w-7 h-7 text-[#083028]" />
            Category Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Create and customize product categories for the navigation menu and catalog.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 bg-[#083028] hover:bg-[#051e19] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm hover:shadow-md shrink-0"
        >
          <Plus size={18} />
          Add Category
        </button>
      </div>

      {/* Search & Stats Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories by name, slug or description..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083028]/20 focus:border-[#083028] transition"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
          <span className="bg-[#083028]/5 text-[#083028] px-3 py-1.5 rounded-lg border border-[#083028]/10 font-bold">
            Total: {categories.length}
          </span>
          <span className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-100 font-bold">
            Active: {categories.filter((c) => c.active).length}
          </span>
        </div>
      </div>

      {/* Table / List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-[#083028] animate-spin" />
            <p className="text-sm text-gray-500">Loading categories from database...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-16 text-center">
            <FolderTree className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800">No categories found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? 'No categories match your search term. Try a different query.'
                : 'Get started by creating your first product category.'}
            </p>
            {!searchQuery && (
              <button
                onClick={openAddModal}
                className="mt-4 inline-flex items-center gap-2 bg-[#083028] text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-[#051e19] transition"
              >
                <Plus size={15} /> Add Category
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-[#FAF8F3] text-xs uppercase font-bold text-[#083028] border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Slug &amp; Link</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4 text-center">Sort</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-50/70 transition">
                    {/* Category Thumbnail & Name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 relative shrink-0 border border-gray-200 shadow-2xs">
                          {cat.image ? (
                            <Image
                              src={cat.image}
                              alt={cat.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#083028] font-bold text-base bg-[#083028]/10">
                              {cat.name[0]}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{cat.name}</p>
                          <p className="text-[11px] text-gray-400 font-mono">ID: {cat.id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Slug & Storefront Link */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-mono text-xs text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg w-fit">
                        <span>/category?category={cat.name}</span>
                        <a
                          href={`/category?category=${encodeURIComponent(cat.name)}`}
                          target="_blank"
                          rel="noreferrer"
                          title="View on Storefront"
                          className="text-[#083028] hover:text-[#B8860B] transition-colors"
                        >
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="px-6 py-4 max-w-xs">
                      <p className="text-xs text-gray-600 truncate" title={cat.description}>
                        {cat.description || <span className="text-gray-400 italic">—</span>}
                      </p>
                    </td>

                    {/* Sort Order */}
                    <td className="px-6 py-4 text-center">
                      <span className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                        {cat.sortOrder ?? 0}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 text-center">
                      {cat.active ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle size={12} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                          <XCircle size={12} /> Inactive
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(cat)}
                          title="Edit Category"
                          className="p-1.5 rounded-lg text-gray-500 hover:text-[#083028] hover:bg-gray-100 transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id, cat.name)}
                          title="Delete Category"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Add / Edit Category */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 overflow-hidden relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {editingCategory ? 'Edit Category' : 'Create New Category'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {editingCategory
                    ? 'Update the category details below.'
                    : 'Add a new product category to your store.'}
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-5 p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200 flex items-center gap-2">
                <XCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              {/* Category Name */}
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., Banarasi Sarees, Festive Kurtis"
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083028]/20 focus:border-[#083028] transition font-medium text-gray-800"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">
                  URL Slug
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g., banarasi-sarees"
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083028]/20 focus:border-[#083028] transition font-mono text-xs text-gray-700"
                />
              </div>

              {/* Image Upload on ImageKit */}
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1.5 flex items-center justify-between">
                  <span>Category Image</span>
                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    ImageKit Cloud Upload
                  </span>
                </label>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp, image/gif"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileProcess(file);
                  }}
                  className="hidden"
                />

                {uploadError && (
                  <div className="mb-2 p-2.5 rounded-xl bg-red-50 text-red-700 text-xs font-medium border border-red-200 flex items-center gap-1.5">
                    <XCircle size={14} className="shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {uploadingImage ? (
                  <div className="border-2 border-dashed border-[#083028]/40 bg-[#083028]/5 rounded-2xl p-6 text-center">
                    <Loader2 className="w-8 h-8 text-[#083028] animate-spin mx-auto mb-2" />
                    <p className="text-sm font-bold text-gray-800">Uploading to ImageKit...</p>
                    <p className="text-xs text-gray-500 mt-0.5">Optimizing and storing image securely in the cloud</p>
                  </div>
                ) : image ? (
                  <div className="border border-gray-200 rounded-2xl p-3 bg-white shadow-xs flex items-center gap-3.5">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100 relative">
                      <img
                        src={image}
                        alt="Category preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold">
                        <CheckCircle size={14} />
                        <span>Uploaded to ImageKit</span>
                      </div>
                      <p className="text-[11px] text-gray-400 font-mono truncate mt-0.5" title={image}>
                        {image}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs font-semibold text-[#083028] hover:underline"
                        >
                          Change Image
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          type="button"
                          onClick={() => setImage('')}
                          className="text-xs font-semibold text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleFileProcess(file);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                      isDragging
                        ? 'border-[#083028] bg-[#083028]/10 scale-[1.01]'
                        : 'border-gray-200 hover:border-[#083028]/50 hover:bg-gray-50/80 bg-gray-50/40'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-[#083028]/10 text-[#083028] flex items-center justify-center mx-auto mb-2">
                      <UploadCloud size={24} />
                    </div>
                    <p className="text-xs font-bold text-gray-800">
                      Click to upload image <span className="font-normal text-gray-500">or drag &amp; drop</span>
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      PNG, JPG, WEBP up to 10MB • Auto-uploaded to ImageKit
                    </p>
                  </div>
                )}

                {/* Sample Presets */}
                {!image && !uploadingImage && (
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className="text-[11px] text-gray-400 font-medium">Or pick sample:</span>
                    {PRESET_IMAGES.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setImage(preset.url)}
                        className="text-[11px] px-2 py-0.5 rounded-lg border border-gray-200 bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of products in this category..."
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083028]/20 focus:border-[#083028] transition text-gray-800 resize-none"
                />
              </div>

              {/* Sort Order & Active */}
              <div className="grid grid-cols-2 gap-4 items-center pt-2">
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1 block">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
                    className="w-full px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083028]/20 focus:border-[#083028] transition text-gray-800"
                  />
                </div>

                <div className="flex items-center gap-3 pt-5">
                  <input
                    type="checkbox"
                    id="catActive"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="w-4 h-4 rounded text-[#083028] focus:ring-[#083028] border-gray-300"
                  />
                  <label htmlFor="catActive" className="text-xs font-bold text-gray-700 cursor-pointer select-none">
                    Active &amp; Visible
                  </label>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingImage}
                  className="inline-flex items-center gap-2 bg-[#083028] hover:bg-[#051e19] text-white px-6 py-2.5 rounded-xl text-xs font-semibold transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {(saving || uploadingImage) && <Loader2 size={14} className="animate-spin" />}
                  {uploadingImage
                    ? 'Uploading Image...'
                    : saving
                    ? 'Saving...'
                    : editingCategory
                    ? 'Save Changes'
                    : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
