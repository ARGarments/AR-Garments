'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, User, ShoppingBag, Menu, X, ChevronDown } from 'lucide-react';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  const categories = [
    { name: 'Sarees', href: '/category?category=Sarees' },
    { name: 'Suits & Dress Material', href: '/category?category=Suits+%26+Dress+Material' },
    { name: 'Dupatta Sets', href: '/category?category=Dupatta+Sets' },
    { name: 'Men Fashion', href: '/category?category=Men+Fashion' },
    { name: 'Kids Fashion', href: '/category?category=Kids+Fashion' },
  ];

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
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-700 hover:text-[#083028]" aria-label="Search">
              <Search size={21} />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-700 hover:text-[#083028]" aria-label="User Account">
              <User size={21} />
            </button>
            <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-700 hover:text-[#083028]" aria-label="Shopping Bag">
              <ShoppingBag size={21} />
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#083028] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                0
              </span>
            </button>
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
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
