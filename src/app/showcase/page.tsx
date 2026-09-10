import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { Header } from '@/components/Header';
import { ExternalLink, Heart, Music2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface ShowcaseMix {
  id: string;
  stem_id: string;
  user_id: string;
  user_handle: string;
  title: string;
  mix_url: string;
  description: string | null;
  likes_count: number;
  created_at: string;
  stem_title?: string;
  stem_artist?: string;
}

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
      }

      if (mixesData && mixesData.length > 0) {
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
                Explore live audio mixes, master revisions, and production showcases posted by engineers.
              </p>
            </div>
          </div>
        </div>

        {/* Mix Grid */}
        {mixes.length === 0 ? (
          <div className="bg-surface border border-border p-12 text-center rounded-sm space-y-2">
            <p className="text-base font-body text-warm-white font-medium">No community mixes posted yet.</p>
            <p className="text-xs text-dim font-body">
              Be the first engineer to submit a mix from any stem session detail page!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mixes.map(m => (
              <div
                key={m.id}
                className="bg-surface border border-border p-5 rounded-sm flex flex-col justify-between space-y-4 hover:border-amber/40 transition-colors shadow-lg"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-body font-bold text-warm-white text-lg leading-snug">{m.title}</h3>
                      <p className="text-xs text-amber font-body font-semibold">by {m.user_handle}</p>
                    </div>

                    <div className="flex items-center gap-1 text-xs bg-amber/10 border border-amber/30 text-amber font-bold px-2.5 py-1 rounded-sm shrink-0">
                      <Heart className="w-3.5 h-3.5 fill-amber" />
                      <span>{m.likes_count}</span>
                    </div>
                  </div>

                  <div className="bg-obsidian border border-border px-3 py-2 rounded text-xs font-body text-dim">
                    <span>Stem Session: </span>
                    <Link href={`/stems/${m.stem_id}`} className="text-warm-white font-medium hover:text-amber transition-colors">
                      "{m.stem_title}" by {m.stem_artist}
                    </Link>
                  </div>

                  {m.description && (
                    <p className="text-xs font-body text-mid leading-relaxed pt-1 line-clamp-3">{m.description}</p>
                  )}
                </div>

                <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-dim">{getTimeAgo(m.created_at)}</span>
                  <a
                    href={m.mix_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-amber hover:bg-amber-muted text-obsidian font-body font-bold text-xs px-3.5 py-1.5 rounded-sm transition-colors uppercase tracking-wider"
                  >
                    <span>Listen to Mix</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

function getTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'today';
  if (days === 1) return '1d ago';
  if (days < 30)  return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}
