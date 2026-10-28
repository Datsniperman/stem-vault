'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { ShowcaseClient, ShowcaseTrackItem } from '@/components/ShowcaseClient';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { ArrowLeft, Hash } from 'lucide-react';
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
    <div className="min-h-screen bg-[#313338] text-[#dbdee1] pb-20">
      <Header onStemAdded={() => {}} />

      {/* Channel Header Banner */}
      <div className="bg-[#2b2d31] border-b border-[#1f2023]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#1e1f22] flex items-center justify-center text-[#949ba4]">
                <Hash className="w-4 h-4 stroke-[2.5]" />
              </div>
              <h1 className="text-base sm:text-lg font-bold text-[#f2f3f5]">
                mix-showcase
              </h1>
              <span className="text-[11px] font-medium text-[#5865F2] bg-[#5865F2]/10 border border-[#5865F2]/25 px-2 py-0.5 rounded">
                Tyler Kerpsack All Access
              </span>
            </div>
            <p className="text-xs text-[#949ba4]">
              Finished mixes and DAW practice sessions posted by community engineers. React, stream cloud links, and jump into Discord feedback threads.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-2 text-[#949ba4]">
            <div className="w-6 h-6 border-2 border-[#5865F2] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs">Loading showcase feed...</p>
          </div>
        ) : (
          <ShowcaseClient tracks={tracks} />
        )}
      </div>
    </div>
  );
}
