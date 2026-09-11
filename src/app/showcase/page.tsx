'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { ShowcaseClient } from '@/components/ShowcaseClient';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Music2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ShowcasePage() {
  const [tracks, setTracks] = useState<any[]>([]);
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
            const stemIds = stemsData.map(s => s.id);

            // Fetch community mixes for these tracks
            const { data: mixesData } = await supabase
              .from('stem_mixes')
              .select('*')
              .in('stem_id', stemIds);

            // Fetch comments for these tracks
            const { data: commentsData } = await supabase
              .from('stem_comments')
              .select('*')
              .in('stem_id', stemIds);

            const mixMap = new Map<string, any[]>();
            mixesData?.forEach(m => {
              const list = mixMap.get(m.stem_id) || [];
              list.push(m);
              mixMap.set(m.stem_id, list);
            });

            const commentMap = new Map<string, any[]>();
            commentsData?.forEach(c => {
              const list = commentMap.get(c.stem_id) || [];
              list.push(c);
              commentMap.set(c.stem_id, list);
            });

            const formatted = stemsData.map(s => ({
              ...s,
              mixes: mixMap.get(s.id) || [],
              comments: commentMap.get(s.id) || [],
              is_track_of_week: (s.tags || []).includes('track of the week')
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
            Back to Vault Archive
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber rounded-sm flex items-center justify-center">
              <Music2 className="w-6 h-6 text-obsidian" />
            </div>
            <div>
              <h1 className="font-display text-3xl sm:text-4xl text-warm-white">Track of the Week Showcase</h1>
              <p className="text-dim text-sm font-body mt-0.5">
                Listen to community mixes submitted for the official Track of the Week multitrack session!
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Track of the Week Showcase Feed */}
        {loading ? (
          <div className="bg-surface border border-border p-12 text-center rounded-sm space-y-2">
            <p className="text-sm font-body text-dim animate-pulse">Loading Track of the Week showcase...</p>
          </div>
        ) : (
          <ShowcaseClient tracks={tracks} />
        )}

      </div>
    </div>
  );
}
