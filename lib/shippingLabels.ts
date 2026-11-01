import fs from 'fs';
import path from 'path';
import { getServiceSupabase } from './supabase';
import { Order } from './orders';
import { generateBarcodeSvg } from './barcode';

export interface ShippingLabelRecord {
  id: string;
  orderId: string;
  labelType: 'local' | 'third_party';
  courierName: string;
  awbNumber?: string | null;
  handOffOption: 'hand_to_hand' | 'remote';
  labelData: Record<string, unknown>;
  labelUrl?: string | null;
  status: 'generated' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const LABELS_FILE = path.join(DATA_DIR, 'order_shipping_labels.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readLocalLabels(): ShippingLabelRecord[] {
  try {
    ensureDataDir();
    if (fs.existsSync(LABELS_FILE)) {
      const content = fs.readFileSync(LABELS_FILE, 'utf8');
      return JSON.parse(content) as ShippingLabelRecord[];
    }
  } catch {}
  return [];
}

function writeLocalLabels(labels: ShippingLabelRecord[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(LABELS_FILE, JSON.stringify(labels, null, 2), 'utf8');
  } catch {}
}

/**
 * Retrieves the most recent generated shipping label for a specific order.
 */
export async function getOrderShippingLabel(orderId: string): Promise<ShippingLabelRecord | null> {
  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('order_shipping_labels')
      .select('*')
      .eq('order_id', orderId)
      .eq('status', 'generated')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return {
        id: String(data.id),
        orderId: String(data.order_id),
        labelType: data.label_type as 'local' | 'third_party',
        courierName: String(data.courier_name),
        awbNumber: data.awb_number ? String(data.awb_number) : null,
        handOffOption: (data.hand_off_option as 'hand_to_hand' | 'remote') || 'hand_to_hand',
        labelData: typeof data.label_data === 'object' && data.label_data !== null ? (data.label_data as Record<string, unknown>) : {},
        labelUrl: data.label_url ? String(data.label_url) : null,
        status: data.status as 'generated' | 'cancelled',
        createdAt: String(data.created_at),
        updatedAt: String(data.updated_at),
      };
    }
  } catch {}

  const localList = readLocalLabels();
  return localList.find((l) => l.orderId === orderId && l.status === 'generated') || null;
}

/**
 * Generates and saves a Local Delivery Label (Hand-to-Hand / In-House Rider).
 */
export async function generateLocalDeliveryLabel(
  order: Order,
  options: { handOffOption?: 'hand_to_hand' | 'remote'; notes?: string }
): Promise<ShippingLabelRecord> {
  const handOff = options.handOffOption || 'hand_to_hand';
  const now = new Date().toISOString();
  const labelId = `local-lbl-${Date.now()}`;
  const barcodeSvg = generateBarcodeSvg(order.id, { height: 45, moduleWidth: 1.6 });

  const labelData = {
    businessName: 'AR Garments',
    businessPhone: '+91 96999 42332',
    businessAddress: 'Chowk, Prayagraj, UP - 211003',
    customerName: order.shippingAddress.fullName || order.userName,
    customerPhone: order.shippingAddress.phone || 'N/A',
    addressLine1: order.shippingAddress.addressLine1 || '',
    addressLine2: order.shippingAddress.addressLine2 || '',
    city: order.shippingAddress.city || 'Prayagraj',
    state: order.shippingAddress.state || 'Uttar Pradesh',
    pincode: order.shippingAddress.pincode || '211003',
    items: order.items.map((i) => ({
      name: i.name,
      quantity: i.quantity,
    })),
    paymentMethod: order.paymentMethod,
    codAmount: order.paymentMethod === 'cod' ? order.total : 0,
    isCod: order.paymentMethod === 'cod',
    handOffOption: handOff,
    barcodeSvg,
    notes: options.notes || null,
  };

  const newRecord: ShippingLabelRecord = {
    id: labelId,
    orderId: order.id,
    labelType: 'local',
    courierName: 'In-House Rider (Local)',
    awbNumber: `LOC-${order.id.slice(-6)}`,
    handOffOption: handOff,
    labelData,
    labelUrl: null,
    status: 'generated',
    createdAt: now,
    updatedAt: now,
  };

  try {
    const supabase = getServiceSupabase();
    await supabase.from('order_shipping_labels').insert({
      order_id: newRecord.orderId,
      label_type: newRecord.labelType,
      courier_name: newRecord.courierName,
      awb_number: newRecord.awbNumber,
      hand_off_option: newRecord.handOffOption,
      label_data: newRecord.labelData,
      status: newRecord.status,
    });
  } catch {}

  const localList = readLocalLabels();
  localList.unshift(newRecord);
  writeLocalLabels(localList);

  return newRecord;
}

/**
 * Generates and saves a 3rd-Party Carrier Label (Shiprocket / Delhivery API).
 */
export async function generateThirdPartyCarrierLabel(
  order: Order,
  options: {
    courierCode?: 'shiprocket' | 'delhivery';
    weightKg?: number;
    dimensions?: { length: number; width: number; height: number };
  }
): Promise<ShippingLabelRecord> {
  const courierCode = options.courierCode || 'shiprocket';
  const courierDisplayName = courierCode === 'delhivery' ? 'Delhivery Direct' : 'Shiprocket';
  const now = new Date().toISOString();

  // Check if order already has an assigned AWB or generate one for this shipment
  const awbNumber = order.awbNumber || `${courierCode.toUpperCase().slice(0, 3)}${Math.floor(1000000000 + Math.random() * 9000000000)}`;
  const barcodeSvg = generateBarcodeSvg(awbNumber, { height: 50, moduleWidth: 1.8 });

  const weightKg = options.weightKg || 0.8;
  const dimensions = options.dimensions || { length: 25, width: 18, height: 5 };

  const routingHub = `HUB-${(order.shippingAddress.city || 'DEL').slice(0, 3).toUpperCase()}-${order.shippingAddress.pincode?.slice(0, 3) || '110'}`;

  const labelData = {
    carrierName: courierDisplayName,
    carrierCode: courierCode,
    awbNumber,
    routingHub,
    scheduleCode: `1-HO-${Date.now().toString().slice(-6)}`,
    dimensionalMetadata: `${dimensions.length} x ${dimensions.width} x ${dimensions.height} cm | ${weightKg} kg`,
    customerName: order.shippingAddress.fullName || order.userName,
    customerPhone: order.shippingAddress.phone || 'N/A',
    shippingAddress: `${order.shippingAddress.addressLine1} ${order.shippingAddress.addressLine2 || ''}`.trim(),
    city: order.shippingAddress.city || '',
    state: order.shippingAddress.state || '',
    pincode: order.shippingAddress.pincode || '',
    codAmount: order.paymentMethod === 'cod' ? order.total : 0,
    isCod: order.paymentMethod === 'cod',
    itemsCount: order.items.reduce((acc, i) => acc + i.quantity, 0),
    items: order.items.map((i) => ({
      name: i.name,
      quantity: i.quantity,
    })),
    barcodeSvg,
  };

  const newRecord: ShippingLabelRecord = {
    id: `third-party-lbl-${Date.now()}`,
    orderId: order.id,
    labelType: 'third_party',
    courierName: courierDisplayName,
    awbNumber,
    handOffOption: 'remote',
    labelData,
    labelUrl: null,
    status: 'generated',
    createdAt: now,
    updatedAt: now,
  };

  try {
    const supabase = getServiceSupabase();
    await supabase.from('order_shipping_labels').insert({
      order_id: newRecord.orderId,
      label_type: newRecord.labelType,
      courier_name: newRecord.courierName,
      awb_number: newRecord.awbNumber,
      hand_off_option: newRecord.handOffOption,
      label_data: newRecord.labelData,
      status: newRecord.status,
    });

    // Also update order with AWB and courier name if not already set
    await supabase
      .from('orders')
      .update({
        courier_name: courierDisplayName,
        awb_number: awbNumber,
        dispatch_status: 'booked',
        dispatch_type: 'external',
      })
      .eq('id', order.id);
  } catch {}

  const localList = readLocalLabels();
  localList.unshift(newRecord);
  writeLocalLabels(localList);

  return newRecord;
}
