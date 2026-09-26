'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShoppingCart, Heart, Share2, ShieldCheck, Truck, RotateCcw,
  CheckCircle2, ChevronRight, ArrowLeft, Loader2, Sparkles,
  Minus, Plus, CreditCard, Tag
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';

interface ProductData {
  id: string;
  name: string;
  price: string;
  numericPrice?: number;
  category: string;
  image: string;
  images?: string[];
  description?: string;
  specification?: string;
  shippingCare?: string;
  stock?: number;
  active: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;

  const [product, setProduct] = useState<ProductData | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'shipping'>('description');
  const [copiedShare, setCopiedShare] = useState(false);

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    setError('');

    // Fetch product details strictly from DB — no-store to always get latest after admin updates
    fetch(`/api/products/${productId}`, { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error('Product not found in database');
        return res.json();
      })
      .then((data: Record<string, unknown>) => {
        const mapped: ProductData = {
          id: data.id as string,
          name: data.name as string,
          price: data.price as string,
          numericPrice: data.numeric_price as number,
          category: (data.category as string) || 'Ethnic Wear',
          image: data.image as string,
          images: Array.isArray(data.images) && data.images.length > 0
            ? (data.images as string[])
            : (data.image ? [data.image as string] : []),
          description: (data.description as string) || '',
          specification: (data.specification as string) || '',
          shippingCare: (data.shipping_care as string) || (data.shippingCare as string) || '',
          stock: typeof data.stock === 'number' ? (data.stock as number) : 0,
          active: (data.active as boolean) ?? true,
          isNewArrival: (data.is_new_arrival as boolean) ?? false,
          isBestSeller: (data.is_best_seller as boolean) ?? false,
        };

        setProduct(mapped);
        setSelectedImage(mapped.images?.[0] || mapped.image || '');

        // Fetch related products from DB from same category — no-store
        fetch('/api/products', { cache: 'no-store' })
          .then((r) => (r.ok ? r.json() : []))
          .then((all: Record<string, unknown>[]) => {
            const related = all
              .filter((p) => p.id !== mapped.id && p.active !== false && p.category === mapped.category)
              .slice(0, 4)
              .map((p) => ({
                id: p.id as string,
                name: p.name as string,
                price: p.price as string,
                numericPrice: p.numeric_price as number,
                category: p.category as string,
                image: p.image as string,
                active: p.active as boolean,
              }));
            setRelatedProducts(related);
          })
          .catch(() => {});
      })
      .catch((err) => {
        setError(err.message || 'Product could not be loaded from database.');
      })
      .finally(() => setLoading(false));
  }, [productId]);

  const handleAddToCart = () => {
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 size={40} className="animate-spin text-[#083028]" />
          <p className="text-gray-600 font-medium text-sm">Loading product details from database...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex flex-col">
        <Header />
        <div className="flex-1 max-w-xl mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-2xl">
            !
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h1>
          <p className="text-gray-600 text-sm mb-6">
            The requested product (ID: <span className="font-mono">{productId}</span>) was not found in the database.
          </p>
          <Link
            href="/category"
            className="inline-flex items-center gap-2 bg-[#083028] text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-[#051e19] transition-colors"
          >
            <ArrowLeft size={16} /> Browse All Collections
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const galleryImages = (product.images && product.images.length > 0)
    ? product.images
    : (product.image ? [product.image] : []);

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <Header />

      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
            <Link href="/" className="hover:text-[#083028] transition-colors">Home</Link>
            <ChevronRight size={13} className="text-gray-400" />
            <Link href="/category" className="hover:text-[#083028] transition-colors">Collections</Link>
            <ChevronRight size={13} className="text-gray-400" />
            <Link href={`/category?category=${encodeURIComponent(product.category)}`} className="hover:text-[#083028] transition-colors">
              {product.category}
            </Link>
            <ChevronRight size={13} className="text-gray-400" />
            <span className="text-gray-900 font-semibold truncate max-w-[200px] sm:max-w-xs">{product.name}</span>
          </div>
        </div>
      </div>

      {/* Main Product Section */}
      <main className="container mx-auto px-4 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

          {/* LEFT SIDE: Image Gallery from DB */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* Primary Main Image Showcase */}
            <div className="relative w-full bg-[#EDE8DF] rounded-3xl overflow-hidden shadow-sm border border-gray-200/80" style={{ height: 'clamp(380px, 55vw, 620px)' }}>
              {selectedImage ? (
                <Image
                  src={selectedImage}
                  alt={product.name}
                  fill
                  priority
                  className="object-cover object-top transition-all duration-300"
                  sizes="(max-width: 1024px) 100vw, 55vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                  No image available in database
                </div>
              )}

              {/* Badges Overlay */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                {product.isNewArrival && (
                  <span className="bg-[#083028] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                    <Sparkles size={12} /> New Arrival
                  </span>
                )}
                {product.isBestSeller && (
                  <span className="bg-amber-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    ★ Best Seller
                  </span>
                )}
              </div>

              {/* Wishlist Button Overlay */}
              <button
                onClick={() => setIsWishlisted(!isWishlisted)}
                className="absolute top-4 right-4 z-10 w-11 h-11 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white hover:scale-105 transition-all"
                aria-label="Wishlist"
              >
                <Heart
                  size={20}
                  className={isWishlisted ? 'fill-red-500 text-red-500' : 'text-[#083028]'}
                />
              </button>
            </div>

            {/* Thumbnail Row (Multiple Images from DB) */}
            {galleryImages.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`relative w-20 h-24 sm:w-24 sm:h-28 rounded-2xl overflow-hidden flex-shrink-0 border-2 transition-all bg-white ${
                      selectedImage === img
                        ? 'border-[#083028] ring-2 ring-[#083028]/20 shadow-md scale-95'
                        : 'border-gray-200 hover:border-gray-400 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      fill
                      className="object-cover object-top"
                      sizes="96px"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Trust Points */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-white rounded-2xl border border-gray-200/80 text-center">
              <div className="flex flex-col items-center gap-1.5 p-2">
                <Truck size={22} className="text-[#083028]" />
                <span className="text-xs font-bold text-gray-800">Free Delivery</span>
                <span className="text-[11px] text-gray-500">Pan-India express</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-2 border-x border-gray-100">
                <RotateCcw size={22} className="text-[#083028]" />
                <span className="text-xs font-bold text-gray-800">7 Days Return</span>
                <span className="text-[11px] text-gray-500">Hassle-free pickups</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-2">
                <ShieldCheck size={22} className="text-[#083028]" />
                <span className="text-xs font-bold text-gray-800">100% Authentic</span>
                <span className="text-[11px] text-gray-500">Quality assured</span>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Product Name, Price, Actions, Information from DB */}
          <div className="lg:col-span-5 flex flex-col gap-6 bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-sm">
            
            {/* Header / Category & Actions */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#083028] bg-[#083028]/10 px-3 py-1 rounded-full flex items-center gap-1">
                  <Tag size={12} /> {product.category}
                </span>
                <button
                  onClick={handleShare}
                  className="text-xs text-gray-500 hover:text-[#083028] flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <Share2 size={13} />
                  <span>{copiedShare ? 'Link Copied!' : 'Share'}</span>
                </button>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                {product.name}
              </h1>
              <p className="text-xs text-gray-400 font-mono mt-1">Product ID: {product.id}</p>
            </div>

            {/* Price Showcase from DB */}
            <div className="p-4 bg-[#FAF8F3] rounded-2xl border border-[#EDE8DF] flex items-baseline justify-between">
              <div>
                <p className="text-3xl font-black text-[#083028]">
                  {product.price}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Inclusive of all taxes</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full">
                <CheckCircle2 size={13} />
                <span>
                  {product.stock && product.stock > 0
                    ? `In Stock (${product.stock} available)`
                    : 'In Stock'}
                </span>
              </div>
            </div>

            {/* Quantity Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                Quantity:
              </label>
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center border border-gray-300 rounded-xl bg-gray-50 p-1">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed shadow-xs transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-12 text-center text-sm font-bold text-gray-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock || 10, q + 1))}
                    disabled={quantity >= (product.stock || 10)}
                    className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed shadow-xs transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                className={`flex-1 py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all duration-200 ${
                  addedToCart
                    ? 'bg-emerald-700 text-white'
                    : 'bg-[#083028] hover:bg-[#051e19] text-white hover:shadow-md'
                }`}
              >
                <ShoppingCart size={18} />
                {addedToCart ? 'Added to Cart ✓' : 'Add to Cart'}
              </button>
              <button
                onClick={() => {
                  handleAddToCart();
                  router.push('/category');
                }}
                className="flex-1 py-3.5 px-6 rounded-2xl font-bold text-sm bg-[#F5F1E8] hover:bg-[#ebe4d5] text-[#083028] border border-[#083028]/20 flex items-center justify-center gap-2 transition-colors"
              >
                <CreditCard size={18} />
                Buy Now
              </button>
            </div>

            {/* Information Tabs — Completely rendered from DB */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center gap-4 border-b border-gray-200 pb-2 mb-4 text-xs font-bold uppercase tracking-wider">
                <button
                  onClick={() => setActiveTab('description')}
                  className={`pb-2 -mb-2 border-b-2 transition-colors ${
                    activeTab === 'description'
                      ? 'border-[#083028] text-[#083028]'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Description
                </button>
                <button
                  onClick={() => setActiveTab('specifications')}
                  className={`pb-2 -mb-2 border-b-2 transition-colors ${
                    activeTab === 'specifications'
                      ? 'border-[#083028] text-[#083028]'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Specifications
                </button>
                <button
                  onClick={() => setActiveTab('shipping')}
                  className={`pb-2 -mb-2 border-b-2 transition-colors ${
                    activeTab === 'shipping'
                      ? 'border-[#083028] text-[#083028]'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Shipping &amp; Care
                </button>
              </div>

              {/* Tab 1: Description from DB */}
              {activeTab === 'description' && (
                <div className="text-sm text-gray-700 space-y-3 leading-relaxed">
                  {product.description ? (
                    <div className="bg-[#FAF8F3] p-4 rounded-2xl border border-gray-200/80 whitespace-pre-line leading-relaxed">
                      {product.description}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">
                      No description has been added for this product in the admin panel yet.
                    </p>
                  )}
                </div>
              )}

              {/* Tab 2: Specifications from DB */}
              {activeTab === 'specifications' && (
                <div className="text-xs text-gray-700 space-y-3">
                  {product.specification ? (
                    <div className="bg-[#FAF8F3] p-4 rounded-2xl border border-gray-200/80 leading-relaxed whitespace-pre-line text-sm text-gray-800">
                      {product.specification}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">
                      No specifications have been added for this product in the admin panel yet.
                    </p>
                  )}
                  <div className="divide-y divide-gray-100 bg-white border border-gray-100 rounded-xl p-3">
                    <div className="py-1.5 flex justify-between">
                      <span className="font-semibold text-gray-500">Category</span>
                      <span className="font-medium text-gray-900">{product.category}</span>
                    </div>
                    <div className="py-1.5 flex justify-between">
                      <span className="font-semibold text-gray-500">Product Code</span>
                      <span className="font-mono text-gray-700">{product.id}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Shipping & Care from DB */}
              {activeTab === 'shipping' && (
                <div className="text-xs text-gray-700 space-y-3 leading-relaxed">
                  {product.shippingCare ? (
                    <div className="bg-[#FAF8F3] p-4 rounded-2xl border border-gray-200/80 whitespace-pre-line text-sm text-gray-800 leading-relaxed">
                      {product.shippingCare}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">
                      No specific care instructions have been added for this product yet.
                    </p>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* RELATED PRODUCTS FROM DB */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 sm:mt-20 pt-12 border-t border-gray-200">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">More From {product.category}</h2>
                <p className="text-xs text-gray-500 mt-1">Live recommendations from database</p>
              </div>
              <Link
                href={`/category?category=${encodeURIComponent(product.category)}`}
                className="text-xs font-bold text-[#083028] hover:underline"
              >
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((rel) => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
