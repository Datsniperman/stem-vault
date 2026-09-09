import { createSupabaseServerClient } from '@/lib/supabase/server';
import { StemFeed } from '@/components/StemFeed';
import { Stem } from '@/types';

export const dynamic = 'force-dynamic';

export default async function Home() {
  let stems: Stem[] = [];

  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('stems')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (data && !error) {
        stems = data as Stem[];
      } else if (error) {
        console.error('[page] Supabase fetch error:', error.message);
      }
    }
  } catch (err) {
    console.error('[page] Supabase fetch failed:', err);
  }

  return <StemFeed initialStems={stems} />;
}
