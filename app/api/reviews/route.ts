import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userEmail: string;
  rating: number;
  title?: string;
  comment: string;
  status: 'approved' | 'pending' | 'rejected';
  createdAt: string;
  productName?: string;
}

// In-memory fallback
let memoryReviews: ProductReview[] = [];

function mapDbReview(row: Record<string, unknown>): ProductReview {
  return {
    id: String(row.id),
    productId: String(row.product_id),
    userId: String(row.user_id),
    userName: String(row.user_name || 'Customer'),
    userEmail: String(row.user_email || ''),
    rating: Number(row.rating) || 5,
    title: String(row.title || ''),
    comment: String(row.comment || ''),
    status: (row.status as 'approved' | 'pending' | 'rejected') || 'approved',
    createdAt: row.created_at ? new Date(String(row.created_at)).toISOString() : new Date().toISOString(),
  };
}

function computeSummary(reviews: ProductReview[]) {
  const total = reviews.length;
  if (total === 0) {
    return {
      average: 0,
      total: 0,
      breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
  }

  const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;

  for (const r of reviews) {
    const star = Math.max(1, Math.min(5, Math.round(r.rating)));
    breakdown[star] = (breakdown[star] || 0) + 1;
    sum += r.rating;
  }

  const average = Number((sum / total).toFixed(1));
  return {
    average,
    total,
    breakdown,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reviews
//   ?productId=xxx → get approved reviews & rating summary for a product
//   ?all=true      → admin get all reviews (with optional ?status=xxx)
//   ?userId=xxx    → get reviews submitted by a specific user
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const all = searchParams.get('all') === 'true';
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    // 1. Try Supabase
    try {
      const supabase = getServiceSupabase();
      let query = supabase.from('product_reviews').select('*').order('created_at', { ascending: false });

      if (productId) {
        query = query.eq('product_id', productId);
        if (!all) {
          query = query.eq('status', 'approved');
        }
      } else if (userId) {
        query = query.eq('user_id', userId);
      } else if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        const mapped = data.map(mapDbReview);

        if (productId) {
          const summary = computeSummary(mapped);
          return NextResponse.json({ success: true, reviews: mapped, summary }, { status: 200 });
        }

        return NextResponse.json({ success: true, reviews: mapped, total: mapped.length }, { status: 200 });
      }
    } catch {
      // Table doesn't exist yet, proceed to memory
    }

    // 2. Memory fallback
    let filtered = [...memoryReviews];
    if (productId) {
      filtered = filtered.filter((r) => r.productId === productId && (all || r.status === 'approved'));
      const summary = computeSummary(filtered);
      return NextResponse.json({ success: true, reviews: filtered, summary }, { status: 200 });
    }
    if (userId) {
      filtered = filtered.filter((r) => r.userId === userId);
    }
    if (status) {
      filtered = filtered.filter((r) => r.status === status);
    }

    return NextResponse.json({ success: true, reviews: filtered, total: filtered.length }, { status: 200 });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/reviews (Customer submits a review)
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, rating, title, comment, userId, userName, userEmail } = body;

    if (!productId) {
      return NextResponse.json({ success: false, error: 'Product ID is required.' }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ success: false, error: 'You must be logged in to submit a review.' }, { status: 401 });
    }
    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      return NextResponse.json({ success: false, error: 'Rating must be between 1 and 5 stars.' }, { status: 400 });
    }
    if (!comment || typeof comment !== 'string' || !comment.trim()) {
      return NextResponse.json({ success: false, error: 'Please write a comment for your review.' }, { status: 400 });
    }

    const cleanUserName = (userName || '').trim() || (userEmail ? userEmail.split('@')[0] : 'Customer');
    const cleanUserEmail = (userEmail || '').trim();

    const newReview: ProductReview = {
      id: `rev-${Date.now()}`,
      productId: String(productId),
      userId: String(userId),
      userName: cleanUserName,
      userEmail: cleanUserEmail,
      rating: numRating,
      title: (title || '').trim(),
      comment: comment.trim(),
      status: 'approved', // Auto-approve or pending; approved allows instant feedback
      createdAt: new Date().toISOString(),
    };

    // 1. Insert into Supabase
    try {
      const supabase = getServiceSupabase();
      const { data, error } = await supabase
        .from('product_reviews')
        .insert({
          id: newReview.id,
          product_id: newReview.productId,
          user_id: newReview.userId,
          user_name: newReview.userName,
          user_email: newReview.userEmail,
          rating: newReview.rating,
          title: newReview.title,
          comment: newReview.comment,
          status: newReview.status,
        })
        .select()
        .single();

      if (!error && data) {
        return NextResponse.json({ success: true, review: mapDbReview(data), message: 'Review submitted successfully!' }, { status: 201 });
      }
    } catch {
      // fallback to memory
    }

    // 2. Memory fallback
    memoryReviews.unshift(newReview);
    return NextResponse.json({ success: true, review: newReview, message: 'Review submitted successfully!' }, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/reviews (Admin updates review status)
// ─────────────────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !['approved', 'pending', 'rejected'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Valid id and status required.' }, { status: 400 });
    }

    // 1. Supabase
    try {
      const supabase = getServiceSupabase();
      await supabase
        .from('product_reviews')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
    } catch {
      // fallback
    }

    // 2. Memory
    const idx = memoryReviews.findIndex((r) => r.id === id);
    if (idx !== -1) {
      memoryReviews[idx].status = status;
    }

    return NextResponse.json({ success: true, message: `Review status updated to ${status}` }, { status: 200 });
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/reviews?id=xxx (Admin deletes a review)
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Review ID is required.' }, { status: 400 });
    }

    // 1. Supabase
    try {
      const supabase = getServiceSupabase();
      await supabase.from('product_reviews').delete().eq('id', id);
    } catch {
      // fallback
    }

    // 2. Memory
    memoryReviews = memoryReviews.filter((r) => r.id !== id);

    return NextResponse.json({ success: true, message: 'Review deleted successfully.' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
