// Centralized admin data store with Supabase sync and localStorage fallback
import { supabase } from '@/lib/supabase';

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  image: string;
  label: string;
  active: boolean;
  order: number;
}

export interface Product {
  id: string;
  name: string;
  price: string;
  numericPrice?: number;
  category?: string;
  image: string;
  stock?: number;
  active: boolean;
  isNewArrival?: boolean; // Direct flag for New Arrivals
  isBestSeller?: boolean; // Direct flag for Best Sellers
  order: number;
}

export interface Testimonial {
  id: string;
  name: string;
  location: string;
  rating: number;
  text: string;
  active: boolean;
}

// ─── Default Data (Unified Canonical Source) ──────────────────────────────────

export const defaultHeroSlides: HeroSlide[] = [
  { id: '1', title: 'Tradition In\nEvery Thread', subtitle: 'Elegant Styles • Premium Fabrics • For Every You', buttonText: 'Shop Now Collection', buttonLink: '/category', image: '/home-images/hero-image1.jpg', label: 'Timeless Ethnic Wear', active: true, order: 1 },
  { id: '2', title: 'Discover Your\nPerfect Style', subtitle: 'Handcrafted with Love • Worn with Pride', buttonText: 'Explore Collection', buttonLink: '/category', image: '/home-images/hero-image2.jpg', label: 'Timeless Ethnic Wear', active: true, order: 2 },
  { id: '3', title: 'Celebrate\nEvery Moment', subtitle: 'Festive Collection • Wedding Special • Everyday Elegance', buttonText: 'View Collection', buttonLink: '/category', image: '/home-images/hero-image3.jpg', label: 'Timeless Ethnic Wear', active: true, order: 3 },
  { id: '4', title: 'Timeless\nElegance', subtitle: 'Classic Designs • Modern Touch • Unmatched Quality', buttonText: 'Shop Collection', buttonLink: '/category', image: '/home-images/hero-image4.jpg', label: 'Timeless Ethnic Wear', active: true, order: 4 },
  { id: '5', title: 'Festive\nSplendor', subtitle: 'Celebrate in Style • Traditional Craftsmanship • Premium Quality', buttonText: 'Explore Now', buttonLink: '/category', image: '/home-images/hero-image5.jpg', label: 'Timeless Ethnic Wear', active: true, order: 5 },
  { id: '6', title: 'Wedding\nSpecial', subtitle: 'Bridal Collection • Exquisite Designs • Perfect Fit', buttonText: 'View Collection', buttonLink: '/category', image: '/home-images/hero-image6.jpg', label: 'Timeless Ethnic Wear', active: true, order: 6 },
  { id: '7', title: 'Everyday\nGrace', subtitle: 'Comfort Meets Style • Daily Wear • Affordable Luxury', buttonText: 'Shop Now', buttonLink: '/category', image: '/home-images/hero-image7.jpg', label: 'Timeless Ethnic Wear', active: true, order: 7 },
];

export const defaultUnifiedProducts: Product[] = [
  // New Arrivals
  { id: 'prod-1', name: 'Embroidered Saree', price: '₹1,299', numericPrice: 1299, category: 'Sarees', image: '/home-images/Embroidered Saree.jpg', stock: 25, active: true, isNewArrival: true, isBestSeller: false, order: 1 },
  { id: 'prod-2', name: 'Cotton Suit Set', price: '₹899', numericPrice: 899, category: 'Suits & Dress Material', image: '/home-images/Cotton Suit Set.jpg', stock: 40, active: true, isNewArrival: true, isBestSeller: false, order: 2 },
  { id: 'prod-3', name: 'Designer Dupatta Set', price: '₹1,499', numericPrice: 1499, category: 'Dupatta Sets', image: '/home-images/Designer Dupatta Set.jpg', stock: 18, active: true, isNewArrival: true, isBestSeller: true, order: 3 },
  { id: 'prod-4', name: 'Anarkali Suit', price: '₹999', numericPrice: 999, category: 'Suits & Dress Material', image: '/home-images/Anarkali Suit.jpg', stock: 32, active: true, isNewArrival: true, isBestSeller: false, order: 4 },
  { id: 'prod-5', name: 'Party Wear Saree', price: '₹1,799', numericPrice: 1799, category: 'Sarees', image: '/home-images/Party Wear Saree.jpg', stock: 15, active: true, isNewArrival: true, isBestSeller: false, order: 5 },

  // Best Sellers
  { id: 'prod-6', name: 'Silk Blend Saree', price: '₹1,499', numericPrice: 1499, category: 'Sarees', image: '/home-images/Silk Blend Saree.jpg', stock: 28, active: true, isNewArrival: false, isBestSeller: true, order: 6 },
  { id: 'prod-7', name: 'Rayon Kurti Set', price: '₹799', numericPrice: 799, category: 'Suits & Dress Material', image: '/home-images/Rayon Kurti Set.jpg', stock: 35, active: true, isNewArrival: false, isBestSeller: true, order: 7 },
  { id: 'prod-8', name: 'Designer Dupatta Set (Royal)', price: '₹1,299', numericPrice: 1299, category: 'Dupatta Sets', image: '/home-images/Designer Dupatta Set2.jpg', stock: 20, active: true, isNewArrival: false, isBestSeller: true, order: 8 },
  { id: 'prod-9', name: "Men's Kurta Set", price: '₹1,009', numericPrice: 1009, category: 'Men Fashion', image: '/home-images/Men Fashion.jpg', stock: 22, active: true, isNewArrival: false, isBestSeller: true, order: 9 },
  { id: 'prod-10', name: 'Kids Ethnic Wear', price: '₹993', numericPrice: 993, category: 'Kids Fashion', image: '/home-images/kids Ethnic Wear.jpg', stock: 30, active: true, isNewArrival: false, isBestSeller: true, order: 10 },
];

export const defaultNewArrivals: Product[] = defaultUnifiedProducts.filter(p => p.isNewArrival);
export const defaultBestSellers: Product[] = defaultUnifiedProducts.filter(p => p.isBestSeller);

export const defaultTestimonials: Testimonial[] = [
  { id: '1', name: 'Ayesha Khan', location: 'Prayagraj', rating: 5, text: 'Amazing collection of sarees and suits. Good quality and fast delivery. Highly recommended!', active: true },
  { id: '2', name: 'Mohd. Sameer', location: 'Prayagraj', rating: 5, text: 'Loved the variety of dress materials. The affordable fabric quality is excellent.', active: true },
  { id: '3', name: 'Nisha Singh', location: 'Prayagraj', rating: 5, text: 'Best place for ethnic wear. Beautiful designs and great customer service.', active: true },
];

// ─── Storage Helpers ───────────────────────────────────────────────────────────

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

// ─── Unified Admin Data Store API ──────────────────────────────────────────────

export const adminData = {
  // Hero Slides
  getHeroSlides: (): HeroSlide[] => getItem('admin_hero_slides', defaultHeroSlides),
  setHeroSlides: (slides: HeroSlide[]) => setItem('admin_hero_slides', slides),

  // Unified Products Catalog (Single Source of Truth)
  getProducts: (): Product[] => getItem('admin_products', defaultUnifiedProducts),
  setProducts: (products: Product[]) => setItem('admin_products', products),

  // Derived: New Arrivals (filter directly from unified products)
  getNewArrivals: (): Product[] => {
    return adminData
      .getProducts()
      .filter((p) => p.isNewArrival)
      .sort((a, b) => a.order - b.order);
  },
  setNewArrivals: (newArrivals: Product[]) => {
    const all = adminData.getProducts();
    // Update order or properties of newArrivals
    const updated = all.map((p) => {
      const match = newArrivals.find((na) => na.id === p.id);
      return match ? { ...p, ...match, isNewArrival: true } : p;
    });
    adminData.setProducts(updated);
  },

  // Derived: Best Sellers (filter directly from unified products)
  getBestSellers: (): Product[] => {
    return adminData
      .getProducts()
      .filter((p) => p.isBestSeller)
      .sort((a, b) => a.order - b.order);
  },
  setBestSellers: (bestSellers: Product[]) => {
    const all = adminData.getProducts();
    const updated = all.map((p) => {
      const match = bestSellers.find((bs) => bs.id === p.id);
      return match ? { ...p, ...match, isBestSeller: true } : p;
    });
    adminData.setProducts(updated);
  },

  // Testimonials
  getTestimonials: (): Testimonial[] => getItem('admin_testimonials', defaultTestimonials),
  setTestimonials: (testimonials: Testimonial[]) => setItem('admin_testimonials', testimonials),
};

// ─── Supabase Remote Data Sync Helpers ────────────────────────────────────────

export const supabaseData = {
  async fetchProducts(): Promise<Product[] | null> {
    try {
      const { data, error } = await supabase.from('products').select('*').order('sort_order');
      if (error || !data) return null;
      return data.map((d) => ({
        id: d.id,
        name: d.name,
        price: d.price,
        numericPrice: d.numeric_price,
        category: d.category,
        image: d.image,
        stock: d.stock,
        active: d.active,
        isNewArrival: d.is_new_arrival,
        isBestSeller: d.is_best_seller,
        order: d.sort_order,
      }));
    } catch {
      return null;
    }
  },

  async fetchHeroSlides(): Promise<HeroSlide[] | null> {
    try {
      const { data, error } = await supabase.from('hero_slides').select('*').order('sort_order');
      if (error || !data) return null;
      return data.map((d) => ({
        id: d.id,
        title: d.title,
        subtitle: d.subtitle,
        buttonText: d.button_text,
        buttonLink: d.button_link,
        image: d.image,
        label: d.label,
        active: d.active,
        order: d.sort_order,
      }));
    } catch {
      return null;
    }
  },
};

// ─── Admin Auth ────────────────────────────────────────────────────────────────
export const ADMIN_CREDENTIALS = {
  email: 'admin@argarment.com',
  password: 'admin@123',
};

export const adminAuth = {
  login: (email: string, password: string): boolean => {
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('admin_logged_in', 'true');
        sessionStorage.setItem('admin_login_time', Date.now().toString());
      }
      return true;
    }
    return false;
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('admin_logged_in');
      sessionStorage.removeItem('admin_login_time');
    }
  },
  isLoggedIn: (): boolean => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('admin_logged_in') === 'true';
  },
};
