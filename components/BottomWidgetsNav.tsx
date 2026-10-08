'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Home, LayoutGrid, ShoppingCart, ClipboardList } from 'lucide-react';
import { useCart } from '@/context/CartContext';

function BottomWidgetsNavInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { totalCount } = useCart();

  // Hide on admin, login, and signup routes
  if (
    pathname.startsWith('/admin') ||
    pathname === '/login' ||
    pathname === '/register'
  ) {
    return null;
  }

  const isHomeActive = pathname === '/';
  const isCategoriesActive = pathname.startsWith('/category');
  const isCartActive = pathname === '/cart';
  const isOrderActive =
    pathname === '/orders' ||
    (pathname === '/account' && searchParams.get('tab') === 'orders');

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      href: '/',
      icon: Home,
      isActive: isHomeActive,
      badge: undefined as number | undefined,
    },
    {
      id: 'categories',
      label: 'Categories',
      href: '/category',
      icon: LayoutGrid,
      isActive: isCategoriesActive,
      badge: undefined as number | undefined,
    },
    {
      id: 'kart',
      label: 'Kart',
      href: '/cart',
      icon: ShoppingCart,
      isActive: isCartActive,
      badge: totalCount,
    },
    {
      id: 'orders',
      label: 'My Order',
      href: '/account?tab=orders',
      icon: ClipboardList,
      isActive: isOrderActive,
      badge: undefined as number | undefined,
    },
  ];

  return (
    <>
      {/* Spacer so content isn't hidden behind the fixed bar on mobile */}
      <div className="h-[60px] lg:hidden" aria-hidden="true" />

      {/* Fixed Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_24px_rgba(0,0,0,0.07)] lg:hidden"
      >
        <div className="max-w-lg mx-auto flex items-center justify-around h-[60px]">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`relative flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors duration-200 ${
                  item.isActive
                    ? 'text-blue-600'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {/* Icon with badge */}
                <div className="relative">
                  <Icon
                    size={23}
                    strokeWidth={item.isActive ? 2.3 : 1.8}
                    className={
                      item.isActive && item.id === 'home'
                        ? 'text-blue-600 fill-blue-600/20'
                        : item.isActive
                        ? 'text-blue-600'
                        : 'text-gray-500'
                    }
                  />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-2 -right-3 min-w-[17px] h-[17px] px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white leading-none">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={`text-[10px] leading-none tracking-tight ${
                    item.isActive ? 'font-bold text-blue-600' : 'font-medium text-gray-600'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

export default function BottomWidgetsNav() {
  return (
    <Suspense fallback={null}>
      <BottomWidgetsNavInner />
    </Suspense>
  );
}
