import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0, s-maxage=0',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
};

const CATEGORY_COLUMNS = 'id, name, slug, description, image, sort_order, active, parent_id, created_at';
const LEGACY_CATEGORY_COLUMNS = 'id, name, slug, description, image, sort_order, active, created_at';

function isMissingHierarchyColumn(error: { code?: string; message?: string } | null): boolean {
  return error?.code === '42703'
    || Boolean(error?.message?.includes('parent_id'));
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  sortOrder: number;
  active: boolean;
  parentId: string | null;
  createdAt?: string;
  children?: Category[];
}

type CategoryRow = Record<string, unknown>;

function mapDbCategory(row: CategoryRow): Category {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug || ''),
    description: String(row.description || ''),
    image: String(row.image || ''),
    sortOrder: Number(row.sort_order) || 0,
    active: Boolean(row.active),
    parentId: row.parent_id ? String(row.parent_id) : null,
    createdAt: row.created_at ? new Date(String(row.created_at)).toISOString() : undefined,
  };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function createTree(categories: Category[]): Category[] {
  const childrenByParent = new Map<string, Category[]>();
  for (const category of categories) {
    if (!category.parentId) continue;
    const children = childrenByParent.get(category.parentId) || [];
    children.push(category);
    childrenByParent.set(category.parentId, children);
  }

  return categories
    .filter((category) => !category.parentId)
    .map((category) => ({
      ...category,
      children: (childrenByParent.get(category.id) || []).sort(
        (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)
      ),
    }));
}

function categoryPayload(body: Record<string, unknown>) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const requestedSlug = typeof body.slug === 'string' ? body.slug.trim() : '';
  const slug = slugify(requestedSlug || name);
  const parentId = typeof body.parentId === 'string' && body.parentId.trim()
    ? body.parentId.trim()
    : null;

  if (!name) throw new Error('Category name is required.');
  if (!slug) throw new Error('A valid category slug is required.');

  return {
    name,
    slug,
    description: typeof body.description === 'string' ? body.description.trim() : '',
    image: typeof body.image === 'string' ? body.image.trim() : '',
    sort_order: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
    active: body.active === undefined ? true : Boolean(body.active),
    parent_id: parentId,
  };
}

async function validateParent(parentId: string | null, categoryId?: string): Promise<string | null> {
  if (parentId === categoryId) return 'A category cannot be its own parent.';

  const supabase = getServiceSupabase();
  if (parentId) {
    const { data, error } = await supabase
      .from('categories')
      .select('id, parent_id')
      .eq('id', parentId)
      .single();

    if (isMissingHierarchyColumn(error)) {
      return 'Run supabase/category_hierarchy.sql before creating subcategories.';
    }
    if (error || !data) return 'The selected parent category does not exist.';
    if (data.parent_id) return 'Subcategories can only be created under a parent category.';
  }

  if (categoryId) {
    const { data: current, error: currentError } = await supabase
      .from('categories')
      .select('parent_id')
      .eq('id', categoryId)
      .single();
    if (isMissingHierarchyColumn(currentError)) {
      return parentId ? 'Run supabase/category_hierarchy.sql before creating subcategories.' : null;
    }
    if (currentError || !current) return 'Category not found.';

    const { count, error: countError } = await supabase
      .from('categories')
      .select('id', { count: 'exact', head: true })
      .eq('parent_id', categoryId);
    if (countError) return countError.message;
    if ((count || 0) > 0 && parentId) {
      return 'A category with subcategories cannot become a subcategory.';
    }

    const placementChanged = (current.parent_id || null) !== parentId;
    if (placementChanged) {
      const assignmentColumn = current.parent_id ? 'subcategory_id' : 'category_id';
      const { count: productCount, error: productError } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq(assignmentColumn, categoryId);
      if (productError) return productError.message;
      if ((productCount || 0) > 0) {
        return 'Reassign products using this category before changing its hierarchy level.';
      }
    }
  }

  return null;
}

function databaseError(error: { message?: string; code?: string } | null, action: string) {
  if (error?.code === '23505') {
    return NextResponse.json(
      { error: 'A category with this name or slug already exists.' },
      { status: 409, headers: NO_STORE_HEADERS }
    );
  }
  return NextResponse.json(
    { error: error?.message || `Unable to ${action} category.` },
    { status: 500, headers: NO_STORE_HEADERS }
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const activeOnly = searchParams.get('active') === 'true';
  const tree = searchParams.get('tree') === 'true';
  const parentId = searchParams.get('parentId');
  const supabase = getServiceSupabase();

  const buildQuery = (columns: string, includeHierarchy: boolean) => {
    let query = supabase
      .from('categories')
      .select(columns)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });
    if (activeOnly) query = query.eq('active', true);
    if (includeHierarchy && parentId === 'root') query = query.is('parent_id', null);
    if (includeHierarchy && parentId && parentId !== 'root') query = query.eq('parent_id', parentId);
    return query;
  };

  let { data, error } = await buildQuery(CATEGORY_COLUMNS, true);
  if (isMissingHierarchyColumn(error)) {
    if (parentId && parentId !== 'root') {
      return NextResponse.json([], { headers: NO_STORE_HEADERS });
    }
    ({ data, error } = await buildQuery(LEGACY_CATEGORY_COLUMNS, false));
  }
  if (error) return databaseError(error, 'load');

  const categories = ((data || []) as unknown as CategoryRow[]).map(mapDbCategory);
  return NextResponse.json(tree ? createTree(categories) : categories, {
    headers: NO_STORE_HEADERS,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const payload = categoryPayload(body);
    const parentError = await validateParent(payload.parent_id);
    if (parentError) {
      return NextResponse.json({ error: parentError }, { status: 400, headers: NO_STORE_HEADERS });
    }

    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('categories')
      .insert({ id: `cat-${crypto.randomUUID()}`, ...payload })
      .select(CATEGORY_COLUMNS)
      .single();

    if (isMissingHierarchyColumn(error) && !payload.parent_id) {
      const { parent_id: _parentId, ...legacyPayload } = payload;
      const { data: legacyData, error: legacyError } = await supabase
        .from('categories')
        .insert({ id: `cat-${crypto.randomUUID()}`, ...legacyPayload })
        .select(LEGACY_CATEGORY_COLUMNS)
        .single();
      if (legacyError || !legacyData) return databaseError(legacyError, 'create');
      revalidatePath('/category');
      return NextResponse.json(mapDbCategory(legacyData), { status: 201, headers: NO_STORE_HEADERS });
    }
    if (error || !data) return databaseError(error, 'create');
    revalidatePath('/category');
    return NextResponse.json(mapDbCategory(data), { status: 201, headers: NO_STORE_HEADERS });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid category data.';
    return NextResponse.json({ error: message }, { status: 400, headers: NO_STORE_HEADERS });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const id = typeof body.id === 'string' ? body.id.trim() : '';
    if (!id) {
      return NextResponse.json({ error: 'Category ID is required.' }, { status: 400, headers: NO_STORE_HEADERS });
    }

    const payload = categoryPayload(body);
    const parentError = await validateParent(payload.parent_id, id);
    if (parentError) {
      return NextResponse.json({ error: parentError }, { status: 400, headers: NO_STORE_HEADERS });
    }

    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('categories')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(CATEGORY_COLUMNS)
      .single();

    if (isMissingHierarchyColumn(error) && !payload.parent_id) {
      const { parent_id: _parentId, ...legacyPayload } = payload;
      const { data: legacyData, error: legacyError } = await supabase
        .from('categories')
        .update({ ...legacyPayload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(LEGACY_CATEGORY_COLUMNS)
        .single();
      if (legacyError || !legacyData) return databaseError(legacyError, 'update');
      revalidatePath('/category');
      return NextResponse.json(mapDbCategory(legacyData), { headers: NO_STORE_HEADERS });
    }
    if (error || !data) return databaseError(error, 'update');

    if (!data.parent_id) {
      const { error: productError } = await supabase
        .from('products')
        .update({ category: data.name })
        .eq('category_id', id);
      if (productError) return databaseError(productError, 'synchronize products for');
    }

    revalidatePath('/category');
    return NextResponse.json(mapDbCategory(data), { headers: NO_STORE_HEADERS });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid category data.';
    return NextResponse.json({ error: message }, { status: 400, headers: NO_STORE_HEADERS });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id')?.trim();
  if (!id) {
    return NextResponse.json({ error: 'Category ID is required.' }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const supabase = getServiceSupabase();
  const { count: childCount, error: childError } = await supabase
    .from('categories')
    .select('id', { count: 'exact', head: true })
    .eq('parent_id', id);
  if (isMissingHierarchyColumn(childError)) {
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('name')
      .eq('id', id)
      .single();
    if (categoryError || !category) return databaseError(categoryError, 'find');

    const { count: legacyProductCount, error: legacyProductError } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category', category.name);
    if (legacyProductError) return databaseError(legacyProductError, 'check product assignments for');
    if ((legacyProductCount || 0) > 0) {
      return NextResponse.json(
        { error: 'This category is assigned to products. Reassign those products before deleting it.' },
        { status: 409, headers: NO_STORE_HEADERS }
      );
    }

    const { error: legacyDeleteError } = await supabase.from('categories').delete().eq('id', id);
    if (legacyDeleteError) return databaseError(legacyDeleteError, 'delete');
    revalidatePath('/category');
    return NextResponse.json({ success: true }, { headers: NO_STORE_HEADERS });
  }
  if (childError) return databaseError(childError, 'check');
  if ((childCount || 0) > 0) {
    return NextResponse.json(
      { error: 'Delete or move this category’s subcategories first.' },
      { status: 409, headers: NO_STORE_HEADERS }
    );
  }

  const { count: productCount, error: productError } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .or(`category_id.eq.${id},subcategory_id.eq.${id}`);
  if (productError) return databaseError(productError, 'check product assignments for');
  if ((productCount || 0) > 0) {
    return NextResponse.json(
      { error: 'This category is assigned to products. Reassign those products before deleting it.' },
      { status: 409, headers: NO_STORE_HEADERS }
    );
  }

  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) return databaseError(error, 'delete');

  revalidatePath('/category');
  return NextResponse.json({ success: true }, { headers: NO_STORE_HEADERS });
}
