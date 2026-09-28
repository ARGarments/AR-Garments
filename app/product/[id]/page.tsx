'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShoppingCart, Share2, ShieldCheck, Truck, RotateCcw,
  CheckCircle2, ChevronRight, ArrowLeft, Loader2, Sparkles,
  Minus, Plus, CreditCard, Tag, Ticket, Check, AlertCircle, Percent, RefreshCw
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { useCart } from '@/context/CartContext';

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
  const { addToCart } = useCart();

  const [product, setProduct] = useState<ProductData | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'shipping'>('description');
  const [copiedShare, setCopiedShare] = useState(false);

  // Coupon & Discount states
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountType: string;
    discountValue: number;
    applicableCategory: string;
    discountAmount: number;
    isFreeShipping?: boolean;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [availableOffers, setAvailableOffers] = useState<any[]>([]);

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

        // Fetch coupons applicable to this product category & storewide
        fetch('/api/coupons?active=true', { cache: 'no-store' })
          .then((r) => (r.ok ? r.json() : []))
          .then((list) => {
            if (Array.isArray(list)) {
              const cat = mapped.category.toLowerCase();
              const applicable = list.filter((c: Record<string, unknown>) => {
                const cCat = String(c.applicableCategory || '').toLowerCase();
                return cCat === 'all' || cCat === cat;
              });
              // Sort category-specific to the top
              applicable.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
                if (a.applicableCategory !== 'All' && b.applicableCategory === 'All') return -1;
                if (b.applicableCategory !== 'All' && a.applicableCategory === 'All') return 1;
                return 0;
              });
              setAvailableOffers(applicable);
            }
          })
          .catch(() => {});

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

  // Handle Apply Coupon with category validation
  const handleApplyCoupon = async (codeToUse?: string) => {
    if (!product) return;
    const targetCode = (codeToUse || couponInput).trim();
    if (!targetCode) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    setCouponLoading(true);
    setCouponError('');
    setCouponSuccess('');

    const unitPrice = product.numericPrice || parseInt(product.price.replace(/[^\d]/g, '') || '0', 10);
    const orderTotal = unitPrice * quantity;

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: targetCode,
          category: product.category,
          orderAmount: orderTotal,
        }),
      });

      const result = await res.json();

      if (result.valid) {
        setAppliedCoupon({
          code: result.coupon.code,
          discountType: result.coupon.discountType,
          discountValue: result.coupon.discountValue,
          applicableCategory: result.coupon.applicableCategory,
          discountAmount: result.discountAmount,
          isFreeShipping: result.isFreeShipping,
        });
        setCouponSuccess(result.message);
        setCouponInput(result.coupon.code);
        setCouponError('');
      } else {
        setCouponError(result.message || 'Coupon could not be applied.');
        setCouponSuccess('');
      }
    } catch {
      setCouponError('Failed to validate coupon. Please try again.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponSuccess('');
    setCouponError('');
    setCouponInput('');
  };

  const handleRefreshCoupons = async () => {
    if (!product) return;
    try {
      const res = await fetch('/api/coupons?active=true', { cache: 'no-store' });
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list)) {
          const cat = product.category.toLowerCase();
          const applicable = list.filter((c: Record<string, unknown>) => {
            const cCat = String(c.applicableCategory || '').toLowerCase();
            return cCat === 'all' || cCat === cat;
          });
          applicable.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
            if (a.applicableCategory !== 'All' && b.applicableCategory === 'All') return -1;
            if (b.applicableCategory !== 'All' && a.applicableCategory === 'All') return 1;
            return 0;
          });
          setAvailableOffers(applicable);
        }
      }
    } catch {}
  };

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      numericPrice: product.numericPrice,
      image: product.image,
      category: product.category,
    }, quantity);
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

            {/* Price Showcase from DB with Dynamic Coupon Discount */}
            <div className="p-4 bg-[#FAF8F3] rounded-2xl border border-[#EDE8DF] flex items-baseline justify-between">
              <div>
                {appliedCoupon ? (
                  <div>
                    <div className="flex items-baseline gap-2.5">
                      <p className="text-3xl font-black text-[#083028]">
                        ₹{Math.max(
                          0,
                          (product.numericPrice || parseInt(product.price.replace(/[^\d]/g, '') || '0', 10)) * quantity - appliedCoupon.discountAmount
                        ).toLocaleString('en-IN')}
                      </p>
                      <span className="text-sm line-through text-gray-400 font-semibold">
                        ₹{(
                          (product.numericPrice || parseInt(product.price.replace(/[^\d]/g, '') || '0', 10)) * quantity
                        ).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <Sparkles size={11} /> Saved ₹{appliedCoupon.discountAmount} ({appliedCoupon.code})
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-3xl font-black text-[#083028]">
                      {quantity > 1
                        ? `₹${((product.numericPrice || parseInt(product.price.replace(/[^\d]/g, '') || '0', 10)) * quantity).toLocaleString('en-IN')}`
                        : product.price}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Inclusive of all taxes</p>
                  </div>
                )}
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
                    onClick={() => {
                      const nextQ = Math.max(1, quantity - 1);
                      setQuantity(nextQ);
                      if (appliedCoupon) handleApplyCoupon(appliedCoupon.code);
                    }}
                    disabled={quantity <= 1}
                    className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed shadow-xs transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-12 text-center text-sm font-bold text-gray-900">{quantity}</span>
                  <button
                    onClick={() => {
                      const nextQ = Math.min(product.stock || 10, quantity + 1);
                      setQuantity(nextQ);
                      if (appliedCoupon) handleApplyCoupon(appliedCoupon.code);
                    }}
                    disabled={quantity >= (product.stock || 10)}
                    className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed shadow-xs transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
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
                  router.push('/cart');
                }}
                className="flex-1 py-3.5 px-6 rounded-2xl font-bold text-sm bg-[#F5F1E8] hover:bg-[#ebe4d5] text-[#083028] border border-[#083028]/20 flex items-center justify-center gap-2 transition-colors"
              >
                <CreditCard size={18} />
                Buy Now
              </button>
            </div>

            {/* AVAILABLE DISCOUNT TICKETS SECTION — REALISTIC VOUCHER STUBS */}
            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#083028] text-amber-300 flex items-center justify-center shadow-xs">
                    <Ticket size={17} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 leading-tight flex items-center gap-1.5">
                      <span>Discount Tickets &amp; Vouchers</span>
                      <span className="text-[10px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full">
                        {product.category}
                      </span>
                    </h3>
                    <p className="text-[11px] text-gray-500">Apply active voucher tickets to save instantly</p>
                  </div>
                </div>

                <button
                  onClick={handleRefreshCoupons}
                  title="Check for new coupons"
                  className="p-1.5 text-gray-400 hover:text-[#083028] rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-2xs"
                >
                  <RefreshCw size={13} />
                </button>
              </div>

              {/* Status & Error Alerts */}
              {couponError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-2xl border border-red-200 flex items-start gap-2 animate-in fade-in">
                  <AlertCircle size={15} className="mt-0.5 flex-shrink-0 text-red-600" />
                  <span className="leading-tight">{couponError}</span>
                </div>
              )}

              {couponSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-2xl border border-emerald-200 flex items-center justify-between animate-in fade-in shadow-xs">
                  <div className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-700" />
                    <span>{couponSuccess}</span>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-xs text-red-600 hover:text-red-800 underline font-semibold ml-2"
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* LIST OF TICKET VOUCHERS */}
              {availableOffers.length === 0 ? (
                <div className="p-5 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <Ticket size={24} className="mx-auto text-gray-300 mb-1" />
                  <p className="text-xs font-semibold text-gray-600">No active tickets for this collection</p>
                  <p className="text-[11px] text-gray-400">You can still enter a custom coupon code below.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {availableOffers.map((offer) => {
                    const isCatMatch = offer.applicableCategory && offer.applicableCategory !== 'All';
                    const isStorewide = offer.applicableCategory === 'All';
                    const isCurrentlyApplied = appliedCoupon?.code === offer.code;

                    return (
                      <div
                        key={offer.id || offer.code}
                        className={`relative rounded-2xl border-2 transition-all duration-200 overflow-hidden ${
                          isCurrentlyApplied
                            ? 'bg-gradient-to-r from-emerald-50 via-white to-emerald-50/80 border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
                            : isCatMatch
                            ? 'bg-gradient-to-r from-purple-50/70 via-white to-amber-50/40 border-dashed border-purple-300 hover:border-purple-400 shadow-xs hover:shadow-md'
                            : 'bg-gradient-to-r from-amber-50/60 via-white to-emerald-50/40 border-dashed border-[#B8860B]/40 hover:border-[#B8860B]/70 shadow-xs hover:shadow-md'
                        }`}
                      >
                        {/* Perforated Ticket Notches (Left & Right) */}
                        <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-2 border-dashed border-gray-300 z-10" />
                        <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-2 border-dashed border-gray-300 z-10" />

                        <div className="px-5 py-3.5 sm:px-6 sm:py-4">
                          {/* Ticket Top Ribbon */}
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            {isCatMatch ? (
                              <span className="text-[10px] font-black uppercase tracking-wider text-purple-900 bg-purple-100 border border-purple-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <Sparkles size={11} className="text-purple-600" />
                                Exclusive for {offer.applicableCategory}
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                                🌐 Storewide Voucher
                              </span>
                            )}

                            {offer.minOrderValue > 0 && (
                              <span className="text-[10px] font-semibold text-gray-500">
                                Min. ₹{offer.minOrderValue}
                              </span>
                            )}
                          </div>

                          {/* Ticket Body: Discount & Code Button */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            {/* Left: Discount amount & info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-xl sm:text-2xl font-black text-[#083028] tracking-tight">
                                  {offer.discountType === 'percentage'
                                    ? `${offer.discountValue}% OFF`
                                    : offer.discountType === 'flat'
                                    ? `₹${offer.discountValue} FLAT OFF`
                                    : 'FREE SHIPPING'}
                                </span>
                                {offer.maxDiscountAmount && (
                                  <span className="text-[11px] font-medium text-gray-500">
                                    (up to ₹{offer.maxDiscountAmount})
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-semibold text-gray-800 line-clamp-1 mt-0.5">
                                {offer.title}
                              </p>
                              {offer.description && (
                                <p className="text-[11px] text-gray-500 line-clamp-1">
                                  {offer.description}
                                </p>
                              )}
                            </div>

                            {/* Ticket Perforated Divider (Desktop) */}
                            <div className="hidden sm:block border-l-2 border-dashed border-gray-200 h-10 mx-1" />

                            {/* Right: Code Chip & Action Button */}
                            <div className="flex items-center sm:flex-col sm:items-end justify-between gap-2 flex-shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                              {/* Monospace Code Pill */}
                              <div className="inline-flex items-center gap-1.5 bg-[#083028]/10 border border-[#083028]/20 px-2.5 py-1 rounded-lg">
                                <Tag size={11} className="text-[#083028]" />
                                <span className="font-mono text-xs font-black text-[#083028] tracking-wider">
                                  {offer.code}
                                </span>
                              </div>

                              {/* Apply / Applied Button */}
                              {isCurrentlyApplied ? (
                                <button
                                  onClick={handleRemoveCoupon}
                                  className="inline-flex items-center gap-1 bg-emerald-700 hover:bg-red-600 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs group/btn"
                                >
                                  <Check size={13} className="group-hover/btn:hidden" />
                                  <span className="group-hover/btn:hidden">Applied ✓</span>
                                  <span className="hidden group-hover/btn:inline">Remove ×</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setCouponInput(offer.code);
                                    handleApplyCoupon(offer.code);
                                  }}
                                  disabled={couponLoading}
                                  className="inline-flex items-center gap-1.5 bg-[#083028] hover:bg-[#051e19] text-white px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs hover:scale-102 disabled:opacity-50"
                                >
                                  <Ticket size={12} />
                                  Apply Coupon
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

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
