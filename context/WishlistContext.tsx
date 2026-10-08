'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from './ToastContext';

export interface WishlistItem {
  id: string | number;
  name: string;
  price: string;
  numericPrice?: number;
  image: string;
  category?: string;
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  wishlistCount: number;
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: string | number) => void;
  toggleWishlist: (item: WishlistItem) => void;
  isInWishlist: (id: string | number) => boolean;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const WISHLIST_STORAGE_KEY = 'ar_wishlist';

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const { toast } = useToast();

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setWishlist(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Save to localStorage whenever wishlist changes
  const persistWishlist = (items: WishlistItem[]) => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  };

  const isInWishlist = useCallback(
    (id: string | number) => {
      const targetId = String(id);
      return wishlist.some((item) => String(item.id) === targetId);
    },
    [wishlist]
  );

  const addToWishlist = useCallback(
    (item: WishlistItem) => {
      const targetId = String(item.id);
      setWishlist((prev) => {
        if (prev.some((p) => String(p.id) === targetId)) return prev;
        const next = [...prev, item];
        persistWishlist(next);
        return next;
      });
      toast.success(`"${item.name}" added to your wishlist! ❤️`, { title: 'Wishlist' });
    },
    [toast]
  );

  const removeFromWishlist = useCallback(
    (id: string | number) => {
      const targetId = String(id);
      setWishlist((prev) => {
        const item = prev.find((p) => String(p.id) === targetId);
        const next = prev.filter((p) => String(p.id) !== targetId);
        persistWishlist(next);
        if (item) {
          toast.info(`"${item.name}" removed from wishlist`, { title: 'Wishlist' });
        }
        return next;
      });
    },
    [toast]
  );

  const toggleWishlist = useCallback(
    (item: WishlistItem) => {
      if (isInWishlist(item.id)) {
        removeFromWishlist(item.id);
      } else {
        addToWishlist(item);
      }
    },
    [isInWishlist, addToWishlist, removeFromWishlist]
  );

  const clearWishlist = () => {
    setWishlist([]);
    try {
      localStorage.removeItem(WISHLIST_STORAGE_KEY);
    } catch {
      // ignore
    }
    toast.info('Wishlist has been cleared', { title: 'Wishlist' });
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistCount: wishlist.length,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isInWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
