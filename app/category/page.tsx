'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Filter, X, ChevronRight, SlidersHorizontal,
  ArrowUpDown, ChevronLeft, Loader2,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { Product } from '@/components/ProductCard';

const CATEGORIES = [
  'All',
  'Sarees',
  'Suits & Dress Material',
  'Dupatta Sets',
  'Men Fashion',
  'Kids Fashion',
];

const PRICE_RANGES = [
  { label: 'All Prices', min: 0, max: Infinity },
  { label: 'Under ₹1,000', min: 0, max: 999 },
  { label: '₹1,000 - ₹1,500', min: 1000, max: 1500 },
  { label: '₹1,500 - ₹2,000', min: 1500, max: 2000 },
  { label: 'Above ₹2,000', min: 2000, max: Infinity },
];

const ITEMS_PER_PAGE = 8;

// Type for products fetched from API (DB row shape mapped to Product)
type CatalogProduct = Product & { numericPrice: number; category: string };

function CategoryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialCategory = searchParams.get('category') || 'All';
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedPriceRange, setSelectedPriceRange] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);

  // Live products from Supabase
  const [allProducts, setAllProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all active products from DB on mount
  useEffect(() => {
    setLoading(true);
    fetch('/api/products')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Record<string, unknown>[]) => {
        const mapped: CatalogProduct[] = data
          .filter((d) => d.active === true)
          .map((d) => ({
            id: d.id as string,
            name: d.name as string,
            price: d.price as string,
            numericPrice: (d.numeric_price as number) ?? 0,
            category: (d.category as string) ?? '',
            image: d.image as string,
          }));
        setAllProducts(mapped);
      })
      .catch(() => setAllProducts([]))
      .finally(() => setLoading(false));
  }, []);

  // Sync URL param → filter state
  useEffect(() => {
    const cat = searchParams.get('category');
    setSelectedCategory(cat || 'All');
    setCurrentPage(1);
  }, [searchParams]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
    router.push(category === 'All' ? '/category' : `/category?category=${encodeURIComponent(category)}`);
  };

  // Filter + Sort
  const filteredProducts = useMemo(() => {
    return allProducts
      .filter((p) => {
        const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
        const priceConfig = PRICE_RANGES[selectedPriceRange];
        const matchesPrice = p.numericPrice >= priceConfig.min && p.numericPrice <= priceConfig.max;
        return matchesCategory && matchesPrice;
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') return a.numericPrice - b.numericPrice;
        if (sortBy === 'price-high') return b.numericPrice - a.numericPrice;
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [allProducts, selectedCategory, selectedPriceRange, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const resetFilters = () => {
    handleCategoryChange('All');
    setSelectedPriceRange(0);
    setSortBy('featured');
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <Header />

      {/* HERO BANNER */}
      <section className="relative overflow-hidden bg-[#083028] py-14 sm:py-20 md:py-24">
        <div className="absolute inset-0">
          <Image
            src="/home-images/hero-image1.jpg"
            alt="Category Banner"
            fill
            className="object-cover object-center opacity-30"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#083028] via-[#083028]/90 to-[#083028]/60" />
        </div>
        <div className="relative z-10 container mx-auto px-4 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm text-gray-300 mb-3">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight size={14} />
            <Link href="/category" className="hover:text-white transition-colors">Collections</Link>
            {selectedCategory !== 'All' && (
              <>
                <ChevronRight size={14} />
                <span className="text-white font-medium">{selectedCategory}</span>
              </>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-3">
            {selectedCategory === 'All' ? 'Explore Our Collections' : selectedCategory}
          </h1>
          <p className="text-sm sm:text-base text-gray-300 max-w-2xl leading-relaxed">
            Discover exquisite handcrafted ethnic wear designed with premium fabrics,
            timeless tradition, and effortless modern elegance.
          </p>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <div className="container mx-auto px-4 py-8 md:py-12">

        {/* Control Bar */}
        <div className="bg-white rounded-2xl p-4 mb-8 shadow-sm border border-gray-200/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 bg-[#083028] text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm"
            >
              <Filter size={16} />
              <span>Filters</span>
            </button>
            <p className="text-sm text-gray-600 font-medium">
              {loading ? (
                <span className="flex items-center gap-1.5 text-gray-400">
                  <Loader2 size={14} className="animate-spin" /> Loading products...
                </span>
              ) : (
                <>
                  Showing{' '}
                  <span className="font-bold text-gray-900">
                    {filteredProducts.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}
                    -{Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)}
                  </span>{' '}
                  of <span className="font-bold text-gray-900">{filteredProducts.length}</span> products
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <ArrowUpDown size={16} className="text-gray-400 hidden sm:block" />
            <span className="text-sm text-gray-500 hidden sm:block">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
              className="bg-gray-50 border border-gray-300 text-gray-800 text-sm font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#083028]"
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
            </select>
          </div>
        </div>

        {/* Active Filter Badges */}
        {(selectedCategory !== 'All' || selectedPriceRange !== 0) && (
          <div className="flex items-center gap-2 flex-wrap mb-6">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Active Filters:</span>
            {selectedCategory !== 'All' && (
              <span className="inline-flex items-center gap-1.5 bg-[#083028] text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                {selectedCategory}
                <button onClick={() => handleCategoryChange('All')} className="hover:bg-white/20 rounded-full p-0.5">
                  <X size={12} />
                </button>
              </span>
            )}
            {selectedPriceRange !== 0 && (
              <span className="inline-flex items-center gap-1.5 bg-[#083028] text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                {PRICE_RANGES[selectedPriceRange].label}
                <button onClick={() => setSelectedPriceRange(0)} className="hover:bg-white/20 rounded-full p-0.5">
                  <X size={12} />
                </button>
              </span>
            )}
            <button onClick={resetFilters} className="text-xs font-bold text-[#083028] underline ml-2 hover:opacity-80">
              Clear All
            </button>
          </div>
        )}

        {/* Sidebar + Products Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">

          {/* DESKTOP SIDEBAR */}
          <aside className="hidden lg:block lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm sticky top-24">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-[#083028]" />
                Filter Products
              </h2>
              {(selectedCategory !== 'All' || selectedPriceRange !== 0) && (
                <button onClick={resetFilters} className="text-xs font-semibold text-[#083028] hover:underline">
                  Reset
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="mb-6">
              <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider mb-3">Categories</h3>
              <div className="space-y-1.5">
                {CATEGORIES.map((cat) => {
                  const count = cat === 'All'
                    ? allProducts.length
                    : allProducts.filter((p) => p.category === cat).length;
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => handleCategoryChange(cat)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#083028] text-white font-bold'
                          : 'text-gray-700 hover:bg-[#F5F1E8] hover:text-[#083028]'
                      }`}
                    >
                      <span>{cat}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price Filter */}
            <div className="pt-5 border-t border-gray-100">
              <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider mb-3">Price Range</h3>
              <div className="space-y-2">
                {PRICE_RANGES.map((range, index) => (
                  <label key={range.label} className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer hover:text-[#083028]">
                    <input
                      type="radio"
                      name="priceRange"
                      checked={selectedPriceRange === index}
                      onChange={() => { setSelectedPriceRange(index); setCurrentPage(1); }}
                      className="accent-[#083028] w-4 h-4 cursor-pointer"
                    />
                    <span className={selectedPriceRange === index ? 'font-bold text-[#083028]' : ''}>{range.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </aside>

          {/* PRODUCTS GRID */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-400">
                <Loader2 size={36} className="animate-spin text-[#083028]" />
                <p className="text-sm font-medium">Loading products from database...</p>
              </div>
            ) : paginatedProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                  {paginatedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* PAGINATION */}
                {totalPages > 1 && (
                  <div className="mt-12 flex justify-center items-center gap-2">
                    <button
                      onClick={() => { setCurrentPage((p) => Math.max(p - 1, 1)); window.scrollTo({ top: 300, behavior: 'smooth' }); }}
                      disabled={currentPage === 1}
                      className="px-3.5 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors flex items-center gap-1"
                    >
                      <ChevronLeft size={16} />
                      <span className="hidden sm:inline">Prev</span>
                    </button>

                    {Array.from({ length: totalPages }).map((_, idx) => {
                      const pageNum = idx + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => { setCurrentPage(pageNum); window.scrollTo({ top: 300, behavior: 'smooth' }); }}
                          className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${
                            currentPage === pageNum
                              ? 'bg-[#083028] text-white shadow-md'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-[#F5F1E8] hover:text-[#083028]'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => { setCurrentPage((p) => Math.min(p + 1, totalPages)); window.scrollTo({ top: 300, behavior: 'smooth' }); }}
                      disabled={currentPage === totalPages}
                      className="px-3.5 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors flex items-center gap-1"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* Empty State */
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm">
                <div className="w-16 h-16 bg-[#F5F1E8] text-[#083028] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Filter size={28} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
                  No items match your selected filters. Try adjusting category or price range.
                </p>
                <button
                  onClick={resetFilters}
                  className="bg-[#083028] hover:bg-[#051e19] text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE FILTER DRAWER */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setMobileFilterOpen(false)} />
          <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl z-10 flex flex-col p-6 overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Filter size={18} className="text-[#083028]" />
                Filters
              </h2>
              <button onClick={() => setMobileFilterOpen(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="mb-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Categories</h3>
              <div className="space-y-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => { handleCategoryChange(cat); setMobileFilterOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      selectedCategory === cat
                        ? 'bg-[#083028] text-white font-bold'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 mb-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Price Range</h3>
              <div className="space-y-2.5">
                {PRICE_RANGES.map((range, idx) => (
                  <label key={range.label} className="flex items-center gap-3 text-sm text-gray-700">
                    <input
                      type="radio"
                      name="mobilePrice"
                      checked={selectedPriceRange === idx}
                      onChange={() => { setSelectedPriceRange(idx); setCurrentPage(1); }}
                      className="accent-[#083028] w-4 h-4"
                    />
                    <span>{range.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => { resetFilters(); setMobileFilterOpen(false); }}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Reset
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 py-2.5 bg-[#083028] text-white rounded-xl text-sm font-semibold hover:bg-[#051e19]"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function CategoryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FAF8F3]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#083028]" />
        </div>
      }
    >
      <CategoryContent />
    </Suspense>
  );
}
