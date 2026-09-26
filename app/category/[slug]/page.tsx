'use client';

import { useState } from 'react';
import { ShoppingCart, Heart, Filter, ChevronDown, Grid, List, X } from 'lucide-react';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Mock product data - replace with actual data from your API
const mockProducts = [
  { id: 1, name: 'Elegant Silk Saree with Embroidery', price: '₹2,499', image: '/home-images/Sarees.jpg', category: 'sarees-dupatta-sets' },
  { id: 2, name: 'Designer Cotton Suit Set', price: '₹1,899', image: '/home-images/Suits & Dress Materia.jpg', category: 'suits-dress-material' },
  { id: 3, name: 'Premium Dupatta Set', price: '₹1,299', image: '/home-images/Dupatta Sets.jpg', category: 'sarees-dupatta-sets' },
  { id: 4, name: 'Traditional Kurta for Men', price: '₹999', image: '/home-images/Men Fashion.jpg', category: 'men-fashion' },
  { id: 5, name: 'Kids Ethnic Wear Set', price: '₹799', image: '/home-images/Kids Fashion.jpg', category: 'kids-fashion' },
  { id: 6, name: 'Banarasi Silk Saree', price: '₹3,499', image: '/home-images/Sarees.jpg', category: 'sarees-dupatta-sets' },
  { id: 7, name: 'Chikankari Suit Material', price: '₹1,599', image: '/home-images/Suits & Dress Materia.jpg', category: 'suits-dress-material' },
  { id: 8, name: 'Phulkari Dupatta', price: '₹899', image: '/home-images/Dupatta Sets.jpg', category: 'sarees-dupatta-sets' },
  { id: 9, name: 'Nehru Jacket Men', price: '₹1,199', image: '/home-images/Men Fashion.jpg', category: 'men-fashion' },
  { id: 10, name: 'Kids Lehenga Choli', price: '₹1,099', image: '/home-images/Kids Fashion.jpg', category: 'kids-fashion' },
  { id: 11, name: 'Kanjivaram Saree', price: '₹4,999', image: '/home-images/Sarees.jpg', category: 'sarees-dupatta-sets' },
  { id: 12, name: 'Printed Suit Set', price: '₹1,399', image: '/home-images/Suits & Dress Materia.jpg', category: 'suits-dress-material' },
];

const categoryInfo: Record<string, { title: string; description: string; bgImage: string; objectPosition?: string }> = {
  'suits-dress-material': {
    title: 'Suits & Dress Material',
    description: 'Discover our exquisite collection of unstitched and ready-to-wear suits',
    bgImage: '/home-images/hero-image1.jpg',
    objectPosition: 'center',
  },
  'sarees-dupatta-sets': {
    title: 'Sarees & Dupatta Sets',
    description: 'Elegant drapes and complete dupatta sets for every occasion',
    bgImage: '/home-images/hero-image2.jpg',
    objectPosition: 'center',
  },
  'men-fashion': {
    title: 'Men Fashion',
    description: 'Traditional and trendy ethnic wear for men',
    bgImage: '/home-images/Men Fashion.jpg',
    objectPosition: 'center top',
  },
  'kids-fashion': {
    title: 'Kids Fashion',
    description: 'Adorable ethnic wear for little ones',
    bgImage: '/home-images/Kids Fashion.jpg',
    objectPosition: 'center top',
  },
};

const filters = {
  categories: ['Sarees', 'Suits', 'Dupatta Sets', 'Men Wear', 'Kids Wear'],
  priceRanges: ['Under ₹500', '₹500 - ₹1000', '₹1000 - ₹2000', '₹2000 - ₹5000', 'Above ₹5000'],
};

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const productsPerPage = 8;
  const info = categoryInfo[params.slug] || { title: 'Category', description: '', bgImage: '/home-images/Sarees.jpg' };

  // Filter products based on selected filters
  const filteredProducts = mockProducts.filter((product) => {
    if (selectedCategory && !product.category.includes(params.slug)) return false;
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, startIndex + productsPerPage);

  const ProductCard = ({ product }: { product: typeof mockProducts[0] }) => (
    <div className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300">
      <div className="relative bg-[#EDE8DF]" style={{ height: '260px' }}>
        <button className="absolute top-2.5 right-2.5 z-10 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-red-50 transition-colors">
          <Heart size={15} className="text-[#083028] hover:text-red-500 transition-colors" strokeWidth={1.5} />
        </button>
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-base leading-snug mb-2 line-clamp-2">
          {product.name}
        </h3>
        <p className="text-lg font-bold text-[#083028] mb-4">
          {product.price}
        </p>
        <button className="w-full border border-gray-300 bg-[#F5F1E8] hover:bg-[#083028] hover:text-white hover:border-[#083028] text-gray-700 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2">
          <ShoppingCart size={14} strokeWidth={1.5} />
          Add to Cart
        </button>
      </div>
    </div>
  );

  const ProductListItem = ({ product }: { product: typeof mockProducts[0] }) => (
    <div className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col sm:flex-row">
      <div className="relative bg-[#EDE8DF] sm:w-64" style={{ height: '200px' }}>
        <button className="absolute top-2.5 right-2.5 z-10 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-red-50 transition-colors">
          <Heart size={15} className="text-[#083028] hover:text-red-500 transition-colors" strokeWidth={1.5} />
        </button>
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-gray-900 text-lg leading-snug mb-2">
            {product.name}
          </h3>
          <p className="text-xl font-bold text-[#083028] mb-4">
            {product.price}
          </p>
        </div>
        <button className="w-full sm:w-auto border border-gray-300 bg-[#F5F1E8] hover:bg-[#083028] hover:text-white hover:border-[#083028] text-gray-700 py-2.5 px-6 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2">
          <ShoppingCart size={14} strokeWidth={1.5} />
          Add to Cart
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F1E8] flex flex-col">
      <Header />
      
      {/* Hero Section with Background Image */}
<div className="relative h-80 sm:h-96 md:h-[450px] lg:h-[500px] bg-gray-200">
  <Image
    src={info.bgImage}
    alt={info.title}
    fill
    className={`object-contain ${info.objectPosition || 'object-center'}`}
    priority
    sizes="100vw"
  />
  <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/70" />
  <div className="absolute inset-0 flex items-center justify-center text-center px-4">
    <div className="max-w-4xl">
      <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 md:mb-3">{info.title}</h1>
      <p className="text-sm sm:text-base md:text-lg text-gray-200">{info.description}</p>
    </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="hidden lg:block lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Filters</h2>

              {/* Category Filter */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide">Category</h3>
                <div className="space-y-3">
                  {filters.categories.map((cat) => (
                    <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        className="w-5 h-5 text-[#083028] rounded border-gray-300 focus:ring-2 focus:ring-[#083028] focus:ring-offset-0 cursor-pointer"
                        checked={selectedCategory === cat}
                        onChange={(e) => setSelectedCategory(e.target.checked ? cat : '')}
                      />
                      <span className="text-sm text-gray-700 group-hover:text-[#083028] transition-colors">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide">Price Range</h3>
                <div className="space-y-3">
                  {filters.priceRanges.map((range) => (
                    <label key={range} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        className="w-5 h-5 text-[#083028] rounded border-gray-300 focus:ring-2 focus:ring-[#083028] focus:ring-offset-0 cursor-pointer"
                        checked={selectedPriceRange === range}
                        onChange={(e) => setSelectedPriceRange(e.target.checked ? range : '')}
                      />
                      <span className="text-sm text-gray-700 group-hover:text-[#083028] transition-colors">{range}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              <button
                className="w-full py-3 border border-[#083028] text-[#083028] rounded-lg text-sm font-semibold hover:bg-[#083028] hover:text-white transition-all duration-200 shadow-sm hover:shadow-md"
                onClick={() => {
                  setSelectedCategory('');
                  setSelectedPriceRange('');
                }}
              >
                Clear All Filters
              </button>
            </div>
          </aside>

          {/* Products Section */}
          <main className="flex-1">
            {/* Toolbar */}
            <div className="bg-white rounded-xl p-4 mb-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3 ml-auto">
                <button
                  className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-[#F5F1E8]"
                  onClick={() => setMobileFilterOpen(true)}
                >
                  <Filter size={16} />
                  Filters
                </button>
                <div className="flex items-center gap-1 border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    className={`p-2 ${viewMode === 'grid' ? 'bg-[#083028] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid size={18} />
                  </button>
                  <button
                    className={`p-2 ${viewMode === 'list' ? 'bg-[#083028] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                    onClick={() => setViewMode('list')}
                  >
                    <List size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Products Grid/List */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
                {currentProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="space-y-4 mb-8">
                {currentProducts.map((product) => (
                  <ProductListItem key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2">
                <button
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-[#F5F1E8] disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    className={`w-10 h-10 rounded-lg text-sm font-medium ${
                      currentPage === page
                        ? 'bg-[#083028] text-white'
                        : 'border border-gray-300 hover:bg-[#F5F1E8]'
                    }`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
                <button
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-[#F5F1E8] disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filter Overlay */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:hidden" onClick={() => setMobileFilterOpen(false)}>
          <div className="absolute right-0 top-0 h-full w-80 bg-white p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Filters</h2>
              <button
                className="text-gray-600 hover:text-gray-900"
                onClick={() => setMobileFilterOpen(false)}
              >
                <X size={24} />
              </button>
            </div>
            {/* Mobile filter content - same as sidebar */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide">Category</h3>
              <div className="space-y-3">
                {filters.categories.map((cat) => (
                  <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-5 h-5 text-[#083028] rounded border-gray-300 focus:ring-2 focus:ring-[#083028] focus:ring-offset-0 cursor-pointer"
                      checked={selectedCategory === cat}
                      onChange={(e) => setSelectedCategory(e.target.checked ? cat : '')}
                    />
                    <span className="text-sm text-gray-700 group-hover:text-[#083028] transition-colors">{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide">Price Range</h3>
              <div className="space-y-3">
                {filters.priceRanges.map((range) => (
                  <label key={range} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-5 h-5 text-[#083028] rounded border-gray-300 focus:ring-2 focus:ring-[#083028] focus:ring-offset-0 cursor-pointer"
                      checked={selectedPriceRange === range}
                      onChange={(e) => setSelectedPriceRange(e.target.checked ? range : '')}
                    />
                    <span className="text-sm text-gray-700 group-hover:text-[#083028] transition-colors">{range}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
}
