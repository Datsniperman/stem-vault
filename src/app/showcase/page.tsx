import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { Header } from '@/components/Header';
import { ShowcaseClient, ShowcaseMix } from '@/components/ShowcaseClient';
import { Music2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ShowcasePage() {
  let mixes: ShowcaseMix[] = [];

  try {
    const supabaseServer = await createSupabaseServerClient();
    const supabaseAdmin = await createSupabaseAdminClient();
    const supabase = supabaseAdmin || supabaseServer;

    if (supabase) {
      const { data: mixesData, error: mixesError } = await supabase
        .from('stem_mixes')
        .select('*')
        .order('likes_count', { ascending: false });

      if (mixesError) {
        console.error('[ShowcasePage] Supabase error fetching stem_mixes:', mixesError);
      } else if (mixesData && mixesData.length > 0) {
        const stemIds = Array.from(new Set(mixesData.map(m => m.stem_id)));
        const { data: stemsData } = await supabase
          .from('stems')
          .select('id, title, artist')
          .in('id', stemIds);

        const stemMap = new Map(stemsData?.map(s => [s.id, s]) || []);

        mixes = mixesData.map(m => ({
          ...m,
          stem_title: stemMap.get(m.stem_id)?.title || 'Stem Session',
          stem_artist: stemMap.get(m.stem_id)?.artist || 'Artist',
        }));
      }
    }
  } catch (err) {
    console.error('[ShowcasePage] Fetch error:', err);
    mixes = [];
  }

  return (
    <div className="min-h-screen bg-obsidian text-warm-white pb-20">
      <Header onStemAdded={() => {}} />

      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 space-y-8">

        {/* Header Banner */}
        <div className="space-y-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-body text-dim hover:text-amber transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Vault Archive
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber rounded-sm flex items-center justify-center">
              <Music2 className="w-6 h-6 text-obsidian" />
            </div>
            <div>
              <h1 className="font-display text-3xl sm:text-4xl text-warm-white">Community Mix Showcase</h1>
              <p className="text-dim text-sm font-body mt-0.5">
                Explore live audio mixes, master revisions, and hand-picked spotlight mixes.
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Mix Showcase Feed */}
        <ShowcaseClient initialMixes={mixes} />

      </div>
    </div>
  );
}
