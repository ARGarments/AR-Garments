'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Save, X,
  ChevronUp, ChevronDown, Upload, ImageIcon, Loader2, GripVertical,
} from 'lucide-react';
import { HeroSlide } from '@/lib/adminData';
import { uploadImageToImageKit } from '@/lib/imagekit';
import Image from 'next/image';

const emptySlide = (): Partial<HeroSlide> => ({
  title: '',
  subtitle: '',
  buttonText: 'Shop Now',
  buttonLink: '/category',
  image: '',
  label: 'Timeless Ethnic Wear',
  active: true,
});


export default function HeroManager() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [editing, setEditing] = useState<Partial<HeroSlide> | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // ─── Load from Supabase ────────────────────────────────────────────────────
  const loadSlides = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hero-slides');
      if (!res.ok) throw new Error();
      const data: Record<string, unknown>[] = await res.json();
      const mapped: HeroSlide[] = data.map((d) => ({
        id: d.id as string,
        title: d.title as string,
        subtitle: d.subtitle as string,
        buttonText: d.button_text as string,
        buttonLink: d.button_link as string,
        image: d.image as string,
        label: d.label as string,
        active: d.active as boolean,
        order: d.sort_order as number,
      }));
      setSlides(mapped.sort((a, b) => a.order - b.order));
    } catch {
      setSaveError('Could not load slides from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSlides(); }, []);

  const flash = (msg: string) => {
    setSavedMsg(msg);
    setTimeout(() => setSavedMsg(''), 2500);
  };

  // ─── ImageKit Upload ───────────────────────────────────────────────────────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    setIsUploading(true);
    setUploadError('');
    try {
      const res = await uploadImageToImageKit(file, file.name, '/hero-slides');
      setEditing((prev) => ({ ...prev, image: res.url }));
    } catch {
      const previewUrl = URL.createObjectURL(file);
      setEditing((prev) => ({ ...prev, image: previewUrl }));
      setUploadError('Local preview only — ImageKit upload failed. Check your API keys.');
    } finally {
      setIsUploading(false);
    }
  };

  // ─── Open Add ─────────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditing({ ...emptySlide() });
    setIsAdding(true);
    setSaveError('');
    setUploadError('');
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  // ─── Open Edit ────────────────────────────────────────────────────────────
  const openEdit = (slide: HeroSlide) => {
    setEditing({ ...slide });
    setIsAdding(false);
    setSaveError('');
    setUploadError('');
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const cancelEdit = () => { setEditing(null); setIsAdding(false); };

  // ─── Save slide to Supabase ────────────────────────────────────────────────
  const saveSlide = async () => {
    if (!editing || !editing.title || !editing.subtitle) return;
    setSaving(true);
    setSaveError('');

    try {
      let res: Response;

      if (isAdding) {
        // POST new slide
        res = await fetch('/api/hero-slides', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: `slide-${Date.now()}`,
            title: editing.title,
            subtitle: editing.subtitle,
            buttonText: editing.buttonText,
            buttonLink: editing.buttonLink,
            image: editing.image,
            label: editing.label,
            active: editing.active ?? true,
            order: slides.length + 1,
          }),
        });
      } else {
        // PATCH existing slide
        res = await fetch(`/api/hero-slides?id=${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: editing.title,
            subtitle: editing.subtitle,
            buttonText: editing.buttonText,
            buttonLink: editing.buttonLink,
            image: editing.image,
            label: editing.label,
            active: editing.active,
          }),
        });
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Save failed');
      }

      setEditing(null);
      setIsAdding(false);
      await loadSlides();
      flash('✓ Slide saved to database!');
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Save failed. Check console.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Toggle active via PATCH ───────────────────────────────────────────────
  const toggleActive = async (slide: HeroSlide) => {
    try {
      const res = await fetch(`/api/hero-slides?id=${slide.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !slide.active }),
      });
      if (!res.ok) throw new Error();
      setSlides((prev) =>
        prev.map((s) => (s.id === slide.id ? { ...s, active: !s.active } : s))
      );
    } catch {
      alert('Failed to update slide status.');
    }
  };

  // ─── Delete via DELETE ─────────────────────────────────────────────────────
  const deleteSlide = async (id: string) => {
    if (!confirm('Delete this slide permanently?')) return;
    try {
      const res = await fetch(`/api/hero-slides?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      await loadSlides();
      flash('✓ Slide deleted.');
    } catch {
      alert('Failed to delete slide.');
    }
  };

  // ─── Reorder via PATCH ─────────────────────────────────────────────────────
  const moveSlide = async (id: string, dir: 'up' | 'down') => {
    const idx = slides.findIndex((s) => s.id === id);
    if ((dir === 'up' && idx === 0) || (dir === 'down' && idx === slides.length - 1)) return;

    const arr = [...slides];
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    [arr[idx], arr[swapIdx]] = [arr[swapIdx], arr[idx]];
    const reordered = arr.map((s, i) => ({ ...s, order: i + 1 }));
    setSlides(reordered); // Optimistic UI update

    // Persist both swapped orders
    await Promise.all([
      fetch(`/api/hero-slides?id=${reordered[idx].id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: reordered[idx].order }),
      }),
      fetch(`/api/hero-slides?id=${reordered[swapIdx].id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: reordered[swapIdx].order }),
      }),
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Hero Slider</h2>
          <p className="text-sm text-gray-500">
            {loading ? 'Loading...' : `${slides.filter((s) => s.active).length} of ${slides.length} slides active`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {savedMsg && (
            <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
              {savedMsg}
            </span>
          )}
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-[#083028] hover:bg-[#051e19] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus size={16} /> Add Slide
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {saveError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center justify-between">
          ❌ {saveError}
          <button onClick={() => setSaveError('')}><X size={14} /></button>
        </div>
      )}

      {/* Slides List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
          <Loader2 size={22} className="animate-spin" />
          <span className="text-sm font-medium">Loading from database...</span>
        </div>
      ) : (
        <div className="space-y-3">
          {slides.map((slide, idx) => (
            <div
              key={slide.id}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                slide.active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'
              }`}
            >
              {/* Order Controls */}
              <div className="flex flex-col gap-1">
                <button onClick={() => moveSlide(slide.id, 'up')} disabled={idx === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-20">
                  <ChevronUp size={14} />
                </button>
                <GripVertical size={14} className="text-gray-300 mx-auto" />
                <button onClick={() => moveSlide(slide.id, 'down')} disabled={idx === slides.length - 1} className="text-gray-400 hover:text-gray-600 disabled:opacity-20">
                  <ChevronDown size={14} />
                </button>
              </div>

              <span className="text-xs font-bold text-gray-300 w-5 text-center">{idx + 1}</span>

              {/* Thumbnail */}
              <div className="w-20 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
                <Image src={slide.image} alt={slide.title} fill className="object-cover object-top" sizes="80px" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{slide.title.replace('\n', ' ')}</p>
                <p className="text-xs text-gray-400 truncate mt-0.5">{slide.subtitle}</p>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded mt-1 inline-block">
                  {slide.buttonText}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleActive(slide)}
                  title={slide.active ? 'Deactivate' : 'Activate'}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    slide.active ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  {slide.active ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button
                  onClick={() => openEdit(slide)}
                  className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => deleteSlide(slide.id)}
                  className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}

          {slides.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm">No slides yet. Add your first hero slide!</p>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Form */}
      {editing && (
        <div ref={formRef} className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mt-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900">{isAdding ? 'Add New Slide' : 'Edit Slide'}</h3>
            <button onClick={cancelEdit}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                Title <span className="text-gray-400 font-normal normal-case">(use \n for line break)</span>
              </label>
              <input
                value={editing.title || ''}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                placeholder="Tradition In\nEvery Thread"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#083028]/20 focus:border-[#083028]"
              />
            </div>

            {/* Subtitle */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Subtitle</label>
              <input
                value={editing.subtitle || ''}
                onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })}
                placeholder="Elegant Styles • Premium Fabrics • For Every You"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#083028]/20 focus:border-[#083028]"
              />
            </div>

            {/* Label */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Top Label</label>
              <input
                value={editing.label || ''}
                onChange={(e) => setEditing({ ...editing, label: e.target.value })}
                placeholder="Timeless Ethnic Wear"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#083028]/20 focus:border-[#083028]"
              />
            </div>

            {/* Button Text */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Button Text</label>
              <input
                value={editing.buttonText || ''}
                onChange={(e) => setEditing({ ...editing, buttonText: e.target.value })}
                placeholder="Shop Now Collection"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#083028]/20 focus:border-[#083028]"
              />
            </div>

            {/* Button Link */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Button Link</label>
              <input
                value={editing.buttonLink || ''}
                onChange={(e) => setEditing({ ...editing, buttonLink: e.target.value })}
                placeholder="/category"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#083028]/20 focus:border-[#083028]"
              />
            </div>

            {/* Active Toggle */}
            <div className="flex items-center gap-3 self-end pb-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</label>
              <button
                type="button"
                onClick={() => setEditing({ ...editing, active: !editing.active })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  editing.active ? 'bg-[#083028]' : 'bg-gray-200'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editing.active ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className="text-xs text-gray-500">{editing.active ? 'Active' : 'Inactive'}</span>
            </div>

            {/* ImageKit Upload */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Slide Image
              </label>

              {/* Upload Zone */}
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 hover:border-[#083028] transition-colors">
                {editing.image ? (
                  <div className="flex items-center gap-4">
                    <div className="relative w-24 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={editing.image} alt="preview" className="w-full h-full object-cover object-top" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 font-medium truncate">{editing.image}</p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-1.5 text-xs font-bold text-[#083028] hover:underline flex items-center gap-1"
                      >
                        <Upload size={13} />
                        Replace image
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <ImageIcon className="mx-auto text-gray-400 mb-2" size={28} />
                    <p className="text-xs text-gray-400 mb-2">No image selected</p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-bold text-[#083028] bg-[#083028]/10 hover:bg-[#083028]/20 px-4 py-2 rounded-lg transition-colors"
                    >
                      Upload Image
                    </button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {isUploading && (
                <p className="text-xs text-[#083028] mt-2 flex items-center gap-1.5 font-medium">
                  <Loader2 size={13} className="animate-spin" /> Uploading to ImageKit CDN...
                </p>
              )}
              {uploadError && (
                <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg mt-2">ℹ️ {uploadError}</p>
              )}
            </div>

            {/* Live Preview — only shown after image is uploaded */}
            {editing.image && (
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Live Preview</label>
                <div className="relative h-32 rounded-xl overflow-hidden bg-gray-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={editing.image} alt="preview" className="w-full h-full object-cover object-top opacity-70" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex items-center px-6">
                    <div>
                      <p className="text-white/60 text-[10px] uppercase tracking-widest">{editing.label || 'Label'}</p>
                      <p className="text-white font-bold text-sm leading-tight whitespace-pre-line">{editing.title || 'Title Preview'}</p>
                      <p className="text-white/80 text-[10px] mt-1">{editing.subtitle || 'Subtitle preview'}</p>
                      <span className="inline-block mt-2 text-[10px] bg-[#083028]/80 text-white px-3 py-1 rounded">
                        {editing.buttonText || 'Shop Now'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Save / Cancel */}
          <div className="flex items-center gap-3 mt-6 pt-5 border-t border-gray-200">
            <button
              onClick={saveSlide}
              disabled={!editing.title || !editing.subtitle || saving || isUploading}
              className="flex items-center gap-2 bg-[#083028] hover:bg-[#051e19] disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
            >
              {saving
                ? <><Loader2 size={14} className="animate-spin" /> Saving to DB...</>
                : <><Save size={15} /> {isAdding ? 'Add Slide' : 'Save Changes'}</>
              }
            </button>
            <button
              onClick={cancelEdit}
              className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            {saveError && <p className="text-xs text-red-600 font-medium">❌ {saveError}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
