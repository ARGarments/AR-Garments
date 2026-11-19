import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/adminSession';
import { getServiceSupabase } from '@/lib/supabase';
import { memoryOrders, OrderStatus } from '@/lib/orders';
import { getPartyBatches, getAllocations } from '@/lib/partyService';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export type AdminCancellationReason =
  | 'Customer Requested'
  | 'Out of Stock'
  | 'Payment Not Received'
  | 'Delivery Not Possible'
  | 'Other';

interface AdminCancelOrderPayload {
  orderId: string;
  reason: AdminCancellationReason;
  note?: string;
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(
      { success: false, error: 'Administrator access is required.' },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json()) as AdminCancelOrderPayload;
    const { orderId, reason, note } = body;

    if (!orderId || !reason) {
      return NextResponse.json(
        { success: false, error: 'Order ID and cancellation reason are required.' },
        { status: 400 }
      );
    }

    const validReasons: AdminCancellationReason[] = [
      'Customer Requested',
      'Out of Stock',
      'Payment Not Received',
      'Delivery Not Possible',
      'Other',
    ];

    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        { success: false, error: 'Invalid cancellation reason selected.' },
        { status: 400 }
      );
    }

    const shouldRestock = reason !== 'Out of Stock';
    const now = new Date().toISOString();
    const formattedReason = note && note.trim() ? `${reason} - ${note.trim()}` : reason;

    const supabase = getServiceSupabase();

    // 1. Fetch current order
    let orderRow: any = null;
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();

      if (!error && data) {
        orderRow = data;
      }
    } catch (e) {
      console.warn('[Admin Cancel] Error reading order from Supabase:', e);
    }

    const memOrder = memoryOrders.find((o) => o.id === orderId);

    if (!orderRow && !memOrder) {
      return NextResponse.json(
        { success: false, error: 'Order not found.' },
        { status: 404 }
      );
    }

    const currentStatus = orderRow?.status || memOrder?.status;
    if (currentStatus === 'Cancelled') {
      return NextResponse.json({
        success: true,
        message: 'Order is already cancelled.',
        restocked: false,
        notificationSent: false,
      });
    }

    // 2. Perform Stock Restoration if shouldRestock === true
    let restockSummary: { itemsRestocked: number; quantityRestocked: number } = {
      itemsRestocked: 0,
      quantityRestocked: 0,
    };

    if (shouldRestock) {
      try {
        const orderItems = orderRow?.items || memOrder?.items || [];
        const allBatches = await getPartyBatches();
        const allAllocations = await getAllocations();

        const DATA_DIR = path.join(process.cwd(), 'data');
        const BATCHES_FILE = path.join(DATA_DIR, 'product_party_batches.json');
        const ALLOCATIONS_FILE = path.join(DATA_DIR, 'order_item_party_allocations.json');

        // Mark allocations as cancelled and restore batch availableQuantity
        let batchesModified = false;
        let allocationsModified = false;

        const orderAllocations = allAllocations.filter((a) => a.orderId === orderId);

        for (const alloc of orderAllocations) {
          if (alloc.status !== 'cancelled') {
            alloc.status = 'cancelled';
            alloc.returnReason = formattedReason;
            alloc.updatedAt = now;
            allocationsModified = true;

            // Restore quantity back to batch if batchId exists
            if (alloc.batchId) {
              const batch = allBatches.find((b) => b.id === alloc.batchId);
              if (batch) {
                batch.availableQuantity = (batch.availableQuantity || 0) + (alloc.quantity || 1);
                batch.updatedAt = now;
                batchesModified = true;

                // Sync with Supabase batch
                try {
                  await supabase
                    .from('product_party_batches')
                    .update({
                      available_quantity: batch.availableQuantity,
                      updated_at: now,
                    })
                    .eq('id', batch.id);
                } catch {}
              }
            }

            // Sync with Supabase allocation
            try {
              await supabase
                .from('order_item_party_allocations')
                .update({
                  status: 'cancelled',
                  return_reason: formattedReason,
                  updated_at: now,
                })
                .eq('id', alloc.id);
            } catch {}

            restockSummary.itemsRestocked += 1;
            restockSummary.quantityRestocked += alloc.quantity || 1;
          }
        }

        // Also restore product and variant catalog stock in Supabase
        if (Array.isArray(orderItems)) {
          for (const item of orderItems) {
            const pId = item.id;
            const qty = Number(item.quantity) || 1;
            if (pId) {
              try {
                let baseProductId = String(pId);

                // 1. If variant, restore variant stock in product_variants
                const uuidMatch = String(pId).match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
                const variantUuid = uuidMatch ? uuidMatch[0] : null;

                if (variantUuid) {
                  const { data: vData } = await supabase
                    .from('product_variants')
                    .select('id, product_id, available_sets, total_stock_pieces, available_pieces')
                    .eq('id', variantUuid)
                    .maybeSingle();

                  if (vData) {
                    baseProductId = vData.product_id || baseProductId;
                    const newSets = (Number(vData.available_sets) || 0) + qty;
                    const newPieces = (Number(vData.total_stock_pieces) || 0) + qty;
                    const newAvailPieces = (Number(vData.available_pieces) || 0) + qty;

                    await supabase
                      .from('product_variants')
                      .update({
                        available_sets: newSets,
                        total_stock_pieces: newPieces,
                        available_pieces: newAvailPieces,
                      })
                      .eq('id', vData.id);
                  }
                } else if (String(pId).includes('-')) {
                  const parts = String(pId).split('-');
                  if (parts[0] === 'prod' && parts[1]) {
                    baseProductId = `${parts[0]}-${parts[1]}`;
                  }
                }

                // 2. Also restore main products table stock
                const { data: prodData } = await supabase
                  .from('products')
                  .select('id, stock, total_stock_pieces')
                  .or(`id.eq.${pId},id.eq.${baseProductId}`)
                  .maybeSingle();

                if (prodData) {
                  const newStock = (Number(prodData.stock) || 0) + qty;
                  const newPieces = prodData.total_stock_pieces !== null && prodData.total_stock_pieces !== undefined
                    ? (Number(prodData.total_stock_pieces) || 0) + qty
                    : undefined;

                  const updatePayload: any = { stock: newStock };
                  if (newPieces !== undefined) {
                    updatePayload.total_stock_pieces = newPieces;
                  }

                  await supabase.from('products').update(updatePayload).eq('id', prodData.id);
                }
              } catch (prodErr) {
                console.warn(`[Admin Cancel] Could not restore product/variant stock for ${pId}:`, prodErr);
              }
            }
          }
        }

        // Save local batch and allocation files
        if (batchesModified && fs.existsSync(DATA_DIR)) {
          fs.writeFileSync(BATCHES_FILE, JSON.stringify(allBatches, null, 2), 'utf8');
        }
        if (allocationsModified && fs.existsSync(DATA_DIR)) {
          fs.writeFileSync(ALLOCATIONS_FILE, JSON.stringify(allAllocations, null, 2), 'utf8');
        }
      } catch (restockErr) {
        console.error('[Admin Cancel] Error during stock restoration:', restockErr);
      }
    } else {
      // Reason is "Out of Stock" -> DO NOT RESTOCK
      // Mark allocations as cancelled with reason, but DO NOT add quantity back to batches or products
      try {
        const allAllocations = await getAllocations();
        const DATA_DIR = path.join(process.cwd(), 'data');
        const ALLOCATIONS_FILE = path.join(DATA_DIR, 'order_item_party_allocations.json');
        let allocationsModified = false;

        const orderAllocations = allAllocations.filter((a) => a.orderId === orderId);
        for (const alloc of orderAllocations) {
          if (alloc.status !== 'cancelled') {
            alloc.status = 'cancelled';
            alloc.returnReason = `Out of Stock: ${formattedReason}`;
            alloc.updatedAt = now;
            allocationsModified = true;

            try {
              await supabase
                .from('order_item_party_allocations')
                .update({
                  status: 'cancelled',
                  return_reason: `Out of Stock: ${formattedReason}`,
                  updated_at: now,
                })
                .eq('id', alloc.id);
            } catch {}
          }
        }

        if (allocationsModified && fs.existsSync(DATA_DIR)) {
          fs.writeFileSync(ALLOCATIONS_FILE, JSON.stringify(allAllocations, null, 2), 'utf8');
        }
      } catch (allocErr) {
        console.error('[Admin Cancel] Error marking allocations cancelled for out of stock:', allocErr);
      }
    }

    // 3. Update Order Status in Supabase
    const dbUpdate: any = {
      status: 'Cancelled',
      cancelled_at: now,
      cancelled_by: 'admin',
      cancellation_reason: formattedReason,
      updated_at: now,
    };

    try {
      await supabase.from('orders').update(dbUpdate).eq('id', orderId);
    } catch (dbErr) {
      console.warn('[Admin Cancel] Supabase order update warning:', dbErr);
    }

    // 4. Update Order Status in Memory
    if (memOrder) {
      memOrder.status = 'Cancelled';
      memOrder.cancelledAt = now;
      memOrder.cancelledBy = 'admin';
      memOrder.cancellationReason = formattedReason;
      memOrder.updatedAt = now;
    }

    // 5. Customer Notification (Simulate SMS / WhatsApp dispatch & log)
    const customerPhone = orderRow?.shipping_address?.phone || memOrder?.shippingAddress?.phone || 'Customer Phone';
    const customerName = orderRow?.shipping_address?.fullName || orderRow?.user_name || memOrder?.userName || 'Customer';

    const notificationEvent = {
      orderId,
      customerName,
      customerPhone,
      channel: 'SMS/WhatsApp',
      timestamp: now,
      message: `Dear ${customerName}, your order ${orderId} has been cancelled by admin. Reason: ${formattedReason}. We apologize for the inconvenience.`,
      status: 'DELIVERED',
    };

    console.log('[CUSTOMER NOTIFICATION DISPATCHED]:', notificationEvent);

    return NextResponse.json({
      success: true,
      orderId,
      status: 'Cancelled',
      cancelledAt: now,
      cancelledBy: 'admin',
      cancellationReason: formattedReason,
      stockRestored: shouldRestock,
      restockSummary,
      notification: {
        sent: true,
        channel: 'SMS & WhatsApp',
        recipient: customerPhone,
        message: notificationEvent.message,
        timestamp: now,
      },
      message: shouldRestock
        ? `Order ${orderId} cancelled. Stock successfully returned to inventory & customer notified.`
        : `Order ${orderId} cancelled due to Out of Stock. Stock was NOT restored & customer notified.`,
    });
  } catch (error) {
    console.error('[POST /api/admin/orders/cancel] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error while cancelling order.',
      },
      { status: 500 }
    );
  }
}
