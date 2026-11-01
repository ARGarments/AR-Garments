// ---------------------------------------------------------------------------
// PARTY MANAGEMENT & STOCK METER SYSTEM TYPES & IN-MEMORY STORE
// ---------------------------------------------------------------------------

export interface Party {
  id: string;
  name: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductPartyBatch {
  id: string;
  partyId: string | null; // null = Main Store
  partyName?: string;
  productId: string;
  productName: string;
  variantId?: string | null;
  sku?: string | null;
  inwardQuantity: number;
  availableQuantity: number;
  partyCostPrice: number;
  sellingPrice: number;
  batchNumber?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AllocationStatus =
  | 'allocated'
  | 'in_transit'
  | 'delivered_hold'
  | 'final_sold'
  | 'return_raised'
  | 'return_received'
  | 'cancelled';

export interface OrderItemPartyAllocation {
  id: string;
  orderId: string;
  orderItemId?: string | null;
  productId: string;
  productName?: string;
  partyId: string | null; // null = Main Store
  partyName?: string;
  batchId?: string | null;
  quantity: number;
  unitCostPrice: number;
  unitSellingPrice: number;
  status: AllocationStatus;
  deliveredAt?: string | null;
  returnWindowUntil?: string | null;
  finalSaleAt?: string | null;
  returnRaisedAt?: string | null;
  returnReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PartyStockMeterMetrics {
  partyId: string | null;
  partyName: string;
  totalInwardQuantity: number;
  totalInvestedAmount: number;
  finalSoldQuantity: number;
  inTransitQuantity: number; // pending delivery + 7-day return window hold
  availableStockQuantity: number;
  clearedCostValue: number;
  holdValue: number;
  remainingStockValue: number;
  salesProgressPercentage: number;
  totalRevenueGenerated: number;
  batchesCount: number;
  activeOrdersCount: number;
}

export interface MasterStoreOverviewMetrics {
  totalItemsInStore: number;
  finalSoldQuantity: number;
  inTransitQuantity: number;
  availableStockLeft: number;
  totalInventoryValuation: number;
  clearedCostValue: number;
  holdValue: number;
  stockValueLeft: number;
  salesProgressPercentage: number;
  mainStoreCount: number;
  partiesCount: number;
  parties: PartyStockMeterMetrics[];
}

export const SEED_PARTIES: Party[] = [
  {
    id: 'party-ramesh-01',
    name: 'Ramesh Ji',
    contactPerson: 'Ramesh Kumar',
    phone: '9876543210',
    email: 'ramesh@example.com',
    address: 'Civil Lines, Prayagraj, UP',
    notes: 'Premium Saree and Dress Material supplier',
    isActive: true,
    createdAt: '2026-10-01T10:00:00Z',
    updatedAt: '2026-10-01T10:00:00Z',
  },
  {
    id: 'party-amit-02',
    name: 'Amit Bhai',
    contactPerson: 'Amit Sharma',
    phone: '9876501234',
    email: 'amit@example.com',
    address: 'Ring Road Market, Surat, Gujarat',
    notes: 'Silk Sarees and Synthetic Fabric Wholesaler',
    isActive: true,
    createdAt: '2026-10-01T10:00:00Z',
    updatedAt: '2026-10-01T10:00:00Z',
  },
];
