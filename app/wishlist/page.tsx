'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Heart,
  Trash2,
  ShoppingCart,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShoppingBag,
  Check,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';

export default function WishlistPage() {
  const { wishlist, wishlistCount, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [addedIds, setAddedIds] = useState<{ [id: string]: boolean }>({});

  const handleMoveToCart = (item: (typeof wishlist)[0]) => {
    addToCart(
      {
        id: item.id,
        name: item.name,
        price: item.price,
        numericPrice: item.numericPrice || parseInt(item.price.replace(/[^\d]/g, '') || '0', 10),
        image: item.image,
        category: item.category,
      },
      1
    );

    setAddedIds((prev) => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [item.id]: false }));
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] flex flex-col justify-between">
      <Header />

      <main className="flex-1 container mx-auto px-3 sm:px-6 lg:px-12 py-6 sm:py-10">
        {/* Breadcrumb & Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <Link href="/" className="hover:text-[#083028] transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-semibold">My Wishlist</span>
          </div>

          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
                <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-rose-600 fill-rose-50" />
                <span>My Wishlist</span>
                <span className="text-xs sm:text-sm font-semibold bg-rose-600 text-white px-2.5 py-0.5 rounded-full">
                  {wishlistCount} {wishlistCount === 1 ? 'item' : 'items'}
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Saved items you love. Add them to your bag anytime!
              </p>
            </div>

            {wishlist.length > 0 && (
              <button
                onClick={clearWishlist}
                className="text-xs sm:text-sm text-red-600 hover:text-red-700 font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 size={14} />
                <span>Clear Wishlist</span>
              </button>
            )}
          </div>
        </div>

        {/* Empty State */}
        {wishlist.length === 0 ? (
          <div className="bg-white rounded-2xl sm:rounded-3xl p-8 sm:p-16 text-center max-w-lg mx-auto shadow-sm border border-gray-100 my-8">
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
              <Heart size={38} strokeWidth={1.5} className="fill-rose-100 text-rose-500" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Your Wishlist is Empty
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mb-7 leading-relaxed">
              Explore our exquisite collection of sarees, suit sets, and dupattas. Tap the heart
              icon on any product to save it here!
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/category"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#083028] hover:bg-[#051e19] text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <span>Explore Catalog</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/cart"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
              >
                <ShoppingBag size={16} />
                <span>Go to Cart</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Wishlist Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {wishlist.map((item) => (
              <div
                key={item.id}
                className="group bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                {/* Image & Remove Icon */}
                <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
                  <Link href={`/product/${item.id}`} className="block w-full h-full">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  </Link>
                  <button
                    onClick={() => removeFromWishlist(item.id)}
                    className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-gray-500 hover:text-red-600 shadow-sm flex items-center justify-center transition-colors"
                    title="Remove from wishlist"
                    aria-label="Remove item"
                  >
                    <Trash2 size={15} />
                  </button>
                  {item.category && (
                    <span className="absolute bottom-2.5 left-2.5 text-[10px] font-bold uppercase tracking-wider bg-black/60 text-white px-2 py-0.5 rounded backdrop-blur-xs">
                      {item.category}
                    </span>
                  )}
                </div>

                {/* Details & Actions */}
                <div className="p-3 sm:p-4 flex flex-col justify-between flex-1">
                  <div>
                    <Link
                      href={`/product/${item.id}`}
                      className="font-bold text-xs sm:text-sm text-gray-900 line-clamp-2 hover:text-[#083028] transition-colors leading-snug"
                    >
                      {item.name}
                    </Link>
                    <div className="mt-1.5 flex items-baseline gap-2">
                      <span className="text-sm sm:text-base font-extrabold text-[#083028]">
                        {item.price}
                      </span>
                    </div>
                  </div>

                  {/* Move to bag button */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleMoveToCart(item)}
                      className={`w-full py-2 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                        addedIds[item.id]
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#083028] hover:bg-[#051e19] text-white'
                      }`}
                    >
                      {addedIds[item.id] ? (
                        <>
                          <Check size={14} />
                          <span>Added to Bag!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart size={14} />
                          <span>Move to Bag</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back Link */}
        <div className="mt-8 pt-4 border-t border-gray-200">
          <Link
            href="/category"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#083028] hover:underline"
          >
            <ArrowLeft size={16} />
            <span>Continue Shopping All Categories</span>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
