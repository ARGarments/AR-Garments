'use client';

import { useState } from 'react';
import { ShoppingCart, Heart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

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
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAdded(true);
    if (onAddToCart) onAddToCart(product);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  return (
    <div className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
      <Link href={`/product/${product.id}`} className="block flex-1">
        {/* Image area — fills edge-to-edge */}
        <div className="relative bg-[#EDE8DF] w-full" style={{ height: '260px' }}>
          {/* Wishlist Button */}
          <button
            onClick={handleWishlist}
            className="absolute top-2.5 right-2.5 z-10 w-8 h-8 bg-white/95 backdrop-blur-xs rounded-full flex items-center justify-center shadow-sm hover:bg-red-50 transition-colors"
            aria-label="Wishlist"
          >
            <Heart
              size={15}
              className={`transition-colors ${
                isWishlisted
                  ? 'fill-red-500 text-red-500'
                  : 'text-[#083028] hover:text-red-500'
              }`}
              strokeWidth={1.5}
            />
          </button>

          {/* Optional Badge */}
          {product.badge && (
            <span className="absolute top-2.5 left-2.5 z-10 bg-[#083028] text-white text-[11px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
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
        <div className="p-4">
          {product.category && (
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              {product.category}
            </p>
          )}
          <h3 className="font-bold text-gray-900 text-base leading-snug mb-2 line-clamp-2 group-hover:text-[#083028] transition-colors">
            {product.name}
          </h3>
          <p className="text-lg font-bold text-[#083028] mb-3">
            {product.price}
          </p>
        </div>
      </Link>

      <div className="px-4 pb-4">
        {/* Outlined Add to Cart button */}
        <button
          onClick={handleAddToCart}
          className={`w-full border border-gray-300 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            added
              ? 'bg-[#083028] text-white border-[#083028]'
              : 'bg-[#F5F1E8] hover:bg-[#083028] hover:text-white hover:border-[#083028] text-gray-700'
          }`}
        >
          <ShoppingCart size={14} strokeWidth={1.5} />
          {added ? 'Added to Cart ✓' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}
