'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, CreditCard } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Product } from '@/lib/adminData';
import { useCart } from '@/context/CartContext';

export default function NewArrivals() {
  const [products, setProducts] = useState<Product[]>([]);
  const [addedIds, setAddedIds] = useState<{ [id: string]: boolean }>({});
  const router = useRouter();
  const { addToCart } = useCart();

  useEffect(() => {
    fetch('/api/products?is_new_arrival=true')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!Array.isArray(data)) return;
        const mapped: Product[] = data.map((d: Record<string, unknown>) => ({
          id: d.id as string,
          name: d.name as string,
          price: d.price as string,
          image: d.image as string,
          active: d.active as boolean,
          isNewArrival: d.is_new_arrival as boolean,
          isBestSeller: d.is_best_seller as boolean,
          order: d.sort_order as number,
        }));
        setProducts(mapped.filter((p) => p.active));
      })
      .catch(() => {
        setProducts([]);
      });
  }, []);

  const activeProducts = products.filter((p) => p.active);
  if (activeProducts.length === 0) return null;

  return (
    <section className="py-10 bg-white">
      <div className="container mx-auto px-4 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="flex justify-between items-center mb-5 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">New Arrivals</h2>
            <p className="text-xs sm:text-sm text-gray-400 hidden md:block">Fresh Styles Handpicked for You</p>
          </div>
          <Link
            href="/category"
            className="text-xs sm:text-sm font-semibold text-white bg-[#083028] hover:bg-[#051e19] px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-colors flex-shrink-0"
          >
            View All →
          </Link>
        </div>

        {/* Product Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {activeProducts.map((product) => (
            <div
              key={product.id}
              className="group bg-white border border-gray-200 rounded-xl sm:rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
            >
              {/* Image area */}
              <Link href={`/product/${product.id}`} className="block">
                <div className="relative bg-[#EDE8DF] h-[170px] sm:h-[200px] md:h-[220px]">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  />
                </div>
              </Link>
              {/* Info */}
              <div className="p-2.5 sm:p-4 flex flex-col justify-between flex-1">
                <div>
                  <Link href={`/product/${product.id}`} className="block">
                    <h3 className="font-bold text-gray-900 text-xs sm:text-sm md:text-base leading-snug mb-1 line-clamp-2 hover:text-[#083028] transition-colors">{product.name}</h3>
                  </Link>
                  <p className="text-xs sm:text-sm md:text-base font-bold text-[#083028] mb-2 sm:mb-3">{product.price}</p>
                </div>
                {/* Action buttons */}
                <div className="flex flex-col gap-1.5 sm:gap-2">
                  <button
                    onClick={() => {
                      addToCart(product, 1);
                      setAddedIds((prev) => ({ ...prev, [product.id]: true }));
                      setTimeout(() => {
                        setAddedIds((prev) => ({ ...prev, [product.id]: false }));
                      }, 1500);
                    }}
                    className={`w-full border py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs md:text-sm font-medium transition-all duration-200 flex items-center justify-center gap-1.5 ${
                      addedIds[product.id]
                        ? 'bg-[#083028] text-white border-[#083028]'
                        : 'border-gray-300 bg-[#F5F1E8] hover:bg-[#083028] hover:text-white hover:border-[#083028] text-gray-700'
                    }`}
                  >
                    <ShoppingCart size={13} strokeWidth={1.5} />
                    {addedIds[product.id] ? 'Added ✓' : 'Add to Cart'}
                  </button>
                  <button
                    onClick={() => {
                      addToCart(product, 1);
                      router.push('/cart');
                    }}
                    className="w-full bg-[#083028] hover:bg-[#051e19] text-white py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs md:text-sm font-medium transition-all duration-200 flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <CreditCard size={13} strokeWidth={1.5} />
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
