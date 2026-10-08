'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, User, ShoppingBag, ChevronDown, Heart } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import SearchModal from '@/components/SearchModal';

interface NavCategory {
  name: string;
  href: string;
}

const DEFAULT_CATEGORIES: NavCategory[] = [
  { name: 'Sarees', href: '/category?category=Sarees' },
  { name: 'Suits & Dress Material', href: '/category?category=Suits+%26+Dress+Material' },
  { name: 'Dupatta Sets', href: '/category?category=Dupatta+Sets' },
  { name: 'Men Fashion', href: '/category?category=Men+Fashion' },
  { name: 'Kids Fashion', href: '/category?category=Kids+Fashion' },
];

export default function Header() {
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [categories, setCategories] = useState<NavCategory[]>(DEFAULT_CATEGORIES);

  const { user, logout } = useAuth();
  const { totalCount } = useCart();
  const { wishlistCount } = useWishlist();

  useEffect(() => {
    let isMounted = true;
    fetch('/api/categories?active=true')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0 && isMounted) {
          const mapped: NavCategory[] = data.map((c: { name: string }) => ({
            name: c.name,
            href: `/category?category=${encodeURIComponent(c.name)}`,
          }));
          setCategories(mapped);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  // Listen for Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      {/* Main Navigation */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center group py-0.5">
            <div className="relative h-10 sm:h-12 w-20 sm:w-24 flex-shrink-0">
              <Image
                src="/home-images/logo.png"
                alt="AR Garment"
                fill
                className="object-contain group-hover:scale-105 transition-transform"
                priority
              />
            </div>
          </Link>

          {/* Desktop Menu */}
          <nav className="hidden lg:flex items-center gap-9">
            <Link
              href="/"
              className="text-gray-700 hover:text-[#083028] transition-colors text-lg font-semibold tracking-wide py-2"
            >
              Home
            </Link>

            {/* Category Dropdown */}
            <div
              className="relative group"
              onMouseEnter={() => setCategoryDropdownOpen(true)}
              onMouseLeave={() => setCategoryDropdownOpen(false)}
            >
              <div className="flex items-center gap-1.5 cursor-pointer text-gray-700 hover:text-[#083028] transition-colors text-lg font-semibold tracking-wide py-2">
                <Link href="/category">Category</Link>
                <ChevronDown size={18} className="text-gray-500 group-hover:text-[#083028] transition-transform duration-200 group-hover:rotate-180" />
              </div>

              <div className="absolute top-full left-0 pt-2 w-64 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="bg-white rounded-xl shadow-xl border border-gray-100 py-2.5 overflow-hidden">
                  <Link
                    href="/category"
                    className="block px-5 py-2.5 text-sm font-bold text-[#083028] bg-gray-50 hover:bg-[#F5F1E8] border-b border-gray-100"
                  >
                    View All Categories →
                  </Link>
                  {categories.map((category) => (
                    <Link
                      key={category.name}
                      href={category.href}
                      className="block px-5 py-3 text-[15px] font-medium text-gray-700 hover:bg-[#F5F1E8] hover:text-[#083028] hover:pl-6 transition-all duration-150"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <Link
              href="/about"
              className="text-gray-700 hover:text-[#083028] transition-colors text-lg font-semibold tracking-wide py-2"
            >
              About Us
            </Link>

            <Link
              href="/contact"
              className="text-gray-700 hover:text-[#083028] transition-colors text-lg font-semibold tracking-wide py-2"
            >
              Contact Us
            </Link>
          </nav>

          {/* Right items: About Us, Contact Us, Search, Wishlist, Account, Cart */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Mobile About Us & Contact Us links (on desktop they appear in main nav) */}


            {/* Search Button */}
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-gray-200/80 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-700 hover:text-[#083028] transition-colors shadow-xs flex-shrink-0"
              aria-label="Search Catalog"
              title="Search products (Ctrl+K)"
            >
              <Search size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>

            {/* Wishlist Button with live counter badge */}
            <Link
              href="/wishlist"
              className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-gray-200/80 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-700 hover:text-rose-600 transition-colors shadow-xs flex-shrink-0"
              aria-label={`Wishlist with ${wishlistCount} items`}
              title="My Wishlist"
            >
              <Heart size={16} className={`sm:w-[18px] sm:h-[18px] ${wishlistCount > 0 ? 'text-rose-600 fill-rose-50' : ''}`} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] sm:min-w-[17px] sm:h-[17px] px-1 bg-rose-600 text-white text-[9px] sm:text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-in zoom-in-75 duration-200">
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </span>
              )}
            </Link>

            {/* User Account Button */}
            <Link
              href={user ? '/account' : '/login'}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-gray-200/80 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-700 hover:text-[#083028] transition-colors shadow-xs flex-shrink-0"
              aria-label={user ? `Account: ${user.name}` : 'Sign In'}
              title={user ? `My Account (${user.name})` : 'Sign In'}
            >
              <User size={16} className="sm:w-[18px] sm:h-[18px]" />
            </Link>

            {/* Shopping Bag Button (Desktop only, mobile has bottom widget) */}
            <Link
              href="/cart"
              className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-gray-200/80 bg-white hover:bg-gray-50 hidden lg:flex items-center justify-center text-gray-700 hover:text-[#083028] transition-colors shadow-xs flex-shrink-0"
              aria-label={`Shopping Bag with ${totalCount} items`}
              title="Shopping Bag"
            >
              <ShoppingBag size={18} />
              {totalCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 bg-[#083028] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-in zoom-in-75 duration-200">
                  {totalCount > 99 ? '99+' : totalCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Interactive Live Search Modal */}
      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        categories={categories}
      />
    </header>
  );
}
