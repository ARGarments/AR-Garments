// ---------------------------------------------------------------------------
// AR GARMENT: Orders Types & In-Memory Store
// ---------------------------------------------------------------------------

export interface OrderItem {
  id: string;
  name: string;
  price: string | number;
  numericPrice?: number;
  image?: string;
  quantity: number;
  category?: string;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
}

export type OrderStatus =
  | 'Pending'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: 'cod' | 'online';
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  couponCode?: string;
  status: OrderStatus;
  createdAt: string;
}

// In-memory store (empty by default - only live DB/runtime data is stored)
export const memoryOrders: Order[] = [];
