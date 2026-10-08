import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// GET /api/products — fetch all products (optionally filtered)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isNewArrival = searchParams.get('is_new_arrival');
  const isBestSeller = searchParams.get('is_best_seller');
  const category = searchParams.get('category');
  const search = searchParams.get('search');

  const supabase = getAdminClient();
  let query = supabase.from('products').select('id, name, price, numeric_price, category, image, images, stock, active, is_new_arrival, is_best_seller, sort_order, description, specification, shipping_care, youtube_url, facebook_url, instagram_url, created_at').order('sort_order');

  if (isNewArrival === 'true') query = query.eq('is_new_arrival', true);
  if (isBestSeller === 'true') query = query.eq('is_best_seller', true);
  if (category && category !== 'All') query = query.eq('category', category);
  if (search && search.trim()) {
    const s = search.trim();
    query = query.or(`name.ilike.%${s}%,category.ilike.%${s}%,description.ilike.%${s}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}

// POST /api/products — create a new product
export async function POST(request: Request) {
  const body = await request.json();
  const supabase = getAdminClient();

  const numericPrice = parseInt(body.price?.replace(/[^\d]/g, '') || '0', 10);

  const record: Record<string, unknown> = {
    id: body.id || `prod-${Date.now()}`,
    name: body.name,
    price: body.price,
    numeric_price: numericPrice,
    category: body.category,
    image: body.image,
    stock: body.stock ?? 10,
    active: body.active ?? true,
    is_new_arrival: body.isNewArrival ?? false,
    is_best_seller: body.isBestSeller ?? false,
    sort_order: body.order ?? 0,
    youtube_url: body.youtubeUrl || body.youtube_url || '',
    facebook_url: body.facebookUrl || body.facebook_url || '',
    instagram_url: body.instagramUrl || body.instagram_url || '',
  };

  if (Array.isArray(body.images)) {
    record.images = body.images;
  }
  if (typeof body.description === 'string') {
    record.description = body.description;
  }
  if (typeof body.specification === 'string') {
    record.specification = body.specification;
  }
  if (typeof body.shippingCare === 'string') {
    record.shipping_care = body.shippingCare;
  } else if (typeof body.shipping_care === 'string') {
    record.shipping_care = body.shipping_care;
  }

  const COLS = 'id, name, price, numeric_price, category, image, images, stock, active, is_new_arrival, is_best_seller, sort_order, description, specification, shipping_care, youtube_url, facebook_url, instagram_url, created_at';

  // Attempt insert
  const { data, error } = await supabase
    .from('products')
    .insert(record)
    .select(COLS)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// PATCH /api/products — update a product by id in query string
export async function PATCH(request: Request) {
  const body = await request.json();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const supabase = getAdminClient();
  const numericPrice = body.price
    ? parseInt(body.price.replace(/[^\d]/g, '') || '0', 10)
    : undefined;

  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.price !== undefined) patch.price = body.price;
  if (numericPrice !== undefined) patch.numeric_price = numericPrice;
  if (body.category !== undefined) patch.category = body.category;
  if (body.image !== undefined) patch.image = body.image;
  if (body.stock !== undefined) patch.stock = body.stock;
  if (body.active !== undefined) patch.active = body.active;
  if (body.isNewArrival !== undefined) patch.is_new_arrival = body.isNewArrival;
  if (body.isBestSeller !== undefined) patch.is_best_seller = body.isBestSeller;
  if (body.order !== undefined) patch.sort_order = body.order;
  if (body.images !== undefined) patch.images = body.images;
  if (body.description !== undefined) patch.description = body.description;
  if (body.specification !== undefined) patch.specification = body.specification;
  if (body.shippingCare !== undefined) patch.shipping_care = body.shippingCare;
  if (body.shipping_care !== undefined) patch.shipping_care = body.shipping_care;
  if (body.youtubeUrl !== undefined) patch.youtube_url = body.youtubeUrl;
  if (body.youtube_url !== undefined) patch.youtube_url = body.youtube_url;
  if (body.facebookUrl !== undefined) patch.facebook_url = body.facebookUrl;
  if (body.facebook_url !== undefined) patch.facebook_url = body.facebook_url;
  if (body.instagramUrl !== undefined) patch.instagram_url = body.instagramUrl;
  if (body.instagram_url !== undefined) patch.instagram_url = body.instagram_url;

  const COLS = 'id, name, price, numeric_price, category, image, images, stock, active, is_new_arrival, is_best_seller, sort_order, description, specification, shipping_care, youtube_url, facebook_url, instagram_url, created_at';

  const { data, error } = await supabase
    .from('products')
    .update(patch)
    .eq('id', id)
    .select(COLS)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

// DELETE /api/products — delete a product by id in query string
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const supabase = getAdminClient();
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
