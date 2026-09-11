'use client';

import { useState, useEffect } from 'react';
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
  const [artworkUrl, setArtworkUrl] = useState<string | null>(trackOfTheWeek?.cover_url || null);

  // Fetch artwork dynamically from iTunes Search API if not explicit on stem
  useEffect(() => {
    if (!trackOfTheWeek) return;
    if (trackOfTheWeek.cover_url) {
      setArtworkUrl(trackOfTheWeek.cover_url);
      return;
    }

    let isMounted = true;
    const fetchArtwork = async () => {
      try {
        const query = encodeURIComponent(`${trackOfTheWeek.artist} ${trackOfTheWeek.title}`);
        const res = await fetch(`https://itunes.apple.com/search?term=${query}&entity=song&limit=1`);
        if (res.ok) {
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            const hiresUrl = data.results[0].artworkUrl100.replace('100x100bb', '600x600bb');
            if (isMounted) setArtworkUrl(hiresUrl);
          }
        }
      } catch {
        // Fallback
      }
    };

    fetchArtwork();
    return () => { isMounted = false; };
  }, [trackOfTheWeek?.artist, trackOfTheWeek?.title, trackOfTheWeek?.cover_url]);

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
        <div className="bg-gradient-to-r from-amber/15 via-surface-raised to-surface border border-amber/40 p-6 sm:p-8 rounded-sm relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-start md:items-center gap-6 sm:gap-8">
          
          {/* Album Artwork Preview */}
          <div className="w-32 h-32 sm:w-44 sm:h-44 bg-surface-raised border border-amber/30 rounded-sm overflow-hidden shrink-0 shadow-xl relative group">
            {artworkUrl ? (
              <img
                src={artworkUrl}
                alt={`${trackOfTheWeek.title} by ${trackOfTheWeek.artist}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-amber/20 via-obsidian to-surface flex items-center justify-center">
                <Music2 className="w-12 h-12 text-amber/60" />
              </div>
            )}
          </div>

          <div className="relative z-10 space-y-4 flex-1">
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
                      <div className="bg-obsidian/60 border border-border/60 p-8 rounded-sm text-center space-y-2">
                        <p className="text-sm font-body text-dim">No community mixes submitted for this track yet.</p>
                        <Link href={`/stems/${track.id}`} className="text-xs font-body text-amber hover:underline font-bold inline-block">
                          Be the first to submit a mix →
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {mixesList.map(mix => (
                          <article
                            key={mix.id}
                            className="group relative bg-surface border border-border flex flex-col aspect-square overflow-hidden rounded-sm hover:border-amber/50 transition-all duration-200 hover:shadow-[0_0_15px_rgba(255,183,3,0.1)]"
                          >
                            {/* Artwork Header */}
                            <div className="relative h-1/3 w-full overflow-hidden bg-surface-raised border-b border-border shrink-0">
                              {(artworkUrl || track.cover_url) ? (
                                <img
                                  src={artworkUrl || track.cover_url}
                                  alt={mix.title}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-surface-raised via-obsidian to-surface flex items-center justify-center">
                                  <Music2 className="w-8 h-8 text-amber/40" />
                                </div>
                              )}

                              {/* Top Badge Overlay */}
                              <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                                <span className="text-[10px] font-body bg-obsidian/80 text-amber border border-amber/30 px-2 py-0.5 rounded-sm shadow-sm backdrop-blur-md font-bold uppercase tracking-wider">
                                  Community Mix
                                </span>
                                <button
                                  onClick={() => handleLike(mix.id, track.id)}
                                  disabled={likingMap[mix.id]}
                                  className="flex items-center gap-1 text-[11px] bg-obsidian/90 border border-amber/40 text-amber px-2 py-0.5 rounded-sm font-bold shadow-md backdrop-blur-md pointer-events-auto cursor-pointer hover:bg-amber hover:text-obsidian transition-colors"
                                >
                                  <Heart className="w-3 h-3 fill-amber group-hover/btn:fill-obsidian" />
                                  <span>{mix.likes_count}</span>
                                </button>
                              </div>
                            </div>

                            {/* Middle Content */}
                            <div className="p-4 flex-1 flex flex-col justify-between min-h-0 bg-surface">
                              <div className="space-y-1.5 min-h-0">
                                <h5 className="font-display text-lg text-warm-white leading-snug truncate group-hover:text-amber transition-colors">
                                  {mix.title}
                                </h5>
                                <p className="text-amber text-xs font-body font-semibold">by {mix.user_handle}</p>
                                {mix.description && (
                                  <p className="text-mid text-xs font-body leading-relaxed line-clamp-3 mt-1">
                                    {mix.description}
                                  </p>
                                )}
                              </div>

                              {/* Footer Action Button */}
                              <div className="pt-3 border-t border-border flex items-center justify-between">
                                <a
                                  href={mix.mix_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full inline-flex items-center justify-center gap-2 bg-surface-raised hover:bg-amber text-warm-white hover:text-obsidian border border-border hover:border-amber font-body font-bold text-xs py-2 rounded-sm transition-all duration-150 uppercase tracking-wider"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  <span>Listen to Mix</span>
                                </a>
                              </div>
                            </div>
                          </article>
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
