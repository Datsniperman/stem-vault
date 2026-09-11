'use client';

import { useState } from 'react';
import { ExternalLink, Heart, Music2, Star } from 'lucide-react';
import Link from 'next/link';
import { toggleMixLike } from '@/app/actions/stems';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';

export interface ShowcaseMix {
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

interface ShowcaseClientProps {
  initialMixes: ShowcaseMix[];
}

export function ShowcaseClient({ initialMixes }: ShowcaseClientProps) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [mixes, setMixes] = useState<ShowcaseMix[]>(initialMixes);
  const [featuredId, setFeaturedId] = useState<string | null>(initialMixes.length > 0 ? initialMixes[0].id : null);
  const [likingMap, setLikingMap] = useState<Record<string, boolean>>({});

  const handleLike = async (mix: ShowcaseMix) => {
    if (!user) {
      addToast('Please sign in to like mixes.', 'error');
      return;
    }

    setLikingMap(prev => ({ ...prev, [mix.id]: true }));
    const res = await toggleMixLike(mix.id, mix.stem_id);
    setLikingMap(prev => ({ ...prev, [mix.id]: false }));

    if (res.success) {
      addToast(res.message, 'info');
      setMixes(prev =>
        prev.map(m => {
          if (m.id === mix.id) {
            const count = res.liked ? m.likes_count + 1 : Math.max(0, m.likes_count - 1);
            return { ...m, likes_count: count };
          }
          return m;
        })
      );
    } else {
      addToast(res.message, 'error');
    }
  };

  const featuredMix = mixes.find(m => m.id === featuredId) || mixes[0];

  return (
    <div className="space-y-8">
      {/* Hand-Picked "Mix of the Week" Spotlight Header Banner */}
      {featuredMix && (
        <div className="bg-gradient-to-r from-amber/10 via-surface-raised to-surface border border-amber/30 p-6 sm:p-8 rounded-sm relative overflow-hidden shadow-xl">
          <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
            <Music2 className="w-64 h-64 text-amber" />
          </div>

          <div className="relative z-10 space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-1.5 bg-amber text-obsidian text-[11px] font-body font-extrabold px-3 py-1 rounded-sm uppercase tracking-wider">
              <Star className="w-3.5 h-3.5 fill-obsidian" />
              <span>Vault Spotlight • Mix of the Week</span>
            </div>

            <div>
              <h2 className="font-display text-2xl sm:text-3xl text-warm-white">{featuredMix.title}</h2>
              <p className="text-amber text-sm font-body font-semibold mt-1">Mixed by {featuredMix.user_handle}</p>
            </div>

            {featuredMix.description && (
              <p className="text-mid text-xs sm:text-sm font-body leading-relaxed bg-obsidian/60 border border-border/60 p-3 rounded-sm">
                "{featuredMix.description}"
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href={featuredMix.mix_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-amber hover:bg-amber-muted text-obsidian font-body font-bold text-xs px-5 py-2.5 rounded-sm transition-colors uppercase tracking-wider shadow-md"
              >
                <span>Listen to Spotlight Mix</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <Link
                href={`/stems/${featuredMix.stem_id}`}
                className="inline-flex items-center gap-1.5 text-xs text-warm-white hover:text-amber font-body underline transition-colors"
              >
                <span>Stem Session: "{featuredMix.stem_title}"</span>
              </Link>
            </div>
          </div>
        </div>
      )}

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
              className={`bg-surface border p-5 rounded-sm flex flex-col justify-between space-y-4 transition-all shadow-lg ${
                m.id === featuredId ? 'border-amber shadow-[0_0_15px_rgba(255,183,3,0.15)]' : 'border-border hover:border-amber/40'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-body font-bold text-warm-white text-lg leading-snug">{m.title}</h3>
                    <p className="text-xs text-amber font-body font-semibold">by {m.user_handle}</p>
                  </div>

                  <button
                    onClick={() => handleLike(m)}
                    disabled={likingMap[m.id]}
                    title="Like this mix"
                    className="flex items-center gap-1 text-xs bg-amber/10 border border-amber/30 text-amber hover:bg-amber/20 font-bold px-2.5 py-1 rounded-sm shrink-0 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Heart className="w-3.5 h-3.5 fill-amber" />
                    <span>{m.likes_count}</span>
                  </button>
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
                <button
                  onClick={() => setFeaturedId(m.id)}
                  className="text-[10px] font-mono text-dim hover:text-amber transition-colors underline"
                >
                  {m.id === featuredId ? '★ Spotlighted' : 'Set as Spotlight'}
                </button>
                <a
                  href={m.mix_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-amber hover:bg-amber-muted text-obsidian font-body font-bold text-xs px-3.5 py-1.5 rounded-sm transition-colors uppercase tracking-wider"
                >
                  <span>Listen</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
