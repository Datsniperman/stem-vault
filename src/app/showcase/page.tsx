'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { ShowcaseClient, ShowcaseTrackItem } from '@/components/ShowcaseClient';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export default function ShowcasePage() {
  const [tracks, setTracks] = useState<ShowcaseTrackItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchTracks = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        if (supabase) {
          const { data: stemsData, error: stemsError } = await supabase
            .from('stems')
            .select('*')
            .eq('status', 'published')
            .order('created_at', { ascending: false });

          if (!stemsError && stemsData && stemsData.length > 0) {
            const stemIds = stemsData.map((s: any) => s.id);

            const { data: mixesData } = await supabase
              .from('stem_mixes')
              .select('*')
              .in('stem_id', stemIds)
              .order('likes_count', { ascending: false });

            const { data: commentsData } = await supabase
              .from('stem_comments')
              .select('*')
              .in('stem_id', stemIds);

            const mixMap = new Map<string, any[]>();
            mixesData?.forEach((m: any) => {
              const list = mixMap.get(m.stem_id) || [];
              list.push(m);
              mixMap.set(m.stem_id, list);
            });

            const commentMap = new Map<string, any[]>();
            commentsData?.forEach((c: any) => {
              const list = commentMap.get(c.stem_id) || [];
              list.push(c);
              commentMap.set(c.stem_id, list);
            });

            const formatted: ShowcaseTrackItem[] = stemsData.map((s: any) => ({
              ...s,
              mixes: mixMap.get(s.id) || [],
              comments: commentMap.get(s.id) || [],
            }));

            if (isMounted) setTracks(formatted);
          }
        }
      } catch (err) {
        console.error('[ShowcasePage] Client fetch error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTracks();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-200 pb-20">
      <Header onStemAdded={() => {}} />

      {/* Header Banner */}
      <section className="border-b border-neutral-800/80 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="space-y-1.5 max-w-2xl">
            <p className="text-[11px] font-mono uppercase tracking-widest text-neutral-400">
              Tyler Kerpsack All Access
            </p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
              Community Mix Showcase
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed pt-1">
              Finished mixes and DAW practice sessions posted by community engineers. Stream mixes, check signal chains, and exchange feedback in Discord.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3 text-neutral-400">
            <div className="w-6 h-6 border-2 border-neutral-700 border-t-white rounded-full animate-spin" />
            <p className="text-xs font-mono">Loading showcase...</p>
          </div>
        ) : (
          <ShowcaseClient tracks={tracks} />
        )}
      </div>
    </div>
  );
}
