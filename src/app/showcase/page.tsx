'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { ShowcaseClient, ShowcaseMix } from '@/components/ShowcaseClient';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Music2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ShowcasePage() {
  const [mixes, setMixes] = useState<ShowcaseMix[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchMixes = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        if (supabase) {
          const { data: mixesData, error: mixesError } = await supabase
            .from('stem_mixes')
            .select('*')
            .order('likes_count', { ascending: false });

          if (!mixesError && mixesData && mixesData.length > 0) {
            const stemIds = Array.from(new Set(mixesData.map(m => m.stem_id)));
            const { data: stemsData } = await supabase
              .from('stems')
              .select('id, title, artist')
              .in('id', stemIds);

            const stemMap = new Map(stemsData?.map(s => [s.id, s]) || []);

            const formatted = mixesData.map(m => ({
              ...m,
              stem_title: stemMap.get(m.stem_id)?.title || 'Stem Session',
              stem_artist: stemMap.get(m.stem_id)?.artist || 'Artist',
            }));

            if (isMounted) setMixes(formatted);
          }
        }
      } catch (err) {
        console.error('[ShowcasePage] Client fetch error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMixes();
    return () => { isMounted = false; };
  }, []);

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
        {loading ? (
          <div className="bg-surface border border-border p-12 text-center rounded-sm space-y-2">
            <p className="text-sm font-body text-dim animate-pulse">Loading showcase mixes...</p>
          </div>
        ) : (
          <ShowcaseClient initialMixes={mixes} />
        )}

      </div>
    </div>
  );
}
