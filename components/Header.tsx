'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, User, ShoppingBag, Menu, X, ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [categories, setCategories] = useState<NavCategory[]>(DEFAULT_CATEGORIES);

  const { user, logout } = useAuth();
  const { totalCount } = useCart();

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

          {/* Icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-700 hover:text-[#083028]"
              aria-label="Search Catalog"
              title="Search products (Ctrl+K)"
            >
              <Search size={21} />
            </button>

            {/* User Account — direct link, no dropdown */}
            {user ? (
              <div className="flex items-center gap-1.5">
                <Link
                  href="/account"
                  className="hidden md:inline-flex items-center gap-1.5 text-xs font-bold text-[#083028] bg-[#083028]/10 hover:bg-[#083028]/20 px-2.5 py-1 rounded-full max-w-[100px] truncate transition-colors"
                >
                  <User size={13} />
                  {user.name.split(' ')[0]}
                </Link>
                <Link
                  href="/account"
                  className="md:hidden p-2 rounded-full text-[#083028] hover:bg-[#083028]/10 transition-colors"
                  aria-label="My Account"
                >
                  <User size={21} />
                </Link>
                <button
                  onClick={() => logout()}
                  className="p-2 rounded-full text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                  aria-label="Sign Out"
                  title="Sign Out"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="p-2 rounded-full transition-colors text-gray-700 hover:text-[#083028] hover:bg-gray-100"
                aria-label="Sign In"
              >
                <User size={21} />
              </Link>
            )}

            {/* Shopping Bag Button linking to /cart */}
            <Link
              href="/cart"
              className="relative p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-700 hover:text-[#083028] flex items-center justify-center"
              aria-label={`Shopping Bag with ${totalCount} items`}
            >
              <ShoppingBag size={21} />
              {totalCount > 0 && (
                <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-[#083028] text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-in zoom-in-75 duration-200">
                  {totalCount > 99 ? '99+' : totalCount}
                </span>
              )}
            </Link>

            <button
              className="lg:hidden p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="lg:hidden mt-3 pb-3 border-t pt-3">
            {/* Mobile Search Trigger */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setSearchModalOpen(true);
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500 hover:text-[#083028] hover:border-[#083028]/30 transition mb-3"
            >
              <Search size={16} className="text-[#083028]" />
              <span>Search sarees, suits, fabrics...</span>
            </button>

            <div className="flex flex-col gap-2">
              <Link
                href="/"
                className="text-gray-800 hover:text-[#083028] transition-colors font-semibold py-2 text-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>

              {/* Mobile Category Dropdown */}
              <div>
                <button
                  className="w-full text-left text-gray-800 hover:text-[#083028] transition-colors font-semibold py-2 text-lg flex items-center justify-between"
                  onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                >
                  <span>Category</span>
                  <ChevronDown
                    size={20}
                    className={`transition-transform duration-200 ${categoryDropdownOpen ? 'rotate-180 text-[#083028]' : ''}`}
                  />
                </button>
                {categoryDropdownOpen && (
                  <div className="pl-4 py-1 flex flex-col gap-1 border-l-2 border-[#083028]/20 my-1">
                    <Link
                      href="/category"
                      className="text-[#083028] font-bold py-2 text-sm"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      All Categories
                    </Link>
                    {categories.map((category) => (
                      <Link
                        key={category.name}
                        href={category.href}
                        className="text-gray-600 hover:text-[#083028] font-medium py-2 text-base"
                        onClick={() => {
                          setCategoryDropdownOpen(false);
                          setMobileMenuOpen(false);
                        }}
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link
                href="/about"
                className="text-gray-800 hover:text-[#083028] transition-colors font-semibold py-2 text-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                About Us
              </Link>

              <Link
                href="/contact"
                className="text-gray-800 hover:text-[#083028] transition-colors font-semibold py-2 text-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact Us
              </Link>

              {/* Mobile User & Cart Quick Links */}
              <div className="pt-3 mt-1 border-t border-gray-100 flex flex-col gap-2">
                <Link
                  href="/cart"
                  className="flex items-center justify-between text-[#083028] font-bold py-2 text-base bg-[#F5F1E8] px-3 rounded-xl"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="flex items-center gap-2">
                    <ShoppingBag size={18} /> My Cart
                  </span>
                  <span className="bg-[#083028] text-white text-xs px-2 py-0.5 rounded-full">
                    {totalCount}
                  </span>
                </Link>

                {user ? (
                  <div className="flex flex-col gap-2 pt-1">
                    <Link
                      href="/account"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 py-2 px-3 bg-[#F5F1E8] rounded-xl text-sm font-bold text-[#083028]"
                    >
                      <User size={15} /> {user.name} — My Account
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 w-fit"
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link
                      href="/login"
                      className="text-center font-bold text-sm bg-[#083028] text-white py-2 rounded-xl"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      className="text-center font-bold text-sm bg-white border border-[#083028] text-[#083028] py-2 rounded-xl"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </nav>
        )}
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
