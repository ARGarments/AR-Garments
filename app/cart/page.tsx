'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Ticket,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  X,
  Lock,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Coupon } from '@/lib/adminData';

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    items,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalCount,
    subtotal,
    shipping,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    discountAmount,
    finalTotal,
  } = useCart();

  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [showCouponsList, setShowCouponsList] = useState(false);

  // Fetch available coupons
  useEffect(() => {
    fetch('/api/coupons?active=true')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setAvailableCoupons(data);
        }
      })
      .catch(() => setAvailableCoupons([]));
  }, []);

  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = (codeToApply || couponCodeInput).trim().toUpperCase();
    if (!code) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    setCouponLoading(true);
    setCouponError(null);

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          orderValue: subtotal,
          category: 'All',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.valid) {
        setCouponError(data.message || 'Invalid or expired coupon code.');
      } else {
        applyCoupon(data.coupon);
        setCouponCodeInput('');
        setCouponError(null);
        setShowCouponsList(false);
      }
    } catch {
      setCouponError('Failed to validate coupon. Please try again.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleCheckout = () => {
    if (!user) {
      router.push('/login?redirect=/checkout');
      return;
    }
    router.push('/checkout');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] flex flex-col justify-between">
      <Header />

      <main className="flex-1 container mx-auto px-3 sm:px-6 lg:px-12 py-6 sm:py-10">
        {/* Breadcrumb & Title */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <Link href="/" className="hover:text-[#083028] transition-colors">Home</Link>
            <span>/</span>
            <span className="text-gray-900 font-semibold">Shopping Bag</span>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h1 className="text-xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
              <span>Shopping Bag</span>
              <span className="text-xs sm:text-sm font-semibold bg-[#083028] text-white px-2.5 py-0.5 rounded-full">
                {totalCount} {totalCount === 1 ? 'item' : 'items'}
              </span>
            </h1>
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-red-600 hover:text-red-700 hover:underline font-semibold flex items-center gap-1"
              >
                <Trash2 size={13} />
                <span>Clear Bag</span>
              </button>
            )}
          </div>
        </div>

        {/* Empty State */}
        {items.length === 0 ? (
          <div className="bg-white rounded-2xl sm:rounded-3xl p-8 sm:p-16 text-center max-w-lg mx-auto shadow-sm border border-gray-100 my-8">
            <div className="w-20 h-20 bg-[#F5F1E8] text-[#083028] rounded-full flex items-center justify-center mx-auto mb-5 shadow-xs">
              <ShoppingBag size={36} strokeWidth={1.5} />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Your Shopping Bag is Empty
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mb-7 leading-relaxed">
              Looks like you haven&apos;t added any beautiful ethnic wear to your bag yet.
              Explore our handcrafted sarees, designer suits, and festive collections.
            </p>
            <Link
              href="/category"
              className="inline-flex items-center gap-2 bg-[#083028] hover:bg-[#051e19] text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <span>Explore Collections</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          /* Main 2-Column Responsive Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
            {/* LEFT: Items List (8 cols on desktop) */}
            <div className="lg:col-span-8 space-y-3 sm:space-y-4">
              {/* Desktop Table Header */}
              <div className="hidden md:grid grid-cols-12 gap-4 bg-white px-5 py-3 rounded-xl text-xs font-bold text-gray-500 uppercase tracking-wider border border-gray-200/80 shadow-xs">
                <span className="col-span-6">Product Details</span>
                <span className="col-span-2 text-center">Price</span>
                <span className="col-span-2 text-center">Quantity</span>
                <span className="col-span-2 text-right">Subtotal</span>
              </div>

              {/* Items Card List */}
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-5 border border-gray-200/80 shadow-xs hover:shadow-sm transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    {/* Image & Title */}
                    <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                      <Link
                        href={`/product/${item.id}`}
                        className="relative w-20 h-24 sm:w-24 sm:h-28 rounded-lg sm:rounded-xl overflow-hidden bg-gray-100 flex-shrink-0"
                      >
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover object-top hover:scale-105 transition-transform"
                        />
                      </Link>

                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                          {item.category || 'Ethnic Wear'}
                        </span>
                        <Link
                          href={`/product/${item.id}`}
                          className="text-xs sm:text-base font-bold text-gray-900 hover:text-[#083028] transition-colors line-clamp-2 leading-snug"
                        >
                          {item.name}
                        </Link>
                        <p className="text-xs sm:text-sm font-bold text-[#083028] mt-1 sm:hidden">
                          {item.price}
                        </p>

                        {/* Mobile Stepper & Remove */}
                        <div className="flex items-center justify-between mt-3 sm:hidden pt-2 border-t border-gray-100">
                          {/* Stepper */}
                          <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded-l-lg transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={13} />
                            </button>
                            <span className="w-8 text-center text-xs font-bold text-gray-900">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded-r-lg transition-colors"
                              aria-label="Increase quantity"
                            >
                              <Plus size={13} />
                            </button>
                          </div>

                          {/* Line total & remove */}
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-extrabold text-gray-900">
                              ₹{(item.numericPrice * item.quantity).toLocaleString()}
                            </span>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                              aria-label="Remove item"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tablet & Desktop View Columns */}
                    <div className="hidden sm:flex sm:items-center sm:justify-between gap-6 sm:w-1/2">
                      {/* Unit Price */}
                      <div className="text-center w-24">
                        <span className="text-sm font-semibold text-gray-700">
                          {item.price}
                        </span>
                      </div>

                      {/* Desktop Stepper */}
                      <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 shadow-2xs">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded-l-lg transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-9 text-center text-sm font-bold text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded-r-lg transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      {/* Line Subtotal */}
                      <div className="text-right w-24">
                        <span className="text-base font-extrabold text-gray-900">
                          ₹{(item.numericPrice * item.quantity).toLocaleString()}
                        </span>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        title="Remove from bag"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Continue Shopping Link */}
              <div className="pt-2">
                <Link
                  href="/category"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#083028] hover:underline"
                >
                  <ArrowLeft size={14} />
                  <span>Continue Shopping</span>
                </Link>
              </div>
            </div>

            {/* RIGHT: Order Summary & Coupon (4 cols on desktop) */}
            <div className="lg:col-span-4 space-y-4 sm:space-y-5 lg:sticky lg:top-24">
              {/* Order Summary Card */}
              <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-gray-200/80 shadow-sm">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100 flex items-center justify-between">
                  <span>Order Summary</span>
                  <ShieldCheck size={18} className="text-[#083028]" />
                </h2>

                {/* Subtotals breakdown */}
                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Bag Subtotal ({totalCount} items)</span>
                    <span className="font-semibold text-gray-900">₹{subtotal.toLocaleString()}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg font-medium">
                      <span className="flex items-center gap-1">
                        <Sparkles size={14} />
                        Coupon ({appliedCoupon?.code})
                      </span>
                      <span className="font-bold">-₹{discountAmount.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <Truck size={14} />
                      Estimated Shipping
                    </span>
                    <span>
                      {shipping === 0 ? (
                        <span className="text-emerald-700 font-bold uppercase text-[11px] bg-emerald-50 px-2 py-0.5 rounded">
                          FREE
                        </span>
                      ) : (
                        `₹${shipping}`
                      )}
                    </span>
                  </div>

                  {subtotal < 500 && shipping > 0 && (
                    <p className="text-[11px] text-gray-400 bg-amber-50 text-amber-800 p-2 rounded-lg leading-tight">
                      Add ₹{(500 - subtotal).toLocaleString()} more to qualify for <strong>FREE Delivery</strong>!
                    </p>
                  )}

                  {/* Divider */}
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-baseline">
                      <div>
                        <span className="text-sm sm:text-base font-extrabold text-gray-900">
                          Total Amount
                        </span>
                        <p className="text-[10px] text-gray-400">Includes all applicable taxes</p>
                      </div>
                      <span className="text-lg sm:text-2xl font-black text-[#083028]">
                        ₹{finalTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Coupon Input Box */}
                <div className="mt-5 pt-4 border-t border-gray-100">
                  {appliedCoupon ? (
                    <div className="bg-[#FAF8F3] border border-[#083028]/20 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#083028] text-white flex items-center justify-center">
                          <Ticket size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">
                            {appliedCoupon.code} Applied!
                          </p>
                          <p className="text-[10px] text-emerald-700 font-medium">
                            {appliedCoupon.discountType === 'percentage'
                              ? `${appliedCoupon.discountValue}% OFF`
                              : `Flat ₹${appliedCoupon.discountValue} OFF`}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={removeCoupon}
                        className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                        title="Remove coupon"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Ticket size={13} className="text-[#083028]" />
                        Apply Coupon Code
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCodeInput}
                          onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                          placeholder="e.g. WELCOME10"
                          className="flex-1 min-w-0 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold uppercase placeholder:normal-case placeholder:font-normal focus:outline-none focus:ring-1 focus:ring-[#083028]"
                        />
                        <button
                          type="button"
                          onClick={() => handleApplyCoupon()}
                          disabled={couponLoading || !couponCodeInput}
                          className="px-3.5 py-2 bg-[#083028] hover:bg-[#051e19] text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                        >
                          {couponLoading ? '...' : 'Apply'}
                        </button>
                      </div>

                      {couponError && (
                        <p className="text-[11px] text-red-600 mt-1.5 font-medium">
                          {couponError}
                        </p>
                      )}

                      {/* View Available Coupons Toggle */}
                      {availableCoupons.length > 0 && (
                        <div className="mt-2.5">
                          <button
                            type="button"
                            onClick={() => setShowCouponsList(!showCouponsList)}
                            className="text-[11px] text-[#083028] font-bold hover:underline flex items-center gap-1"
                          >
                            <span>🏷️ View available offers ({availableCoupons.length})</span>
                          </button>

                          {showCouponsList && (
                            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto pr-1">
                              {availableCoupons.map((coupon) => (
                                <div
                                  key={coupon.id}
                                  className="border border-dashed border-[#083028]/30 rounded-lg p-2 bg-[#FAF8F3] flex items-center justify-between text-xs"
                                >
                                  <div>
                                    <span className="font-mono font-bold text-[#083028] text-xs">
                                      {coupon.code}
                                    </span>
                                    <p className="text-[10px] text-gray-500 line-clamp-1">
                                      {coupon.title}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => handleApplyCoupon(coupon.code)}
                                    className="text-[10px] bg-[#083028] text-white font-bold px-2 py-1 rounded hover:bg-[#051e19]"
                                  >
                                    Apply
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Checkout CTA Button */}
                <button
                  onClick={handleCheckout}
                  className="w-full mt-5 bg-[#083028] hover:bg-[#051e19] text-white py-3.5 rounded-xl font-bold text-sm transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <Lock size={15} />
                  <span>Proceed to Checkout</span>
                  <ArrowRight size={16} />
                </button>

                {/* Trust Badges */}
                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-center text-[10px] text-gray-500">
                  <div className="flex flex-col items-center">
                    <Truck size={14} className="text-[#083028] mb-0.5" />
                    <span>Free Shipping</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <RotateCcw size={14} className="text-[#083028] mb-0.5" />
                    <span>7 Days Return</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <ShieldCheck size={14} className="text-[#083028] mb-0.5" />
                    <span>100% Secure</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>




      <Footer />
    </div>
  );
}
