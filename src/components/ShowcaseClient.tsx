'use client';

import { useState } from 'react';
import { ExternalLink, Heart, Music2, Star, MessageSquare, Layers, Download, Music } from 'lucide-react';
import Link from 'next/link';
import { toggleMixLike } from '@/app/actions/stems';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { Stem, StemMix, StemComment } from '@/types';

export interface ShowcaseTrackItem extends Stem {
  mixes: StemMix[];
  comments: StemComment[];
  is_track_of_week?: boolean;
}

interface ShowcaseClientProps {
  tracks: ShowcaseTrackItem[];
}

export function ShowcaseClient({ tracks }: ShowcaseClientProps) {
  const { user } = useAuth();
  const { addToast } = useToast();

  // Only display the designated Track of the Week (or fallback to the top track if none set)
  const trackOfTheWeek = tracks.find(t => t.is_track_of_week) || tracks[0];
  const displayTracks = trackOfTheWeek ? [trackOfTheWeek] : [];

  const [likingMap, setLikingMap] = useState<Record<string, boolean>>({});
  const [localMixes, setLocalMixes] = useState<Record<string, StemMix[]>>({});

  const handleLike = async (mixId: string, stemId: string) => {
    if (!user) {
      addToast('Please sign in to like mixes.', 'error');
      return;
    }

    setLikingMap(prev => ({ ...prev, [mixId]: true }));
    const res = await toggleMixLike(mixId, stemId);
    setLikingMap(prev => ({ ...prev, [mixId]: false }));

    if (res.success) {
      addToast(res.message, 'info');
      setLocalMixes(prev => {
        const list = prev[stemId] || tracks.find(t => t.id === stemId)?.mixes || [];
        const updated = list.map(m => {
          if (m.id === mixId) {
            const count = res.liked ? m.likes_count + 1 : Math.max(0, m.likes_count - 1);
            return { ...m, likes_count: count };
          }
          return m;
        });
        return { ...prev, [stemId]: updated };
      });
    } else {
      addToast(res.message, 'error');
    }
  };

  return (
    <div className="space-y-10">

      {/* Featured Track of the Week Banner */}
      {trackOfTheWeek && (
        <div className="bg-gradient-to-r from-amber/15 via-surface-raised to-surface border border-amber/40 p-6 sm:p-8 rounded-sm relative overflow-hidden shadow-2xl">
          <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
            <Music2 className="w-64 h-64 text-amber" />
          </div>

          <div className="relative z-10 space-y-4 max-w-4xl">
            <div className="inline-flex items-center gap-1.5 bg-amber text-obsidian text-[11px] font-body font-extrabold px-3 py-1 rounded-sm uppercase tracking-wider shadow-sm">
              <Star className="w-3.5 h-3.5 fill-obsidian" />
              <span>Official Track of the Week</span>
            </div>

            <div>
              <h2 className="font-display text-3xl sm:text-4xl text-warm-white">{trackOfTheWeek.title}</h2>
              <p className="text-amber text-base font-body font-semibold mt-1">by {trackOfTheWeek.artist}</p>
            </div>

            {/* Quick stats for Track of the Week */}
            <div className="flex flex-wrap gap-3 text-xs font-body text-dim">
              {trackOfTheWeek.bpm && (
                <span className="bg-obsidian border border-border px-2.5 py-1 rounded-sm">
                  ⚡ {trackOfTheWeek.bpm} BPM
                </span>
              )}
              {trackOfTheWeek.key && (
                <span className="bg-obsidian border border-border px-2.5 py-1 rounded-sm">
                  🎵 Key of {trackOfTheWeek.key}
                </span>
              )}
              {trackOfTheWeek.track_count && (
                <span className="bg-obsidian border border-border px-2.5 py-1 rounded-sm">
                  🎛️ {trackOfTheWeek.track_count} Stems
                </span>
              )}
              <span className="bg-amber/10 border border-amber/30 text-amber px-2.5 py-1 rounded-sm font-semibold">
                🎧 {trackOfTheWeek.mixes.length} Community Mixes
              </span>
              <span className="bg-surface-raised border border-border text-mid px-2.5 py-1 rounded-sm">
                💬 {trackOfTheWeek.comments.length} Discussion Comments
              </span>
            </div>

            {trackOfTheWeek.description && (
              <p className="text-mid text-xs sm:text-sm font-body leading-relaxed bg-obsidian/70 border border-border/60 p-3.5 rounded-sm">
                "{trackOfTheWeek.description}"
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href={`/stems/${trackOfTheWeek.id}`}
                className="inline-flex items-center gap-2 bg-amber hover:bg-amber-muted text-obsidian font-body font-bold text-xs px-6 py-3 rounded-sm transition-colors uppercase tracking-wider shadow-lg"
              >
                <Download className="w-4 h-4" />
                <span>Get Stems & Join the Mix Challenge</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Track Feed Grid focusing on Community Mixes & Comments */}
      {displayTracks.length === 0 ? (
        <div className="bg-surface border border-border p-12 text-center rounded-sm space-y-2">
          <p className="text-base font-body text-warm-white font-medium">No Track of the Week selected yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="font-display text-2xl text-warm-white flex items-center gap-2">
            <span>Community Submitted Mixes</span>
          </h2>

          <div className="grid grid-cols-1 gap-6">
            {displayTracks.map(track => {
              const mixesList = localMixes[track.id] || track.mixes;

              return (
                <div
                  key={track.id}
                  className={`bg-surface border p-6 rounded-sm space-y-5 transition-all shadow-lg ${
                    track.id === trackOfTheWeek?.id
                      ? 'border-amber shadow-[0_0_20px_rgba(255,183,3,0.1)]'
                      : 'border-border hover:border-amber/30'
                  }`}
                >
                  {/* Track Info Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {track.id === trackOfTheWeek?.id && (
                          <span className="text-[10px] font-body bg-amber text-obsidian px-2 py-0.5 rounded-sm font-extrabold uppercase tracking-wider">
                            Track of the Week
                          </span>
                        )}
                        <h3 className="font-display text-xl text-warm-white">{track.title}</h3>
                      </div>
                      <p className="text-amber text-sm font-body font-semibold">by {track.artist}</p>
                    </div>

                    <Link
                      href={`/stems/${track.id}`}
                      className="inline-flex items-center gap-1.5 bg-surface-raised hover:bg-obsidian border border-border text-warm-white hover:text-amber font-body font-semibold text-xs px-4 py-2 rounded-sm transition-colors shrink-0"
                    >
                      <Download className="w-3.5 h-3.5 text-amber" />
                      <span>View Session & Submit Mix</span>
                    </Link>
                  </div>

                  {/* Community Mixes Showcase for this Track */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-mono uppercase text-amber font-semibold flex items-center gap-1.5">
                        <Music2 className="w-3.5 h-3.5" />
                        <span>Submitted Community Mixes ({mixesList.length})</span>
                      </h4>
                    </div>

                    {mixesList.length === 0 ? (
                      <div className="bg-obsidian/60 border border-border/60 p-4 rounded-sm text-center">
                        <p className="text-xs font-body text-dim">No community mixes posted for this track yet.</p>
                        <Link href={`/stems/${track.id}`} className="text-xs font-body text-amber hover:underline font-medium mt-1 inline-block">
                          Be the first to submit a mix →
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {mixesList.map(mix => (
                          <div key={mix.id} className="bg-obsidian border border-border p-4 rounded-sm space-y-2.5 flex flex-col justify-between">
                            <div className="space-y-1">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h5 className="font-body font-bold text-warm-white text-sm">{mix.title}</h5>
                                  <p className="text-xs text-amber font-body">by {mix.user_handle}</p>
                                </div>
                                <button
                                  onClick={() => handleLike(mix.id, track.id)}
                                  disabled={likingMap[mix.id]}
                                  className="flex items-center gap-1 text-[11px] bg-amber/10 border border-amber/30 text-amber px-2 py-0.5 rounded-sm font-bold shrink-0 cursor-pointer"
                                >
                                  <Heart className="w-3 h-3 fill-amber" />
                                  <span>{mix.likes_count}</span>
                                </button>
                              </div>
                              {mix.description && (
                                <p className="text-xs font-body text-mid leading-relaxed line-clamp-2">{mix.description}</p>
                              )}
                            </div>

                            <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                              <a
                                href={mix.mix_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-body text-amber hover:underline font-bold uppercase tracking-wider"
                              >
                                <span>Listen</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Discussion Comments Snippet */}
                  {track.comments.length > 0 && (
                    <div className="pt-2 border-t border-border/40 space-y-2">
                      <h4 className="text-[11px] font-mono uppercase text-dim font-semibold flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-mid" />
                        <span>Recent Discussion ({track.comments.length})</span>
                      </h4>
                      <div className="bg-obsidian/40 border border-border/40 rounded p-3 text-xs font-body text-mid space-y-1.5">
                        {track.comments.slice(0, 2).map((c: StemComment) => (
                          <p key={c.id} className="truncate">
                            <strong className="text-amber font-semibold">{c.user_handle}:</strong> {c.content}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
