import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
};

const PRODUCT_COLUMNS = 'id, name, price, numeric_price, category, category_id, subcategory_id, image, images, stock, active, is_new_arrival, is_best_seller, sort_order, description, specification, shipping_care, youtube_url, facebook_url, instagram_url, created_at';
const LEGACY_PRODUCT_COLUMNS = 'id, name, price, numeric_price, category, image, images, stock, active, is_new_arrival, is_best_seller, sort_order, description, specification, shipping_care, youtube_url, facebook_url, instagram_url, created_at';

function isMissingHierarchyColumn(error: { code?: string; message?: string } | null): boolean {
  return error?.code === '42703'
    || Boolean(error?.message?.includes('category_id'))
    || Boolean(error?.message?.includes('subcategory_id'))
    || Boolean(error?.message?.includes('parent_id'));
}

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

type CategoryAssignment = {
  categoryId: string;
  categoryName: string;
  subcategoryId: string | null;
  hierarchyAvailable: boolean;
};

async function resolveCategoryAssignment(
  supabase: ReturnType<typeof getAdminClient>,
  categoryIdValue: unknown,
  categoryNameValue: unknown,
  subcategoryIdValue: unknown
): Promise<CategoryAssignment> {
  const categoryId = typeof categoryIdValue === 'string' ? categoryIdValue.trim() : '';
  const categoryName = typeof categoryNameValue === 'string' ? categoryNameValue.trim() : '';
  const subcategoryId = typeof subcategoryIdValue === 'string' && subcategoryIdValue.trim()
    ? subcategoryIdValue.trim()
    : null;
  const categoryQuery = supabase
    .from('categories')
    .select('id, name, parent_id');
  let { data: category, error: categoryError } = categoryId
    ? await categoryQuery.eq('id', categoryId).single()
    : await categoryQuery.ilike('name', categoryName).is('parent_id', null).single();

  if (isMissingHierarchyColumn(categoryError)) {
    if (subcategoryId) {
      throw new Error('Run supabase/category_hierarchy.sql before assigning subcategories.');
    }
    const legacyQuery = supabase.from('categories').select('id, name');
    const legacyResult = categoryId
      ? await legacyQuery.eq('id', categoryId).single()
      : await legacyQuery.ilike('name', categoryName).single();
    category = legacyResult.data ? { ...legacyResult.data, parent_id: null } : null;
    categoryError = legacyResult.error;
    if (categoryError || !category) throw new Error('Select a valid parent category.');
    return {
      categoryId: String(category.id),
      categoryName: String(category.name),
      subcategoryId: null,
      hierarchyAvailable: false,
    };
  }

  if (categoryError || !category || category.parent_id) {
    throw new Error('Select a valid parent category.');
  }

  if (subcategoryId) {
    const { data: subcategory, error: subcategoryError } = await supabase
      .from('categories')
      .select('id, parent_id')
      .eq('id', subcategoryId)
      .single();
    if (subcategoryError || !subcategory || subcategory.parent_id !== category.id) {
      throw new Error('Select a subcategory that belongs to the chosen parent category.');
    }
  }

  return {
    categoryId: String(category.id),
    categoryName: String(category.name),
    subcategoryId,
    hierarchyAvailable: true,
  };
}

// GET /api/products — fetch all products (optionally filtered)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isNewArrival = searchParams.get('is_new_arrival');
  const isBestSeller = searchParams.get('is_best_seller');
  const category = searchParams.get('category');
  const categoryId = searchParams.get('category_id');
  const subcategoryId = searchParams.get('subcategory_id');
  const search = searchParams.get('search');

  const supabase = getAdminClient();
  const buildQuery = (columns: string, includeHierarchy: boolean) => {
    let query = supabase.from('products').select(columns).order('sort_order');
    if (isNewArrival === 'true') query = query.eq('is_new_arrival', true);
    if (isBestSeller === 'true') query = query.eq('is_best_seller', true);
    if (category && category !== 'All') query = query.eq('category', category);
    if (includeHierarchy && categoryId) query = query.eq('category_id', categoryId);
    if (includeHierarchy && subcategoryId) query = query.eq('subcategory_id', subcategoryId);
    if (search && search.trim()) {
      const value = search.trim();
      query = query.or(`name.ilike.%${value}%,category.ilike.%${value}%,description.ilike.%${value}%`);
    }
    return query;
  };

  let { data, error } = await buildQuery(PRODUCT_COLUMNS, true);
  if (isMissingHierarchyColumn(error)) {
    if (subcategoryId) return NextResponse.json([], { headers: NO_STORE_HEADERS });
    ({ data, error } = await buildQuery(LEGACY_PRODUCT_COLUMNS, false));
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, {
    headers: NO_STORE_HEADERS,
  });
}

// POST /api/products — create a new product
export async function POST(request: Request) {
  const body = await request.json();
  const supabase = getAdminClient();

  let assignment: CategoryAssignment;
  try {
    assignment = await resolveCategoryAssignment(
      supabase,
      body.categoryId || body.category_id,
      body.category,
      body.subcategoryId || body.subcategory_id
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid category assignment.';
    return NextResponse.json({ error: message }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const numericPrice = parseInt(body.price?.replace(/[^\d]/g, '') || '0', 10);

  const record: Record<string, unknown> = {
    id: body.id || `prod-${Date.now()}`,
    name: body.name,
    price: body.price,
    numeric_price: numericPrice,
    category: assignment.categoryName,
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
  if (assignment.hierarchyAvailable) {
    record.category_id = assignment.categoryId;
    record.subcategory_id = assignment.subcategoryId;
  }

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

  // Attempt insert
  const selectColumns: string = assignment.hierarchyAvailable
    ? PRODUCT_COLUMNS
    : LEGACY_PRODUCT_COLUMNS;
  const { data, error } = await supabase
    .from('products')
    .insert(record)
    .select(selectColumns)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const createdProduct = data as unknown as { id: string } & Record<string, unknown>;

  revalidatePath('/');
  revalidatePath('/category');
  revalidatePath(`/product/${createdProduct.id}`);

  return NextResponse.json(createdProduct, { status: 201, headers: NO_STORE_HEADERS });
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
  const categoryAssignmentChanged = body.categoryId !== undefined
    || body.category_id !== undefined
    || body.subcategoryId !== undefined
    || body.subcategory_id !== undefined
    || body.category !== undefined;
  if (categoryAssignmentChanged) {
    try {
      const assignment = await resolveCategoryAssignment(
        supabase,
        body.categoryId || body.category_id,
        body.category,
        body.subcategoryId || body.subcategory_id
      );
      patch.category = assignment.categoryName;
      if (assignment.hierarchyAvailable) {
        patch.category_id = assignment.categoryId;
        patch.subcategory_id = assignment.subcategoryId;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid category assignment.';
      return NextResponse.json({ error: message }, { status: 400, headers: NO_STORE_HEADERS });
    }
  }
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

  let { data, error } = await supabase
    .from('products')
    .update(patch)
    .eq('id', id)
    .select(PRODUCT_COLUMNS)
    .single();

  if (isMissingHierarchyColumn(error)) {
    ({ data, error } = await supabase
      .from('products')
      .update(patch)
      .eq('id', id)
      .select(LEGACY_PRODUCT_COLUMNS)
      .single());
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath('/');
  revalidatePath('/category');
  revalidatePath(`/product/${id}`);

  return NextResponse.json(data, { headers: NO_STORE_HEADERS });
}

// DELETE /api/products — delete a product by id in query string
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const supabase = getAdminClient();
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath('/');
  revalidatePath('/category');
  revalidatePath(`/product/${id}`);

  return NextResponse.json({ success: true }, { headers: NO_STORE_HEADERS });
}
