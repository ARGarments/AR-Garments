'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  SearchX,
  ArrowRight,
  TrendingUp,
  Tag,
  Loader2,
  Sparkles,
} from 'lucide-react';

export interface SearchProduct {
  id: string;
  name: string;
  price: string;
  category: string;
  image: string;
}

interface NavCategory {
  name: string;
  href: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: NavCategory[];
}

const POPULAR_SEARCHES = [
  'Silk Saree',
  'Banarasi Saree',
  'Anarkali Suit',
  'Dress Material',
  'Dupatta Sets',
  'Chanderi',
  'Bridal Wear',
  'Cotton Kurta',
];

export default function SearchModal({ isOpen, onClose, categories }: SearchModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [loading, setLoading] = useState(false);

  // Auto-focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Fetch catalog products once when opened
  useEffect(() => {
    if (isOpen && products.length === 0) {
      setLoading(true);
      fetch('/api/products')
        .then((res) => (res.ok ? res.json() : []))
        .then((data: Record<string, unknown>[]) => {
          const mapped: SearchProduct[] = data
            .filter((p) => p.active !== false)
            .map((p) => ({
              id: String(p.id),
              name: String(p.name),
              price: String(p.price),
              category: String(p.category || ''),
              image: String(p.image || ''),
            }));
          setProducts(mapped);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen, products.length]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter matching products
  const matchingProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products.filter((p) => {
      const matchName = p.name.toLowerCase().includes(q);
      const matchCat = p.category.toLowerCase().includes(q);
      return matchName || matchCat;
    });
  }, [query, products]);

  // Filter matching categories
  const matchingCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [query, categories]);

  // Submit search query to category page
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = query.trim();
    if (!q) return;
    onClose();
    router.push(`/category?search=${encodeURIComponent(q)}`);
  };

  const handleSelectProduct = (productId: string) => {
    onClose();
    router.push(`/product/${productId}`);
  };

  const handleTagClick = (tag: string) => {
    setQuery(tag);
    inputRef.current?.focus();
  };

  if (!isOpen) return null;

  const hasQuery = query.trim().length > 0;
  const isOutOfWebsite = hasQuery && !loading && matchingProducts.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 pt-16 sm:pt-24 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Click outside to close */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Search Modal Box */}
      <div
        className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[80vh] z-10 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Search Input Row */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 bg-[#FAF8F3]/60"
        >
          <Search size={22} className="text-[#083028] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sarees, suits, dupattas, fabrics..."
            className="flex-1 min-w-0 bg-transparent text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:outline-none font-medium"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition"
              title="Clear search"
            >
              <X size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition text-xs font-semibold"
          >
            Esc
          </button>
        </form>

        {/* Modal Body / Results */}
        <div className="overflow-y-auto p-5 space-y-5">
          {/* Loading Indicator */}
          {loading && (
            <div className="py-8 flex items-center justify-center gap-2 text-sm text-gray-500">
              <Loader2 size={18} className="animate-spin text-[#083028]" />
              <span>Loading store catalog...</span>
            </div>
          )}

          {/* ── CASE 1: Query is empty — Show popular searches & categories ── */}
          {!hasQuery && !loading && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <TrendingUp size={13} className="text-[#B8860B]" />
                  Popular Searches
                </p>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SEARCHES.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagClick(tag)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 hover:bg-[#083028] hover:text-white transition-all border border-gray-200"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Tag size={13} className="text-[#083028]" />
                  Explore Categories
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {categories.map((cat) => (
                    <Link
                      key={cat.name}
                      href={cat.href}
                      onClick={onClose}
                      className="text-xs font-semibold p-2.5 rounded-xl bg-[#FAF8F3] hover:bg-[#F5F1E8] text-[#083028] border border-gray-100 flex items-center justify-between group transition-colors"
                    >
                      <span className="truncate">{cat.name}</span>
                      <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-[#B8860B]" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── CASE 2: Results found ── */}
          {hasQuery && !loading && matchingProducts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-gray-500">
                  Found <span className="text-[#083028]">{matchingProducts.length}</span> matching product{matchingProducts.length !== 1 ? 's' : ''}
                </p>
                <button
                  type="button"
                  onClick={() => handleSearchSubmit()}
                  className="text-xs font-bold text-[#083028] hover:underline flex items-center gap-1"
                >
                  View in Catalog →
                </button>
              </div>

              {/* Matching Categories bar (if any) */}
              {matchingCategories.length > 0 && (
                <div className="p-2.5 rounded-xl bg-[#FAF8F3] border border-gray-100 flex items-center gap-2 flex-wrap text-xs">
                  <span className="font-bold text-gray-500">Matching Categories:</span>
                  {matchingCategories.map((c) => (
                    <Link
                      key={c.name}
                      href={c.href}
                      onClick={onClose}
                      className="font-semibold text-[#083028] bg-white px-2.5 py-0.5 rounded-lg border border-gray-200 hover:border-[#083028] transition"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              )}

              {/* Product List */}
              <div className="divide-y divide-gray-100 max-h-[50vh] overflow-y-auto pr-1">
                {matchingProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectProduct(p.id)}
                    className="py-2.5 px-2 rounded-xl hover:bg-gray-50 flex items-center gap-3.5 cursor-pointer transition group"
                  >
                    <div className="w-12 h-12 rounded-lg bg-gray-100 shrink-0 overflow-hidden relative border border-gray-100">
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                          Img
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate group-hover:text-[#083028] transition-colors">
                        {p.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-bold text-[#083028]">
                          {p.price}
                        </span>
                        {p.category && (
                          <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                            {p.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRight
                      size={15}
                      className="text-gray-300 group-hover:text-[#083028] group-hover:translate-x-1 transition-all shrink-0"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── CASE 3: OUT OF WEBSITE / NO MATCHING RESULTS ── */}
          {isOutOfWebsite && (
            <div className="py-6 px-4 text-center bg-[#FAF8F3]/60 rounded-2xl border border-amber-200/60">
              <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
                <SearchX size={24} />
              </div>
              <h4 className="text-base font-bold text-gray-900">
                No products found for &ldquo;{query}&rdquo;
              </h4>
              <p className="text-xs text-gray-600 max-w-md mx-auto mt-1.5 leading-relaxed">
                This item is not available in our store. AR Garment specializes in authentic ethnic wear, designer sarees, salwar suits, and traditional dupattas.
              </p>

              <div className="mt-5 pt-4 border-t border-amber-200/50">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2.5">
                  Explore our authentic ethnic collections instead:
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {categories.map((cat) => (
                    <Link
                      key={cat.name}
                      href={cat.href}
                      onClick={onClose}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white text-[#083028] hover:bg-[#083028] hover:text-white transition-all border border-gray-200 shadow-xs"
                    >
                      {cat.name}
                    </Link>
                  ))}
                  <Link
                    href="/category"
                    onClick={onClose}
                    className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-[#B8860B] hover:bg-[#9a7009] text-white transition-all shadow-xs"
                  >
                    View All Products →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {hasQuery && matchingProducts.length > 0 && (
          <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
            <button
              type="button"
              onClick={() => handleSearchSubmit()}
              className="text-xs font-bold text-[#083028] hover:underline"
            >
              See all results for &ldquo;{query}&rdquo; in Catalog →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
