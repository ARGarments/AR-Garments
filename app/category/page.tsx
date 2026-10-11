'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Filter, X, ChevronRight,
  ArrowUpDown, ChevronLeft, Loader2, SearchX,
  Layers3,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { Product } from '@/components/ProductCard';

const PRICE_RANGES = [
  { label: 'All Prices', min: 0, max: Infinity },
  { label: 'Under ₹1,000', min: 0, max: 999 },
  { label: '₹1,000 - ₹1,500', min: 1000, max: 1500 },
  { label: '₹1,500 - ₹2,000', min: 1500, max: 2000 },
  { label: 'Above ₹2,000', min: 2000, max: Infinity },
];

const ITEMS_PER_PAGE = 8;

type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  parentId: string | null;
  active: boolean;
  children?: CategoryNode[];
};

// Type for products fetched from API (DB row shape mapped to Product)
type CatalogProduct = Product & {
  numericPrice: number;
  category: string;
  categoryId?: string;
  subcategoryId?: string;
};

function CategoryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialCategory = searchParams.get('category') || 'All';
  const initialSubcategory = searchParams.get('subcategory') || '';
  const initialSearch = searchParams.get('search') || '';
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>(initialSubcategory);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [selectedPriceRange, setSelectedPriceRange] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [categoryTree, setCategoryTree] = useState<CategoryNode[]>([]);

  // Live products from Supabase
  const [allProducts, setAllProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch dynamic categories
  useEffect(() => {
    fetch('/api/categories?active=true&tree=true', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: CategoryNode[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setCategoryTree(data);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch active products from the database and refresh when the tab becomes active.
  useEffect(() => {
    let cancelled = false;

    const loadProducts = async (showLoading: boolean) => {
      if (showLoading) setLoading(true);

      try {
        const response = await fetch('/api/products', {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });
        if (!response.ok) throw new Error('Failed to load products.');

        const data = (await response.json()) as Record<string, unknown>[];
        const mapped: CatalogProduct[] = data
          .filter((product) => product.active === true)
          .map((product) => ({
            id: product.id as string,
            name: product.name as string,
            price: product.price as string,
            numericPrice: (product.numeric_price as number) ?? 0,
            category: (product.category as string) ?? '',
            categoryId: (product.category_id as string) || undefined,
            subcategoryId: (product.subcategory_id as string) || undefined,
            image: product.image as string,
          }));

        if (!cancelled) setAllProducts(mapped);
      } catch {
        if (!cancelled && showLoading) setAllProducts([]);
      } finally {
        if (!cancelled && showLoading) setLoading(false);
      }
    };

    const refreshProducts = () => {
      if (document.visibilityState === 'visible') void loadProducts(false);
    };

    void loadProducts(true);
    window.addEventListener('focus', refreshProducts);
    window.addEventListener('pageshow', refreshProducts);
    document.addEventListener('visibilitychange', refreshProducts);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', refreshProducts);
      window.removeEventListener('pageshow', refreshProducts);
      document.removeEventListener('visibilitychange', refreshProducts);
    };
  }, []);

  // Sync URL param → filter state
  useEffect(() => {
    const cat = searchParams.get('category');
    const subcategory = searchParams.get('subcategory') || '';
    const s = searchParams.get('search') || '';
    setSelectedCategory(cat || 'All');
    setSelectedSubcategory(subcategory);
    setSearchQuery(s);
    setCurrentPage(1);
  }, [searchParams]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedSubcategory('');
    setCurrentPage(1);
    const searchPart = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
    router.push(category === 'All' ? `/category${searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ''}` : `/category?category=${encodeURIComponent(category)}${searchPart}`);
  };

  const handleSubcategoryChange = (parent: CategoryNode, subcategory: CategoryNode) => {
    setSelectedCategory(parent.name);
    setSelectedSubcategory(subcategory.name);
    setCurrentPage(1);
    const searchPart = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
    router.push(
      `/category?category=${encodeURIComponent(parent.name)}&subcategory=${encodeURIComponent(subcategory.name)}${searchPart}`
    );
    window.setTimeout(() => {
      document.getElementById('catalog-products')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const showParentProducts = (category: string) => {
    handleCategoryChange(category);
    window.setTimeout(() => {
      document.getElementById('catalog-products')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const selectedParent = categoryTree.find((category) => category.name === selectedCategory)
    || categoryTree[0];
  const selectedSubcategoryNode = selectedParent?.children?.find(
    (subcategory) => subcategory.name === selectedSubcategory
  );
  const subcategoryNameById = useMemo(() => {
    const entries = categoryTree.flatMap((parent) => (
      (parent.children || []).map((subcategory) => [subcategory.id, subcategory.name] as const)
    ));
    return new Map(entries);
  }, [categoryTree]);
  const browserSubcategories = (selectedParent?.children || []).map((subcategory) => ({
    parent: selectedParent,
    subcategory,
  }));

  // Filter + Sort
  const filteredProducts = useMemo(() => {
    return allProducts
      .filter((p) => {
        const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
        const matchesSubcategory = !selectedSubcategoryNode
          || p.subcategoryId === selectedSubcategoryNode.id;
        const priceConfig = PRICE_RANGES[selectedPriceRange];
        const matchesPrice = p.numericPrice >= priceConfig.min && p.numericPrice <= priceConfig.max;
        const q = searchQuery.trim().toLowerCase();
        const subcategoryName = p.subcategoryId ? subcategoryNameById.get(p.subcategoryId) || '' : '';
        const matchesSearch = !q
          || p.name.toLowerCase().includes(q)
          || p.category.toLowerCase().includes(q)
          || subcategoryName.toLowerCase().includes(q);
        return matchesCategory && matchesSubcategory && matchesPrice && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') return a.numericPrice - b.numericPrice;
        if (sortBy === 'price-high') return b.numericPrice - a.numericPrice;
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [allProducts, selectedCategory, selectedSubcategoryNode, selectedPriceRange, sortBy, searchQuery, subcategoryNameById]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const resetFilters = () => {
    setSelectedCategory('All');
    setSelectedSubcategory('');
    setSearchQuery('');
    setSelectedPriceRange(0);
    setSortBy('featured');
    setCurrentPage(1);
    router.push('/category');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <Header categoryMobileMode />

      {/* HERO BANNER */}
      <section className="relative hidden overflow-hidden bg-[#083028] py-5 sm:block sm:py-7 md:py-8">
        <div className="absolute inset-0">
          <Image
            src="/home-images/hero-image1.jpg"
            alt="Category Banner"
            fill
            className="object-cover object-[85%_center] sm:object-center opacity-30"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#083028] via-[#083028]/90 to-[#083028]/60" />
        </div>
        <div className="relative z-10 container mx-auto px-4 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 text-[11px] sm:text-sm text-gray-300 mb-2 sm:mb-3">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight size={12} className="sm:w-3.5 sm:h-3.5" />
            <Link href="/category" className="hover:text-white transition-colors">Collections</Link>
            {selectedCategory !== 'All' && (
              <>
                <ChevronRight size={12} className="sm:w-3.5 sm:h-3.5" />
                <span className="text-white font-medium">{selectedCategory}</span>
              </>
            )}
            {selectedSubcategory && (
              <>
                <ChevronRight size={12} className="sm:w-3.5 sm:h-3.5" />
                <span className="text-white font-medium">{selectedSubcategory}</span>
              </>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-1.5 sm:mb-2">
            {selectedSubcategory || (selectedCategory === 'All' ? 'Explore Our Collections' : selectedCategory)}
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-300 max-w-2xl leading-relaxed">
            Discover exquisite handcrafted ethnic wear designed with premium fabrics,
            timeless tradition, and effortless modern elegance.
          </p>
        </div>
      </section>

      {/* Mobile category browser */}
      {categoryTree.length > 0 && (
        <section className="min-h-[calc(100dvh-7.25rem)] border-b border-gray-200 bg-white sm:hidden">
          <div className="grid min-h-[calc(100dvh-7.25rem)] grid-cols-[82px_minmax(0,1fr)]">
            <aside className="sticky top-14 h-[calc(100dvh-7.25rem)] overflow-y-auto border-r border-gray-200 bg-[#F5F6F8] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                onClick={() => handleCategoryChange('All')}
                aria-pressed={selectedCategory === 'All'}
                className={`relative flex w-full flex-col items-center gap-1 border-b border-gray-200 px-1 py-2.5 text-center transition ${
                  selectedCategory === 'All'
                    ? 'bg-white text-blue-600 before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-blue-600'
                    : 'text-gray-600'
                }`}
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E7EEF9] text-[#083028]">
                  <Layers3 size={21} />
                </span>
                <span className="line-clamp-2 text-[10px] font-semibold leading-tight">For You</span>
              </button>

              {categoryTree.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleCategoryChange(category.name)}
                  aria-pressed={selectedCategory === category.name}
                  className={`relative flex w-full flex-col items-center gap-1 border-b border-gray-200 px-1 py-2.5 text-center transition ${
                    selectedCategory === category.name
                      ? 'bg-white text-blue-600 before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-blue-600'
                      : 'text-gray-600'
                  }`}
                >
                  <span className="relative h-11 w-11 overflow-hidden rounded-2xl border border-gray-200 bg-white">
                    {category.image ? (
                      <Image src={category.image} alt="" fill className="object-cover object-top" sizes="44px" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-sm font-black text-[#083028]">
                        {category.name.charAt(0)}
                      </span>
                    )}
                  </span>
                  <span className="line-clamp-2 text-[9px] font-semibold leading-tight">{category.name}</span>
                </button>
              ))}
            </aside>

            <div className="min-w-0 bg-white px-3 pb-5 pt-4">
              {selectedCategory === 'All' ? (
                <div className="space-y-6">
                  {categoryTree.map((parent) => {
                    const children = parent.children || [];
                    return (
                      <section key={parent.id}>
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <h2 className="text-sm font-bold text-gray-900">{parent.name}</h2>
                          <button
                            type="button"
                            onClick={() => showParentProducts(parent.name)}
                            className="shrink-0 text-[10px] font-bold text-blue-600"
                          >
                            View all
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-x-2 gap-y-4">
                          {children.length > 0 ? children.map((subcategory) => (
                            <button
                              key={subcategory.id}
                              type="button"
                              onClick={() => handleSubcategoryChange(parent, subcategory)}
                              className="group min-w-0 text-center"
                            >
                              <span className="relative mx-auto block aspect-square w-full overflow-hidden rounded-2xl bg-[#F1F3F8]">
                                {subcategory.image ? (
                                  <Image
                                    src={subcategory.image}
                                    alt={subcategory.name}
                                    fill
                                    className="object-cover object-top transition duration-300 group-active:scale-95"
                                    sizes="(max-width: 639px) 27vw, 100px"
                                  />
                                ) : (
                                  <span className="flex h-full w-full items-center justify-center text-xl font-black text-[#083028]">
                                    {subcategory.name.charAt(0)}
                                  </span>
                                )}
                              </span>
                              <span className="mt-1.5 block line-clamp-2 text-[10px] font-semibold leading-tight text-gray-800">
                                {subcategory.name}
                              </span>
                            </button>
                          )) : (
                            <button
                              type="button"
                              onClick={() => showParentProducts(parent.name)}
                              className="group min-w-0 text-center"
                            >
                              <span className="relative mx-auto block aspect-square w-full overflow-hidden rounded-2xl bg-[#F1F3F8]">
                                {parent.image ? (
                                  <Image src={parent.image} alt={parent.name} fill className="object-cover object-top" sizes="(max-width: 639px) 27vw, 100px" />
                                ) : (
                                  <span className="flex h-full w-full items-center justify-center text-xl font-black text-[#083028]">
                                    {parent.name.charAt(0)}
                                  </span>
                                )}
                              </span>
                              <span className="mt-1.5 block line-clamp-2 text-[10px] font-semibold leading-tight text-gray-800">
                                All {parent.name}
                              </span>
                            </button>
                          )}
                        </div>
                      </section>
                    );
                  })}
                </div>
              ) : (
                <div>
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-blue-600">Shop by category</p>
                      <h2 className="truncate text-base font-bold text-gray-900">{selectedCategory}</h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => showParentProducts(selectedCategory)}
                      className="shrink-0 text-[10px] font-bold text-blue-600"
                    >
                      View all
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-x-2 gap-y-4">
                    <button
                      type="button"
                      onClick={() => showParentProducts(selectedCategory)}
                      className={`group min-w-0 text-center ${!selectedSubcategory ? 'text-blue-600' : 'text-gray-800'}`}
                    >
                      <span className={`relative mx-auto block aspect-square w-full overflow-hidden rounded-2xl border bg-[#F1F3F8] ${
                        !selectedSubcategory ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-transparent'
                      }`}>
                        {selectedParent?.image ? (
                          <Image src={selectedParent.image} alt={selectedCategory} fill className="object-cover object-top" sizes="(max-width: 639px) 27vw, 100px" />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-xl font-black text-[#083028]">
                            {selectedCategory.charAt(0)}
                          </span>
                        )}
                      </span>
                      <span className="mt-1.5 block line-clamp-2 text-[10px] font-semibold leading-tight">All {selectedCategory}</span>
                    </button>

                    {browserSubcategories.map(({ parent, subcategory }) => (
                      <button
                        key={subcategory.id}
                        type="button"
                        onClick={() => handleSubcategoryChange(parent, subcategory)}
                        className={`group min-w-0 text-center ${
                          selectedSubcategoryNode?.id === subcategory.id ? 'text-blue-600' : 'text-gray-800'
                        }`}
                      >
                        <span className={`relative mx-auto block aspect-square w-full overflow-hidden rounded-2xl border bg-[#F1F3F8] ${
                          selectedSubcategoryNode?.id === subcategory.id
                            ? 'border-blue-500 ring-2 ring-blue-500/10'
                            : 'border-transparent'
                        }`}>
                          {subcategory.image ? (
                            <Image
                              src={subcategory.image}
                              alt={subcategory.name}
                              fill
                              className="object-cover object-top transition duration-300 group-active:scale-95"
                              sizes="(max-width: 639px) 27vw, 100px"
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-xl font-black text-[#083028]">
                              {subcategory.name.charAt(0)}
                            </span>
                          )}
                        </span>
                        <span className="mt-1.5 block line-clamp-2 text-[10px] font-semibold leading-tight">
                          {subcategory.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Parent category and subcategory browser */}
      {categoryTree.length > 0 && (
        <section className="hidden border-b border-gray-200 bg-white py-4 sm:block sm:py-6">
          <div className="container mx-auto max-w-7xl px-3 sm:px-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:p-5">
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-amber-700">
                    Shop by collection
                  </p>
                  <h2 className="text-lg font-black text-gray-900 sm:text-2xl">Browse categories</h2>
                </div>
                {selectedCategory !== 'All' && (
                  <button
                    type="button"
                    onClick={() => showParentProducts(selectedCategory)}
                    className="shrink-0 text-xs font-bold text-[#083028] hover:underline sm:text-sm"
                  >
                    View products
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-6 lg:grid-cols-7">
                <button
                  type="button"
                  onClick={() => handleCategoryChange('All')}
                  className={`group flex min-w-0 flex-col items-center rounded-xl border p-2 text-center transition sm:p-3 ${
                    selectedCategory === 'All'
                      ? 'border-[#083028] bg-[#EAF4F0] shadow-sm ring-1 ring-[#083028]/10'
                      : 'border-gray-200 bg-[#FAFAF8] hover:-translate-y-0.5 hover:border-[#083028]/30 hover:shadow-sm'
                  }`}
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#DDECE6] text-[#083028] sm:h-16 sm:w-16">
                    <Layers3 size={24} />
                  </span>
                  <span className="mt-2 line-clamp-2 text-[11px] font-bold leading-tight text-gray-900 sm:text-xs">All</span>
                  <span className="mt-0.5 text-[9px] font-medium text-gray-500 sm:text-[10px]">
                    {allProducts.length} products
                  </span>
                </button>

                {categoryTree.map((category) => {
                  const childCount = (category.children || []).length;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => handleCategoryChange(category.name)}
                      className={`group flex min-w-0 flex-col items-center rounded-xl border p-2 text-center transition sm:p-3 ${
                        selectedCategory === category.name
                          ? 'border-[#083028] bg-[#EAF4F0] shadow-sm ring-1 ring-[#083028]/10'
                          : 'border-gray-200 bg-[#FAFAF8] hover:-translate-y-0.5 hover:border-[#083028]/30 hover:shadow-sm'
                      }`}
                    >
                      <span className="relative h-14 w-14 overflow-hidden rounded-xl bg-[#F4F1EA] sm:h-16 sm:w-16">
                        {category.image ? (
                          <Image
                            src={category.image}
                            alt={category.name}
                            fill
                            className="object-cover object-top transition duration-300 group-hover:scale-105"
                            sizes="64px"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-xl font-black text-[#083028]">
                            {category.name.charAt(0)}
                          </span>
                        )}
                      </span>
                      <span className="mt-2 line-clamp-2 text-[11px] font-bold leading-tight text-gray-900 sm:text-xs">
                        {category.name}
                      </span>
                      <span className="mt-0.5 text-[9px] font-medium text-gray-500 sm:text-[10px]">
                        {childCount} {childCount === 1 ? 'subcategory' : 'subcategories'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {selectedCategory !== 'All' && (
                <div className="mt-5 border-t border-gray-200 pt-4 sm:mt-6 sm:pt-5">
                  <div className="mb-3">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-gray-400">Subcategories</p>
                    <h3 className="text-base font-black text-gray-900 sm:text-lg">Shop {selectedCategory}</h3>
                  </div>

                  {browserSubcategories.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-6 lg:grid-cols-7">
                      {browserSubcategories.map(({ parent, subcategory }) => (
                        <button
                          key={subcategory.id}
                          type="button"
                          onClick={() => handleSubcategoryChange(parent, subcategory)}
                          className={`group min-w-0 rounded-xl border p-2 text-center transition sm:p-3 ${
                            selectedSubcategoryNode?.id === subcategory.id
                              ? 'border-amber-600 bg-amber-50 shadow-sm ring-1 ring-amber-600/10'
                              : 'border-gray-200 bg-white hover:-translate-y-0.5 hover:border-amber-600/40 hover:shadow-sm'
                          }`}
                        >
                          <span className="relative mx-auto block aspect-square w-full max-w-20 overflow-hidden rounded-xl bg-[#F4F1EA]">
                            {subcategory.image ? (
                              <Image
                                src={subcategory.image}
                                alt={subcategory.name}
                                fill
                                className="object-cover object-top transition duration-300 group-hover:scale-105"
                                sizes="80px"
                              />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-xl font-black text-[#083028]">
                                {subcategory.name.charAt(0)}
                              </span>
                            )}
                          </span>
                          <span className="mt-2 block line-clamp-2 text-[11px] font-bold leading-tight text-gray-900 sm:text-xs">
                            {subcategory.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => showParentProducts(selectedCategory)}
                      className="flex w-full items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-left transition hover:border-[#083028]/40 hover:bg-[#F4F8F6]"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F2EE] text-[#083028]">
                        <Layers3 size={20} />
                      </span>
                      <span>
                        <span className="block text-sm font-bold text-gray-900">View all {selectedCategory}</span>
                        <span className="block text-xs text-gray-500">No subcategories have been added yet.</span>
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* MAIN CONTENT */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">

        {/* Control Bar — 1 single responsive line on all screen sizes */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-4 mb-4 sm:mb-8 shadow-xs border border-gray-200/80 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <p className="text-xs sm:text-sm text-gray-600 font-medium truncate">
              {loading ? (
                <span className="flex items-center gap-1 text-gray-400">
                  <Loader2 size={12} className="animate-spin" /> Loading...
                </span>
              ) : (
                <>
                  <span className="hidden sm:inline">Showing </span>
                  <span className="font-bold text-gray-900">
                    {filteredProducts.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}
                    -{Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)}
                  </span>{' '}
                  of <span className="font-bold text-gray-900">{filteredProducts.length}</span>
                  <span className="hidden sm:inline"> products</span>
                </>
              )}
            </p>
          </div>
          <div className="flex w-full items-center gap-1.5 sm:w-auto sm:gap-2 sm:flex-shrink-0">
            <label htmlFor="catalog-price" className="hidden text-xs text-gray-500 sm:inline sm:text-sm">Price:</label>
            <select
              id="catalog-price"
              value={selectedPriceRange}
              onChange={(event) => {
                setSelectedPriceRange(Number(event.target.value));
                setCurrentPage(1);
              }}
              className="min-w-0 flex-1 bg-gray-50 border border-gray-200 text-gray-800 text-xs sm:flex-none sm:text-sm font-medium rounded-lg sm:rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 focus:outline-none focus:ring-1 focus:ring-[#083028]"
            >
              {PRICE_RANGES.map((range, index) => (
                <option key={range.label} value={index}>{range.label}</option>
              ))}
            </select>
            <ArrowUpDown size={14} className="text-gray-400 hidden sm:block" />
            <span className="text-xs sm:text-sm text-gray-500 hidden sm:block">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
              className="min-w-0 flex-1 bg-gray-50 border border-gray-200 text-gray-800 text-xs sm:flex-none sm:text-sm font-medium rounded-lg sm:rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 focus:outline-none focus:ring-1 focus:ring-[#083028]"
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
            </select>
          </div>
        </div>

        {/* Active Filter Badges */}
        {(selectedCategory !== 'All' || selectedSubcategory || selectedPriceRange !== 0) && (
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-4 sm:mb-6">
            <span className="text-[11px] sm:text-xs text-gray-400 font-semibold uppercase tracking-wider">Active:</span>
            {selectedCategory !== 'All' && (
              <span className="inline-flex items-center gap-1 bg-[#083028] text-white text-[11px] sm:text-xs font-semibold px-2.5 py-1 rounded-full">
                {selectedCategory}
                <button onClick={() => handleCategoryChange('All')} className="hover:bg-white/20 rounded-full p-0.5">
                  <X size={11} />
                </button>
              </span>
            )}
            {selectedSubcategory && (
              <span className="inline-flex items-center gap-1 bg-amber-600 text-white text-[11px] sm:text-xs font-semibold px-2.5 py-1 rounded-full">
                {selectedSubcategory}
                <button
                  onClick={() => handleCategoryChange(selectedCategory)}
                  className="hover:bg-white/20 rounded-full p-0.5"
                  aria-label="Clear subcategory filter"
                >
                  <X size={11} />
                </button>
              </span>
            )}
            {selectedPriceRange !== 0 && (
              <span className="inline-flex items-center gap-1 bg-[#083028] text-white text-[11px] sm:text-xs font-semibold px-2.5 py-1 rounded-full">
                {PRICE_RANGES[selectedPriceRange].label}
                <button onClick={() => setSelectedPriceRange(0)} className="hover:bg-white/20 rounded-full p-0.5">
                  <X size={11} />
                </button>
              </span>
            )}
            <button onClick={resetFilters} className="text-[11px] sm:text-xs font-bold text-[#083028] underline ml-1 hover:opacity-80">
              Clear All
            </button>
          </div>
        )}

        {/* PRODUCTS GRID */}
        <div id="catalog-products" className="scroll-mt-24">
            {searchQuery && (
              <div className="mb-4 p-3.5 bg-white rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500">Searching for:</span>
                  <span className="text-xs font-bold text-[#083028] bg-[#083028]/10 px-3 py-1 rounded-full">
                    &ldquo;{searchQuery}&rdquo;
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    const categoryPart = selectedCategory === 'All'
                      ? ''
                      : `category=${encodeURIComponent(selectedCategory)}`;
                    const subcategoryPart = selectedSubcategory
                      ? `subcategory=${encodeURIComponent(selectedSubcategory)}`
                      : '';
                    const queryString = [categoryPart, subcategoryPart].filter(Boolean).join('&');
                    router.push(queryString ? `/category?${queryString}` : '/category');
                  }}
                  className="text-xs font-semibold text-red-600 hover:underline flex items-center gap-1"
                >
                  <X size={14} />
                  Clear Search
                </button>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-400">
                <Loader2 size={36} className="animate-spin text-[#083028]" />
                <p className="text-sm font-medium">Loading products from database...</p>
              </div>
            ) : paginatedProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4 md:gap-5">
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
              <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-gray-200 shadow-sm">
                {searchQuery ? (
                  <>
                    <div className="w-16 h-16 bg-amber-50 text-amber-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-200/50">
                      <SearchX size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      No products found for &ldquo;{searchQuery}&rdquo;
                    </h3>
                    <p className="text-gray-500 text-sm max-w-md mx-auto mb-6 leading-relaxed">
                      We couldn&apos;t find this item in our store. AR Garment specializes in authentic Indian ethnic wear, designer sarees, salwar suits, and traditional dupattas.
                    </p>
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                      <button
                        onClick={resetFilters}
                        className="bg-[#083028] hover:bg-[#051e19] text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm"
                      >
                        Clear Search &amp; View All
                      </button>
                      <button
                        onClick={() => handleCategoryChange('Sarees')}
                        className="bg-[#FAF8F3] hover:bg-[#F5F1E8] text-[#083028] px-5 py-2.5 rounded-xl font-semibold text-sm border border-gray-200 transition-colors"
                      >
                        Browse Sarees
                      </button>
                    </div>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            )}
        </div>
      </div>

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
