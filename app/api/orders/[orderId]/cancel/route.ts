import { NextRequest, NextResponse } from 'next/server';
import {
  canCustomerCancelOrder,
  memoryOrders,
  OrderStatus,
  RefundStatus,
} from '@/lib/orders';
import {
  RazorpayApiError,
  RazorpayConfigurationError,
  refundRazorpayPayment,
} from '@/lib/razorpay';
import { getAuthenticatedUser } from '@/lib/requestAuth';
import { getServiceSupabase } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface StoredOrder {
  id: string;
  user_id: string;
  status: OrderStatus;
  payment_method: 'cod' | 'online';
  payment_status: 'pending' | 'paid' | 'failed';
  razorpay_payment_id: string | null;
  shiprocket_order_id: string | null;
  shiprocket_shipment_id: string | null;
  awb_number: string | null;
  cancellation_reason?: string | null;
  cancelled_at: string | null;
  refund_status?: RefundStatus | null;
  refund_id?: string | null;
  refunded_at?: string | null;
}

interface CancelOrderBody {
  reason?: unknown;
}

interface RouteContext {
  params: {
    orderId: string;
  };
}

function parseCancellationReason(body: CancelOrderBody): string {
  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
  if (reason.length < 3 || reason.length > 250) {
    throw new RangeError('Choose or enter a cancellation reason between 3 and 250 characters.');
  }
  return reason;
}

function hasCarrierBooking(order: StoredOrder): boolean {
  return Boolean(
    order.shiprocket_order_id ||
      order.shiprocket_shipment_id ||
      order.awb_number
  );
}

function isMissingCancellationSchemaError(error: { code?: string; message?: string }): boolean {
  const message = error.message || '';
  return (
    error.code === '42703' ||
    error.code === 'PGRST204' ||
    /column .* does not exist/i.test(message) ||
    /schema cache.*(cancellation_reason|cancelled_by|refund_status|refund_id|refunded_at)/i.test(message)
  );
}

export async function POST(request: NextRequest, context: RouteContext) {
  const user = getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Please sign in to cancel this order.' },
      { status: 401 }
    );
  }

  const orderId = decodeURIComponent(context.params.orderId || '').trim();
  if (!orderId) {
    return NextResponse.json(
      { success: false, error: 'A valid order ID is required.' },
      { status: 400 }
    );
  }

  let reason: string;
  try {
    reason = parseCancellationReason((await request.json()) as CancelOrderBody);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'A cancellation reason is required.',
      },
      { status: 400 }
    );
  }

  try {
    const supabase = getServiceSupabase();
    const { data, error: findError } = await supabase
      .from('orders')
      .select(
        'id, user_id, status, payment_method, payment_status, razorpay_payment_id, shiprocket_order_id, shiprocket_shipment_id, awb_number, cancelled_at'
      )
      .eq('id', orderId)
      .maybeSingle();

    if (findError) {
      throw new Error(`Unable to read the order: ${findError.message}`);
    }
    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Order not found.' },
        { status: 404 }
      );
    }

    const order = data as StoredOrder;
    if (order.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'You cannot cancel another customer’s order.' },
        { status: 403 }
      );
    }

    if (order.status === 'Cancelled') {
      return NextResponse.json({
        success: true,
        orderId: order.id,
        status: order.status,
        cancelledAt: order.cancelled_at,
        cancellationReason: order.cancellation_reason,
        refundStatus: order.refund_status || 'not_required',
        refundId: order.refund_id,
        refundedAt: order.refunded_at,
        message: 'This order is already cancelled.',
      });
    }

    if (!canCustomerCancelOrder(order.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `This order cannot be cancelled after it has reached ${order.status}. Please contact support for help.`,
        },
        { status: 409 }
      );
    }

    if (hasCarrierBooking(order)) {
      return NextResponse.json(
        {
          success: false,
          error: 'A courier booking already exists for this order. Please contact support to cancel it safely.',
        },
        { status: 409 }
      );
    }

    const cancelledAt = new Date().toISOString();
    const refundRequired =
      order.payment_method === 'online' &&
      order.payment_status === 'paid' &&
      Boolean(order.razorpay_payment_id);
    const initialRefundStatus: RefundStatus = refundRequired ? 'pending' : 'not_required';

    let { data: updatedData, error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'Cancelled',
        cancelled_at: cancelledAt,
        cancelled_by: 'customer',
        cancellation_reason: reason,
        refund_status: initialRefundStatus,
        updated_at: cancelledAt,
      })
      .eq('id', order.id)
      .eq('user_id', user.id)
      .in('status', ['Pending', 'Confirmed', 'Processing'])
      .select('id')
      .maybeSingle();

    if (updateError && isMissingCancellationSchemaError(updateError)) {
      console.warn('Cancellation audit columns are not installed; saving the core cancellation state', {
        orderId: order.id,
        databaseError: updateError.message,
      });
      const baseUpdate = await supabase
        .from('orders')
        .update({
          status: 'Cancelled',
          cancelled_at: cancelledAt,
          updated_at: cancelledAt,
        })
        .eq('id', order.id)
        .eq('user_id', user.id)
        .in('status', ['Pending', 'Confirmed', 'Processing'])
        .select('id')
        .maybeSingle();
      updatedData = baseUpdate.data;
      updateError = baseUpdate.error;
    }

    if (updateError) {
      throw new Error(`Unable to cancel the order: ${updateError.message}`);
    }
    if (!updatedData) {
      return NextResponse.json(
        {
          success: false,
          error: 'The order changed while cancellation was being processed. Refresh and try again.',
        },
        { status: 409 }
      );
    }

    const memoryOrder = memoryOrders.find(
      (candidate) => candidate.id === order.id && candidate.userId === user.id
    );
    if (memoryOrder) {
      memoryOrder.status = 'Cancelled';
      memoryOrder.cancelledAt = cancelledAt;
      memoryOrder.cancelledBy = 'customer';
      memoryOrder.cancellationReason = reason;
      memoryOrder.refundStatus = initialRefundStatus;
      memoryOrder.updatedAt = cancelledAt;
    }

    let refundStatus: RefundStatus = initialRefundStatus;
    let refundId: string | undefined;
    let refundedAt: string | undefined;
    let refundMessage: string | undefined;

    if (refundRequired && order.razorpay_payment_id) {
      try {
        const refund = await refundRazorpayPayment(order.razorpay_payment_id, order.id);
        refundStatus = refund.status === 'processed' ? 'processed' : 'pending';
        refundId = refund.id;
        refundedAt = refund.status === 'processed' ? new Date().toISOString() : undefined;

        const { error: refundUpdateError } = await supabase
          .from('orders')
          .update({
            refund_status: refundStatus,
            refund_id: refundId,
            refunded_at: refundedAt || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id)
          .eq('user_id', user.id);

        if (refundUpdateError && !isMissingCancellationSchemaError(refundUpdateError)) {
          console.error('Razorpay refund succeeded but order refund metadata was not saved', {
            orderId: order.id,
            refundId,
            databaseError: refundUpdateError.message,
          });
          refundMessage = 'Your refund was submitted, but its status could not be saved. Contact support with your order ID.';
        } else if (refundUpdateError) {
          console.warn('Razorpay refund submitted before cancellation audit migration was installed', {
            orderId: order.id,
            refundId,
          });
        }
      } catch (error) {
        refundStatus = 'failed';
        const refundError = error instanceof Error ? error.message : 'Unknown refund error';
        const { error: refundUpdateError } = await supabase
          .from('orders')
          .update({
            refund_status: refundStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id)
          .eq('user_id', user.id);

        console.error('Order cancelled but Razorpay refund could not be submitted', {
          orderId: order.id,
          error: refundError,
          databaseError: refundUpdateError?.message,
          providerStatus:
            error instanceof RazorpayApiError ? error.status : undefined,
          configurationError: error instanceof RazorpayConfigurationError,
        });
        refundMessage = 'The order is cancelled, but the automatic refund could not be submitted. Support must process it manually.';
      }
    }

    if (memoryOrder) {
      memoryOrder.refundStatus = refundStatus;
      memoryOrder.refundId = refundId;
      memoryOrder.refundedAt = refundedAt;
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      status: 'Cancelled',
      cancelledAt,
      cancellationReason: reason,
      refundStatus,
      refundId,
      refundedAt,
      message: refundMessage ||
        (refundRequired
          ? 'Order cancelled. Your refund has been submitted.'
          : 'Order cancelled successfully.'),
    });
  } catch (error) {
    console.error('Customer order cancellation failed', {
      orderId,
      userId: user.id,
      error: error instanceof Error ? error.message : error,
    });
    return NextResponse.json(
      { success: false, error: 'Unable to cancel this order right now. Please try again.' },
      { status: 500 }
    );
  }
}
