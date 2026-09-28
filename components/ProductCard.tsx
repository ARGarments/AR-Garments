'use client';

import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

export interface Product {
  id: number | string;
  name: string;
  price: string;
  numericPrice?: number;
  category?: string;
  image: string;
  images?: string[];
  description?: string;
  badge?: string;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAdded(true);
    addToCart(product, 1);
    if (onAddToCart) onAddToCart(product);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="group bg-white border border-gray-200 rounded-xl sm:rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
      <Link href={`/product/${product.id}`} className="block flex-1">
        {/* Image area */}
        <div className="relative bg-[#EDE8DF] w-full h-[180px] sm:h-[220px] md:h-[260px]">
          {/* Optional Badge */}
          {product.badge && (
            <span className="absolute top-2.5 left-2.5 z-10 bg-[#083028] text-white text-[10px] sm:text-[11px] font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md uppercase tracking-wider">
              {product.badge}
            </span>
          )}

          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        </div>

        {/* Content area */}
        <div className="p-2.5 sm:p-4">
          {product.category && (
            <p className="text-[10px] sm:text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5 sm:mb-1">
              {product.category}
            </p>
          )}
          <h3 className="font-bold text-gray-900 text-xs sm:text-sm md:text-base leading-snug mb-1 sm:mb-2 line-clamp-2 group-hover:text-[#083028] transition-colors">
            {product.name}
          </h3>
          <p className="text-xs sm:text-sm md:text-base font-bold text-[#083028] mb-1 sm:mb-2">
            {product.price}
          </p>
        </div>
      </Link>

      <div className="px-2.5 pb-2.5 sm:px-4 sm:pb-4">
        {/* Outlined Add to Cart button */}
        <button
          onClick={handleAddToCart}
          className={`w-full border border-gray-300 py-1.5 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center justify-center gap-1.5 ${
            added
              ? 'bg-[#083028] text-white border-[#083028]'
              : 'bg-[#F5F1E8] hover:bg-[#083028] hover:text-white hover:border-[#083028] text-gray-700'
          }`}
        >
          <ShoppingCart size={13} strokeWidth={1.5} />
          {added ? 'Added to Cart ✓' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}
