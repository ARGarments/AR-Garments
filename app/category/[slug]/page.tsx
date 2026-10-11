import { redirect } from 'next/navigation';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function CategorySlugPage({ params }: { params: { slug: string } }) {
  const supabase = getServiceSupabase();
  const { data: category } = await supabase
    .from('categories')
    .select('id, name, parent_id')
    .eq('slug', params.slug)
    .eq('active', true)
    .single();

  if (!category) redirect('/category');

  if (!category.parent_id) {
    redirect(`/category?category=${encodeURIComponent(category.name)}`);
  }

  const { data: parent } = await supabase
    .from('categories')
    .select('name')
    .eq('id', category.parent_id)
    .eq('active', true)
    .single();

  if (!parent) redirect('/category');
  redirect(
    `/category?category=${encodeURIComponent(parent.name)}&subcategory=${encodeURIComponent(category.name)}`
  );
}
