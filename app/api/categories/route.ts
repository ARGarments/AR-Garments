import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  sortOrder?: number;
  active: boolean;
  createdAt?: string;
}

// In-memory fallback if Supabase table is not yet created
const defaultCategories: Category[] = [
  {
    id: 'cat-1',
    name: 'Sarees',
    slug: 'sarees',
    description: 'Exclusive designer & bridal sarees with intricate zari and silk drapes',
    image: '/home-images/Sarees.jpg',
    sortOrder: 1,
    active: true,
  },
  {
    id: 'cat-2',
    name: 'Suits & Dress Material',
    slug: 'suits-dress-material',
    description: 'Premium unstitched and ready-to-wear salwar suit sets',
    image: '/home-images/Suits & Dress Materia.jpg',
    sortOrder: 2,
    active: true,
  },
  {
    id: 'cat-3',
    name: 'Dupatta Sets',
    slug: 'dupatta-sets',
    description: 'Complete matching dupatta and traditional wear combinations',
    image: '/home-images/Dupatta Sets.jpg',
    sortOrder: 3,
    active: true,
  },
  {
    id: 'cat-4',
    name: 'Men Fashion',
    slug: 'men-fashion',
    description: 'Royal sherwanis, kurtas, and traditional ethnic men fashion',
    image: '/home-images/Men Fashion.jpg',
    sortOrder: 4,
    active: true,
  },
  {
    id: 'cat-5',
    name: 'Kids Fashion',
    slug: 'kids-fashion',
    description: 'Festive outfits and adorable traditional wear for children',
    image: '/home-images/Kids Fashion.jpg',
    sortOrder: 5,
    active: true,
  },
];

let memoryCategories: Category[] = [...defaultCategories];

function mapDbCategory(row: Record<string, unknown>): Category {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug || ''),
    description: String(row.description || ''),
    image: String(row.image || ''),
    sortOrder: Number(row.sort_order) || 0,
    active: Boolean(row.active),
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

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/categories
//   ?active=true  → only active categories (storefront)
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get('active') === 'true';

    // 1. Try Supabase
    try {
      const supabase = getServiceSupabase();
      let query = supabase.from('categories').select('*').order('sort_order', { ascending: true });
      if (activeOnly) {
        query = query.eq('active', true);
      }
      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        const mapped = data.map(mapDbCategory);
        return NextResponse.json(mapped, { status: 200 });
      }
    } catch {
      // Table doesn't exist yet, proceed to memory
    }

    // 2. Fallback to memory
    const filtered = activeOnly ? memoryCategories.filter((c) => c.active) : memoryCategories;
    return NextResponse.json(filtered, { status: 200 });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/categories  (Admin creates a new category)
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, slug, description, image, sortOrder, active } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const cleanName = name.trim();
    const cleanSlug = (slug && slug.trim()) ? slugify(slug) : slugify(cleanName);
    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name: cleanName,
      slug: cleanSlug,
      description: (description || '').trim(),
      image: (image || '').trim(),
      sortOrder: Number(sortOrder) || 0,
      active: active !== undefined ? Boolean(active) : true,
      createdAt: new Date().toISOString(),
    };

    // 1. Insert into Supabase
    try {
      const supabase = getServiceSupabase();
      const { data, error } = await supabase
        .from('categories')
        .insert({
          id: newCategory.id,
          name: newCategory.name,
          slug: newCategory.slug,
          description: newCategory.description,
          image: newCategory.image,
          sort_order: newCategory.sortOrder,
          active: newCategory.active,
        })
        .select()
        .single();

      if (!error && data) {
        return NextResponse.json(mapDbCategory(data), { status: 201 });
      }
      if (error && error.message?.includes('duplicate key')) {
        return NextResponse.json({ error: 'A category with this name or slug already exists' }, { status: 400 });
      }
    } catch {
      // fallback to memory
    }

    // 2. Memory store fallback
    memoryCategories.push(newCategory);
    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/categories  (Admin updates an existing category)
// ─────────────────────────────────────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, slug, description, image, sortOrder, active } = body;

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    const cleanName = name ? name.trim() : undefined;
    const cleanSlug = slug ? slugify(slug) : (cleanName ? slugify(cleanName) : undefined);

    // 1. Update in Supabase
    try {
      const supabase = getServiceSupabase();
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (cleanName !== undefined) updateData.name = cleanName;
      if (cleanSlug !== undefined) updateData.slug = cleanSlug;
      if (description !== undefined) updateData.description = description;
      if (image !== undefined) updateData.image = image;
      if (sortOrder !== undefined) updateData.sort_order = Number(sortOrder);
      if (active !== undefined) updateData.active = Boolean(active);

      const { data, error } = await supabase
        .from('categories')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        return NextResponse.json(mapDbCategory(data), { status: 200 });
      }
    } catch {
      // fallback to memory
    }

    // 2. Memory fallback
    const idx = memoryCategories.findIndex((c) => c.id === id);
    if (idx !== -1) {
      memoryCategories[idx] = {
        ...memoryCategories[idx],
        ...(cleanName !== undefined ? { name: cleanName } : {}),
        ...(cleanSlug !== undefined ? { slug: cleanSlug } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(image !== undefined ? { image } : {}),
        ...(sortOrder !== undefined ? { sortOrder: Number(sortOrder) } : {}),
        ...(active !== undefined ? { active: Boolean(active) } : {}),
      };
      return NextResponse.json(memoryCategories[idx], { status: 200 });
    }

    return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/categories?id=xxx
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    // 1. Delete from Supabase
    try {
      const supabase = getServiceSupabase();
      await supabase.from('categories').delete().eq('id', id);
    } catch {
      // fallback to memory
    }

    // 2. Delete from memory
    memoryCategories = memoryCategories.filter((c) => c.id !== id);

    return NextResponse.json({ success: true, message: 'Category deleted' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
