import fs from 'fs';
import path from 'path';
import { getServiceSupabase } from './supabase';
import {
  Party,
  ProductPartyBatch,
  OrderItemPartyAllocation,
  PartyStockMeterMetrics,
  MasterStoreOverviewMetrics,
  SEED_PARTIES,
} from './parties';

const DATA_DIR = path.join(process.cwd(), 'data');
const PARTIES_FILE = path.join(DATA_DIR, 'parties.json');
const BATCHES_FILE = path.join(DATA_DIR, 'product_party_batches.json');
const ALLOCATIONS_FILE = path.join(DATA_DIR, 'order_item_party_allocations.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    ensureDataDir();
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content) as T;
    }
  } catch (e) {
    console.error(`Error reading ${filePath}:`, e);
  }
  return fallback;
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    ensureDataDir();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error(`Error writing ${filePath}:`, e);
  }
}

// ---------------------------------------------------------------------------
// 1. PARTIES SERVICE
// ---------------------------------------------------------------------------

export async function getParties(includeInactive = true): Promise<Party[]> {
  try {
    const supabase = getServiceSupabase();
    let query = supabase.from('parties').select('*').order('created_at', { ascending: false });
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }
    const { data, error } = await query;
    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map((r) => ({
        id: String(r.id),
        name: String(r.name),
        contactPerson: r.contact_person ? String(r.contact_person) : null,
        phone: r.phone ? String(r.phone) : null,
        email: r.email ? String(r.email) : null,
        address: r.address ? String(r.address) : null,
        notes: r.notes ? String(r.notes) : null,
        isActive: Boolean(r.is_active),
        createdAt: String(r.created_at),
        updatedAt: String(r.updated_at),
      }));
    }
  } catch {}

  // Local fallback
  const fileParties = readJsonFile<Party[]>(PARTIES_FILE, SEED_PARTIES);
  if (!fs.existsSync(PARTIES_FILE)) {
    writeJsonFile(PARTIES_FILE, SEED_PARTIES);
  }
  return includeInactive ? fileParties : fileParties.filter((p) => p.isActive);
}

export async function getPartyById(id: string): Promise<Party | null> {
  const all = await getParties(true);
  return all.find((p) => p.id === id) || null;
}

export async function createParty(partyData: Partial<Party>): Promise<Party> {
  const newParty: Party = {
    id: `party-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: partyData.name?.trim() || 'New Party',
    contactPerson: partyData.contactPerson?.trim() || null,
    phone: partyData.phone?.trim() || null,
    email: partyData.email?.trim() || null,
    address: partyData.address?.trim() || null,
    notes: partyData.notes?.trim() || null,
    isActive: partyData.isActive !== undefined ? Boolean(partyData.isActive) : true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('parties')
      .insert({
        name: newParty.name,
        contact_person: newParty.contactPerson,
        phone: newParty.phone,
        email: newParty.email,
        address: newParty.address,
        notes: newParty.notes,
        is_active: newParty.isActive,
      })
      .select('*')
      .single();

    if (!error && data) {
      newParty.id = String(data.id);
    }
  } catch {}

  // Save to local file
  const localList = readJsonFile<Party[]>(PARTIES_FILE, SEED_PARTIES);
  localList.unshift(newParty);
  writeJsonFile(PARTIES_FILE, localList);

  return newParty;
}

export async function updateParty(id: string, updates: Partial<Party>): Promise<Party | null> {
  const now = new Date().toISOString();
  let updatedParty: Party | null = null;

  try {
    const supabase = getServiceSupabase();
    const patchObj: Record<string, unknown> = { updated_at: now };
    if (updates.name !== undefined) patchObj.name = updates.name.trim();
    if (updates.contactPerson !== undefined) patchObj.contact_person = updates.contactPerson?.trim() || null;
    if (updates.phone !== undefined) patchObj.phone = updates.phone?.trim() || null;
    if (updates.email !== undefined) patchObj.email = updates.email?.trim() || null;
    if (updates.address !== undefined) patchObj.address = updates.address?.trim() || null;
    if (updates.notes !== undefined) patchObj.notes = updates.notes?.trim() || null;
    if (updates.isActive !== undefined) patchObj.is_active = Boolean(updates.isActive);

    const { data, error } = await supabase
      .from('parties')
      .update(patchObj)
      .eq('id', id)
      .select('*')
      .single();

    if (!error && data) {
      updatedParty = {
        id: String(data.id),
        name: String(data.name),
        contactPerson: data.contact_person ? String(data.contact_person) : null,
        phone: data.phone ? String(data.phone) : null,
        email: data.email ? String(data.email) : null,
        address: data.address ? String(data.address) : null,
        notes: data.notes ? String(data.notes) : null,
        isActive: Boolean(data.is_active),
        createdAt: String(data.created_at),
        updatedAt: String(data.updated_at),
      };
    }
  } catch {}

  // Update in local file
  const localList = readJsonFile<Party[]>(PARTIES_FILE, SEED_PARTIES);
  const idx = localList.findIndex((p) => p.id === id);
  if (idx !== -1) {
    localList[idx] = {
      ...localList[idx],
      ...updates,
      updatedAt: now,
    };
    writeJsonFile(PARTIES_FILE, localList);
    if (!updatedParty) updatedParty = localList[idx];
  }

  return updatedParty;
}

// ---------------------------------------------------------------------------
// 2. PRODUCT PARTY BATCHES SERVICE
// ---------------------------------------------------------------------------

export async function getPartyBatches(partyId?: string | null): Promise<ProductPartyBatch[]> {
  try {
    const supabase = getServiceSupabase();
    let query = supabase.from('product_party_batches').select('*').order('created_at', { ascending: false });
    if (partyId !== undefined) {
      if (partyId === null) {
        query = query.is('party_id', null);
      } else {
        query = query.eq('party_id', partyId);
      }
    }
    const { data, error } = await query;
    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map((r) => ({
        id: String(r.id),
        partyId: r.party_id ? String(r.party_id) : null,
        productId: String(r.product_id),
        productName: String(r.product_name || 'Item'),
        variantId: r.variant_id ? String(r.variant_id) : null,
        sku: r.sku ? String(r.sku) : null,
        inwardQuantity: Number(r.inward_quantity) || 0,
        availableQuantity: Number(r.available_quantity) || 0,
        partyCostPrice: Number(r.party_cost_price) || 0,
        sellingPrice: Number(r.selling_price) || 0,
        batchNumber: r.batch_number ? String(r.batch_number) : null,
        notes: r.notes ? String(r.notes) : null,
        createdAt: String(r.created_at),
        updatedAt: String(r.updated_at),
      }));
    }
  } catch {}

  const localList = readJsonFile<ProductPartyBatch[]>(BATCHES_FILE, []);
  if (partyId !== undefined) {
    return localList.filter((b) => b.partyId === partyId);
  }
  return localList;
}

export async function createPartyBatch(batchData: Partial<ProductPartyBatch>): Promise<ProductPartyBatch> {
  const newBatch: ProductPartyBatch = {
    id: `batch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    partyId: batchData.partyId || null,
    partyName: batchData.partyName || (batchData.partyId ? undefined : 'Main Store'),
    productId: String(batchData.productId || ''),
    productName: batchData.productName || 'Product',
    variantId: batchData.variantId || null,
    sku: batchData.sku || null,
    inwardQuantity: Number(batchData.inwardQuantity) || 0,
    availableQuantity: Number(batchData.availableQuantity ?? batchData.inwardQuantity) || 0,
    partyCostPrice: Number(batchData.partyCostPrice) || 0,
    sellingPrice: Number(batchData.sellingPrice) || 0,
    batchNumber: batchData.batchNumber || `BATCH-${Date.now().toString().slice(-6)}`,
    notes: batchData.notes || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('product_party_batches')
      .insert({
        party_id: newBatch.partyId,
        product_id: newBatch.productId,
        product_name: newBatch.productName,
        variant_id: newBatch.variantId,
        sku: newBatch.sku,
        inward_quantity: newBatch.inwardQuantity,
        available_quantity: newBatch.availableQuantity,
        party_cost_price: newBatch.partyCostPrice,
        selling_price: newBatch.sellingPrice,
        batch_number: newBatch.batchNumber,
        notes: newBatch.notes,
      })
      .select('*')
      .single();

    if (!error && data) {
      newBatch.id = String(data.id);
    }
  } catch {}

  const localList = readJsonFile<ProductPartyBatch[]>(BATCHES_FILE, []);
  localList.unshift(newBatch);
  writeJsonFile(BATCHES_FILE, localList);

  return newBatch;
}

// ---------------------------------------------------------------------------
// 3. ORDER ITEM PARTY ALLOCATIONS SERVICE
// ---------------------------------------------------------------------------

export async function getAllocations(): Promise<OrderItemPartyAllocation[]> {
  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('order_item_party_allocations')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map((r) => ({
        id: String(r.id),
        orderId: String(r.order_id),
        orderItemId: r.order_item_id ? String(r.order_item_id) : null,
        productId: String(r.product_id),
        productName: r.product_name ? String(r.product_name) : undefined,
        partyId: r.party_id ? String(r.party_id) : null,
        batchId: r.batch_id ? String(r.batch_id) : null,
        quantity: Number(r.quantity) || 1,
        unitCostPrice: Number(r.unit_cost_price) || 0,
        unitSellingPrice: Number(r.unit_selling_price) || 0,
        status: r.status as OrderItemPartyAllocation['status'],
        deliveredAt: r.delivered_at ? String(r.delivered_at) : null,
        returnWindowUntil: r.return_window_until ? String(r.return_window_until) : null,
        finalSaleAt: r.final_sale_at ? String(r.final_sale_at) : null,
        returnRaisedAt: r.return_raised_at ? String(r.return_raised_at) : null,
        returnReason: r.return_reason ? String(r.return_reason) : null,
        createdAt: String(r.created_at),
        updatedAt: String(r.updated_at),
      }));
    }
  } catch {}

  return readJsonFile<OrderItemPartyAllocation[]>(ALLOCATIONS_FILE, []);
}

export async function createAllocation(alloc: Partial<OrderItemPartyAllocation>): Promise<OrderItemPartyAllocation> {
  const newAlloc: OrderItemPartyAllocation = {
    id: `alloc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    orderId: String(alloc.orderId || ''),
    orderItemId: alloc.orderItemId || null,
    productId: String(alloc.productId || ''),
    productName: alloc.productName || 'Item',
    partyId: alloc.partyId || null,
    partyName: alloc.partyName,
    batchId: alloc.batchId || null,
    quantity: Number(alloc.quantity) || 1,
    unitCostPrice: Number(alloc.unitCostPrice) || 0,
    unitSellingPrice: Number(alloc.unitSellingPrice) || 0,
    status: alloc.status || 'allocated',
    deliveredAt: alloc.deliveredAt || null,
    returnWindowUntil: alloc.returnWindowUntil || null,
    finalSaleAt: alloc.finalSaleAt || null,
    returnRaisedAt: alloc.returnRaisedAt || null,
    returnReason: alloc.returnReason || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('order_item_party_allocations')
      .insert({
        order_id: newAlloc.orderId,
        order_item_id: newAlloc.orderItemId,
        product_id: newAlloc.productId,
        party_id: newAlloc.partyId,
        batch_id: newAlloc.batchId,
        quantity: newAlloc.quantity,
        unit_cost_price: newAlloc.unitCostPrice,
        unit_selling_price: newAlloc.unitSellingPrice,
        status: newAlloc.status,
        delivered_at: newAlloc.deliveredAt,
        return_window_until: newAlloc.returnWindowUntil,
      })
      .select('*')
      .single();

    if (!error && data) {
      newAlloc.id = String(data.id);
    }
  } catch {}

  const localList = readJsonFile<OrderItemPartyAllocation[]>(ALLOCATIONS_FILE, []);
  localList.unshift(newAlloc);
  writeJsonFile(ALLOCATIONS_FILE, localList);

  return newAlloc;
}

// ---------------------------------------------------------------------------
// 4. 7-DAY RETURN WINDOW AUTOMATION ENGINE
// ---------------------------------------------------------------------------

/**
 * Runs 7-day return window progression:
 * - When an order was delivered, return_window_until = deliveredAt + 7 days.
 * - If now >= return_window_until AND status == 'delivered_hold', auto-progress to 'final_sold'.
 */
export async function processReturnWindowProgression(): Promise<{ finalizedCount: number }> {
  const now = new Date();
  const allAllocations = await getAllocations();
  let finalizedCount = 0;

  for (const alloc of allAllocations) {
    if (alloc.status === 'delivered_hold' && alloc.returnWindowUntil) {
      const windowEnd = new Date(alloc.returnWindowUntil);
      if (now >= windowEnd) {
        alloc.status = 'final_sold';
        alloc.finalSaleAt = now.toISOString();
        alloc.updatedAt = now.toISOString();
        finalizedCount++;

        // Update in Supabase
        try {
          const supabase = getServiceSupabase();
          await supabase
            .from('order_item_party_allocations')
            .update({
              status: 'final_sold',
              final_sale_at: alloc.finalSaleAt,
              updated_at: alloc.updatedAt,
            })
            .eq('id', alloc.id);
        } catch {}
      }
    }
  }

  if (finalizedCount > 0) {
    writeJsonFile(ALLOCATIONS_FILE, allAllocations);
  }

  return { finalizedCount };
}

// ---------------------------------------------------------------------------
// 5. STOCK METER & FINANCIAL CALCULATIONS ENGINE
// ---------------------------------------------------------------------------

export async function calculatePartyMetrics(
  partyId: string | null,
  dateRange?: { from?: string; to?: string }
): Promise<PartyStockMeterMetrics> {
  // First ensure 7-day windows are up to date
  await processReturnWindowProgression();

  const parties = await getParties(true);
  const party = partyId ? parties.find((p) => p.id === partyId) : null;
  const partyName = party ? party.name : 'Main Store (No Party)';

  const allBatches = await getPartyBatches(partyId);
  const allAllocations = (await getAllocations()).filter((a) => a.partyId === partyId);

  // Date filtering logic
  const filteredBatches = allBatches.filter((b) => {
    if (!dateRange) return true;
    const dt = new Date(b.createdAt);
    if (dateRange.from && dt < new Date(dateRange.from)) return false;
    if (dateRange.to && dt > new Date(dateRange.to)) return false;
    return true;
  });

  const filteredAllocations = allAllocations.filter((a) => {
    if (!dateRange) return true;
    const dt = new Date(a.finalSaleAt || a.deliveredAt || a.createdAt);
    if (dateRange.from && dt < new Date(dateRange.from)) return false;
    if (dateRange.to && dt > new Date(dateRange.to)) return false;
    return true;
  });

  // 1. Total Inward Quantity & Invested Value
  let totalInwardQuantity = 0;
  let totalInvestedAmount = 0;
  for (const b of filteredBatches) {
    totalInwardQuantity += b.inwardQuantity;
    totalInvestedAmount += b.inwardQuantity * b.partyCostPrice;
  }

  // 2. Final Sold Quantity & Cleared Cost Value
  let finalSoldQuantity = 0;
  let clearedCostValue = 0;
  let inTransitQuantity = 0;
  let holdValue = 0;
  let totalRevenueGenerated = 0;

  for (const a of filteredAllocations) {
    if (a.status === 'final_sold') {
      finalSoldQuantity += a.quantity;
      clearedCostValue += a.quantity * a.unitCostPrice;
      totalRevenueGenerated += a.quantity * a.unitSellingPrice;
    } else if (a.status === 'in_transit' || a.status === 'allocated' || a.status === 'delivered_hold') {
      inTransitQuantity += a.quantity;
      holdValue += a.quantity * a.unitCostPrice;
    }
  }

  // 3. Available Stock Quantity
  // Available = Total Inward - Final Sold - In-Transit/Trial/Hold
  const availableStockQuantity = Math.max(0, totalInwardQuantity - finalSoldQuantity - inTransitQuantity);

  // Remaining Stock Value = Available Stock Quantity × Average Unit Cost
  const avgCostPrice = totalInwardQuantity > 0 ? totalInvestedAmount / totalInwardQuantity : 0;
  const remainingStockValue = Math.round(availableStockQuantity * avgCostPrice);

  // 4. Sales Progress Percentage
  const salesProgressPercentage =
    totalInwardQuantity > 0 ? Math.min(100, Math.round((finalSoldQuantity / totalInwardQuantity) * 100)) : 0;

  return {
    partyId,
    partyName,
    totalInwardQuantity,
    totalInvestedAmount: Math.round(totalInvestedAmount),
    finalSoldQuantity,
    inTransitQuantity,
    availableStockQuantity,
    clearedCostValue: Math.round(clearedCostValue),
    holdValue: Math.round(holdValue),
    remainingStockValue,
    salesProgressPercentage,
    totalRevenueGenerated: Math.round(totalRevenueGenerated),
    batchesCount: filteredBatches.length,
    activeOrdersCount: filteredAllocations.filter((a) => a.status !== 'final_sold' && a.status !== 'cancelled').length,
  };
}

export async function calculateMasterOverview(
  dateRange?: { from?: string; to?: string }
): Promise<MasterStoreOverviewMetrics> {
  const parties = await getParties(true);

  // Calculate metrics for all parties + Main Store (null)
  const partyMetricsList: PartyStockMeterMetrics[] = [];
  for (const p of parties) {
    const m = await calculatePartyMetrics(p.id, dateRange);
    partyMetricsList.push(m);
  }

  // Also calculate Main Store (where partyId is null)
  const mainStoreMetrics = await calculatePartyMetrics(null, dateRange);
  partyMetricsList.unshift(mainStoreMetrics);

  let totalItemsInStore = 0;
  let finalSoldQuantity = 0;
  let inTransitQuantity = 0;
  let availableStockLeft = 0;
  let totalInventoryValuation = 0;
  let clearedCostValue = 0;
  let holdValue = 0;
  let stockValueLeft = 0;

  for (const m of partyMetricsList) {
    totalItemsInStore += m.totalInwardQuantity;
    finalSoldQuantity += m.finalSoldQuantity;
    inTransitQuantity += m.inTransitQuantity;
    availableStockLeft += m.availableStockQuantity;
    totalInventoryValuation += m.totalInvestedAmount;
    clearedCostValue += m.clearedCostValue;
    holdValue += m.holdValue;
    stockValueLeft += m.remainingStockValue;
  }

  const salesProgressPercentage =
    totalItemsInStore > 0 ? Math.min(100, Math.round((finalSoldQuantity / totalItemsInStore) * 100)) : 0;

  return {
    totalItemsInStore,
    finalSoldQuantity,
    inTransitQuantity,
    availableStockLeft,
    totalInventoryValuation,
    clearedCostValue,
    holdValue,
    stockValueLeft,
    salesProgressPercentage,
    mainStoreCount: mainStoreMetrics.totalInwardQuantity,
    partiesCount: parties.length,
    parties: partyMetricsList,
  };
}
