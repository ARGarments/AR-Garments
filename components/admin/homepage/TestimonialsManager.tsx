'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, Save, X, Star } from 'lucide-react';
import { adminData, Testimonial, defaultTestimonials } from '@/lib/adminData';

const emptyTestimonial = (): Testimonial => ({
  id: Date.now().toString(),
  name: '',
  location: '',
  rating: 5,
  text: '',
  active: true,
});

export default function TestimonialsManager() {
  const [testimonials, setLocalTestimonials] = useState<Testimonial[]>([]);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [saved, setSaved] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalTestimonials(adminData.getTestimonials());
  }, []);

  const persist = (updated: Testimonial[]) => {
    adminData.setTestimonials(updated);
    setLocalTestimonials(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const openAdd = () => {
    setEditing(emptyTestimonial());
    setIsAdding(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const save = () => {
    if (!editing) return;
    const updated = isAdding
      ? [...testimonials, editing]
      : testimonials.map(t => t.id === editing.id ? editing : t);
    persist(updated);
    setEditing(null);
    setIsAdding(false);
  };

  const remove = (id: string) => {
    if (!confirm('Delete this testimonial?')) return;
    persist(testimonials.filter(t => t.id !== id));
  };

  const toggle = (id: string) => {
    persist(testimonials.map(t => t.id === id ? { ...t, active: !t.active } : t));
  };

  const StarRating = ({ rating, onChange }: { rating: number; onChange?: (r: number) => void }) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          className={onChange ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star
            size={16}
            className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}
          />
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Testimonials</h2>
          <p className="text-sm text-gray-500">{testimonials.filter(t => t.active).length} of {testimonials.length} active</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">✓ Saved</span>}
          <button
            onClick={() => { if (confirm('Reset to defaults?')) { persist(defaultTestimonials); setEditing(null); } }}
            className="text-xs text-gray-500 hover:text-red-600 border border-gray-200 px-3 py-2 rounded-lg transition-colors"
          >
            Reset
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-[#083028] hover:bg-[#051e19] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus size={16} /> Add Review
          </button>
        </div>
      </div>

      {/* Testimonials List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {testimonials.map((testimonial) => (
          <div
            key={testimonial.id}
            className={`relative rounded-xl border p-5 transition-all ${
              testimonial.active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'
            }`}
          >
            {/* Status badge */}
            <div className="flex items-center justify-between mb-3">
              <StarRating rating={testimonial.rating} />
              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggle(testimonial.id)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                    testimonial.active ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                  title={testimonial.active ? 'Deactivate' : 'Activate'}
                >
                  {testimonial.active ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>
                <button
                  onClick={() => { setEditing({ ...testimonial }); setIsAdding(false); setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 100); }}
                  className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => remove(testimonial.id)}
                  className="w-7 h-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            <div className="text-3xl text-[#083028]/15 font-serif leading-none mb-2 select-none">&ldquo;</div>
            <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">{testimonial.text}</p>

            <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
              <div className="w-9 h-9 rounded-full bg-[#083028] flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">{testimonial.name[0] || '?'}</span>
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">{testimonial.name || 'Name'}</p>
                <p className="text-xs text-gray-400">{testimonial.location || 'Location'}</p>
              </div>
            </div>
          </div>
        ))}

        {testimonials.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-400">
            <p className="text-sm">No testimonials yet. Add your first customer review!</p>
          </div>
        )}
      </div>

      {/* Add / Edit Form */}
      {editing && (
        <div ref={formRef} className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900">{isAdding ? 'Add Review' : 'Edit Review'}</h3>
            <button onClick={() => { setEditing(null); setIsAdding(false); }}>
              <X size={20} className="text-gray-400 hover:text-gray-600" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Customer Name</label>
              <input
                value={editing.name}
                onChange={e => setEditing({ ...editing, name: e.target.value })}
                placeholder="Ayesha Khan"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#083028]/20 focus:border-[#083028]"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Location</label>
              <input
                value={editing.location}
                onChange={e => setEditing({ ...editing, location: e.target.value })}
                placeholder="Prayagraj"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#083028]/20 focus:border-[#083028]"
              />
            </div>

            {/* Rating */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Rating</label>
              <div className="flex items-center gap-3">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setEditing({ ...editing, rating: star })}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      size={24}
                      className={star <= editing.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}
                    />
                  </button>
                ))}
                <span className="text-sm text-gray-500 ml-1">{editing.rating} / 5</span>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</label>
              <button
                type="button"
                onClick={() => setEditing({ ...editing, active: !editing.active })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editing.active ? 'bg-[#083028]' : 'bg-gray-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editing.active ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className="text-xs text-gray-500">{editing.active ? 'Active' : 'Inactive'}</span>
            </div>

            {/* Review Text */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Review Text</label>
              <textarea
                value={editing.text}
                onChange={e => setEditing({ ...editing, text: e.target.value })}
                rows={4}
                placeholder="Amazing collection of sarees and suits. Good quality and fast delivery. Highly recommended!"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#083028]/20 focus:border-[#083028]"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{editing.text.length} characters</p>
            </div>

            {/* Live Preview */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Preview</label>
              <div className="bg-white rounded-xl border border-gray-200 p-5 max-w-sm">
                <div className="flex items-center gap-0.5 mb-3">
                  {[1,2,3,4,5].map(s => <Star key={s} size={14} className={s <= editing.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />)}
                </div>
                <div className="text-3xl text-[#083028]/15 font-serif leading-none mb-1 select-none">&ldquo;</div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">{editing.text || 'Review text will appear here...'}</p>
                <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                  <div className="w-9 h-9 rounded-full bg-[#083028] flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{editing.name[0] || '?'}</span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{editing.name || 'Customer Name'}</p>
                    <p className="text-xs text-gray-400">{editing.location || 'Location'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6 pt-5 border-t border-gray-200">
            <button
              onClick={save}
              disabled={!editing.name || !editing.text}
              className="flex items-center gap-2 bg-[#083028] hover:bg-[#051e19] disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
            >
              <Save size={15} /> {isAdding ? 'Add Review' : 'Save Changes'}
            </button>
            <button
              onClick={() => { setEditing(null); setIsAdding(false); }}
              className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
