'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { ShowcaseClient, ShowcaseTrackItem } from '@/components/ShowcaseClient';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Music2, ArrowLeft, Disc3 } from 'lucide-react';
import Link from 'next/link';

export default function ShowcasePage() {
  const [tracks, setTracks] = useState<ShowcaseTrackItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchTracks = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        if (supabase) {
          // Fetch published stem tracks
          const { data: stemsData, error: stemsError } = await supabase
            .from('stems')
            .select('*')
            .eq('status', 'published')
            .order('created_at', { ascending: false });

          if (!stemsError && stemsData && stemsData.length > 0) {
            const stemIds = stemsData.map((s: any) => s.id);

            // Fetch community mixes for these tracks
            const { data: mixesData } = await supabase
              .from('stem_mixes')
              .select('*')
              .in('stem_id', stemIds)
              .order('likes_count', { ascending: false });

            // Fetch comments for these tracks
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
            Back to Multitrack Archive
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber rounded-sm flex items-center justify-center shadow-lg shadow-amber/10">
              <Disc3 className="w-6 h-6 text-obsidian" />
            </div>
            <div>
              <h1 className="font-display text-3xl sm:text-4xl text-warm-white">Community Mix Showcase</h1>
              <p className="text-dim text-sm font-body mt-0.5">
                Stream finished mixes and DAW sessions submitted by Tyler Kerpsack All Access mixers.
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Showcase Feed */}
        {loading ? (
          <div className="bg-surface border border-border p-12 text-center rounded-sm space-y-2">
            <p className="text-sm font-body text-dim animate-pulse">Loading community mix showcase...</p>
          </div>
        ) : (
          <ShowcaseClient tracks={tracks} />
        )}

      </div>
    </div>
  );
}
