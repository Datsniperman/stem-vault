'use client';

import { useState } from 'react';
import { ExternalLink, Heart, Music2, MessageSquare, Layers, Download, Search, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { toggleMixLike } from '@/app/actions/stems';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { Stem, StemMix, StemComment } from '@/types';

export interface ShowcaseTrackItem extends Stem {
  mixes: StemMix[];
  comments: StemComment[];
}

interface ShowcaseClientProps {
  tracks: ShowcaseTrackItem[];
}

export function ShowcaseClient({ tracks }: ShowcaseClientProps) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [search, setSearch] = useState('');
  const [likingMap, setLikingMap] = useState<Record<string, boolean>>({});
  const [localMixes, setLocalMixes] = useState<Record<string, StemMix[]>>({});

  // Filter tracks by search query (title, artist, or mix handles)
  const filteredTracks = tracks.filter(t => {
    const q = search.toLowerCase();
    const matchesTrack = t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q);
    const matchesMixes = t.mixes.some(m =>
      m.title.toLowerCase().includes(q) ||
      m.user_handle.toLowerCase().includes(q) ||
      (m.song_name && m.song_name.toLowerCase().includes(q))
    );
    return matchesTrack || matchesMixes;
  });

  // Sort tracks: tracks with mixes appear first
  const sortedTracks = [...filteredTracks].sort((a, b) => {
    const aMixes = (localMixes[a.id] || a.mixes).length;
    const bMixes = (localMixes[b.id] || b.mixes).length;
    return bMixes - aMixes;
  });

  const totalMixes = tracks.reduce((acc, t) => acc + (localMixes[t.id] || t.mixes).length, 0);

  const handleLike = async (mixId: string, stemId: string) => {
    if (!user) {
      addToast('Please sign in with Discord to like mixes.', 'error');
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
    <div className="space-y-8">

      {/* Search & Quick Stats Bar (M3 Search Pill Bar) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-surface-raised/80 border border-border/80 p-4 sm:p-5 rounded-3xl shadow-m3-1 backdrop-blur-md">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dim pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by song title, church/artist, or mixer..."
            className="w-full bg-surface-high border border-border/80 rounded-full pl-9 pr-4 py-2.5 text-xs text-warm-white placeholder:text-dim/60 focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber/40 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="bg-surface-high border border-border/70 px-3.5 py-1.5 rounded-full text-dim">
            <strong className="text-amber font-semibold">{totalMixes}</strong> Total Mixes
          </span>
          <span className="bg-surface-high border border-border/70 px-3.5 py-1.5 rounded-full text-dim">
            <strong className="text-warm-white font-semibold">{tracks.length}</strong> Sessions
          </span>
        </div>
      </div>

      {/* Track Feed Grid */}
      {sortedTracks.length === 0 ? (
        <div className="bg-surface-raised/70 border border-border/70 p-12 text-center rounded-3xl space-y-2 shadow-m3-1">
          <p className="text-base text-warm-white font-semibold">No mixes found matching your search.</p>
          <p className="text-xs text-dim">Try searching for a different song or artist title.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedTracks.map(track => {
            const mixesList = localMixes[track.id] || track.mixes;
            const guildId = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID || '';
            const discordThreadUrl = track.discord_thread_id && guildId
              ? `https://discord.com/channels/${guildId}/${track.discord_thread_id}`
              : null;

            return (
              <div
                key={track.id}
                className="bg-surface-raised/80 border border-border/80 hover:border-amber/40 p-6 sm:p-8 rounded-3xl space-y-6 transition-all shadow-m3-1 hover:shadow-m3-2 backdrop-blur-md"
              >
                {/* Track Info Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
                  <div className="space-y-1.5">
                    <h3 className="font-display text-2xl font-bold text-warm-white tracking-tight">{track.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-amber font-semibold">{track.artist}</span>
                      {track.bpm && <span className="text-dim">• {track.bpm} BPM</span>}
                      {track.key && <span className="text-dim">• Key: {track.key}</span>}
                      {track.track_count && <span className="text-dim">• {track.track_count} Stems</span>}
                      {track.daw_template_url && (
                        <span className="text-[10px] font-medium text-cyan-300 bg-cyan-950/60 border border-cyan-700/50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Layers className="w-3 h-3" /> DAW TEMPLATE
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {discordThreadUrl && (
                      <a
                        href={discordThreadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-[#5865F2]/15 hover:bg-[#5865F2] border border-[#5865F2]/40 text-[#5865F2] hover:text-white font-semibold text-xs px-4 py-2 rounded-full transition-all active:scale-95 shadow-sm"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Discord Thread</span>
                      </a>
                    )}
                    <Link
                      href={`/stems/${track.id}`}
                      className="inline-flex items-center gap-1.5 bg-amber hover:bg-amber-muted text-obsidian font-bold text-xs px-5 py-2 rounded-full transition-all shadow-m3-1 hover:shadow-m3-2 active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Get Stems & Mix</span>
                    </Link>
                  </div>
                </div>

                {/* Community Mixes for this Session */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono uppercase text-dim font-semibold flex items-center gap-1.5">
                      <Music2 className="w-3.5 h-3.5 text-amber" />
                      <span>Community Mix Submissions ({mixesList.length})</span>
                    </h4>
                  </div>

                  {mixesList.length === 0 ? (
                    <div className="bg-surface-high/50 border border-border/60 p-6 rounded-2xl text-center space-y-2">
                      <p className="text-xs text-dim">No mixes submitted for this track yet.</p>
                      <Link href={`/stems/${track.id}?action=submit`} className="text-xs text-amber hover:underline font-semibold inline-block">
                        Be the first engineer to submit your mix →
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {mixesList.map(mix => (
                        <article
                          key={mix.id}
                          className="group relative bg-surface-high/70 border border-border/70 p-4 sm:p-5 rounded-2xl flex flex-col justify-between space-y-3 hover:border-amber/40 transition-all shadow-sm hover:shadow-m3-1"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1">
                                <span className="text-[10px] font-mono text-amber bg-amber/15 border border-amber/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block">
                                  Mix Submission
                                </span>
                                <h5 className="font-display text-base font-bold text-warm-white leading-snug group-hover:text-amber transition-colors line-clamp-1">
                                  {mix.song_name || mix.title}
                                </h5>
                              </div>
                              <button
                                onClick={() => handleLike(mix.id, track.id)}
                                disabled={likingMap[mix.id]}
                                className="flex items-center gap-1 text-[11px] bg-amber/15 border border-amber/30 text-amber px-2.5 py-1 rounded-full font-bold shrink-0 cursor-pointer hover:bg-amber hover:text-obsidian transition-colors shadow-sm"
                              >
                                <Heart className="w-3 h-3 fill-amber" />
                                <span>{mix.likes_count}</span>
                              </button>
                            </div>

                            <p className="text-mid text-xs font-medium">
                              by{' '}
                              <Link
                                href={`/user/${encodeURIComponent(mix.user_handle.replace(/^@/, ''))}`}
                                className="text-warm-white hover:text-amber hover:underline transition-colors font-semibold"
                              >
                                {mix.user_handle}
                              </Link>
                            </p>

                            {(mix.musical_key || mix.bpm) && (
                              <div className="flex items-center gap-2 text-[10px] font-mono text-dim">
                                {mix.musical_key && <span>Key: {mix.musical_key}</span>}
                                {mix.bpm && <span>• {mix.bpm} BPM</span>}
                              </div>
                            )}

                            {mix.description && (
                              <p className="text-mid text-xs leading-relaxed line-clamp-2 bg-surface/50 p-2.5 rounded-xl border border-border/50">
                                {mix.description}
                              </p>
                            )}
                          </div>

                          <div className="pt-2 border-t border-border/60 flex items-center gap-2">
                            <a
                              href={mix.mix_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 inline-flex items-center justify-center gap-1.5 bg-surface hover:bg-amber text-warm-white hover:text-obsidian border border-border/80 hover:border-amber font-semibold text-xs py-2 rounded-full transition-all shadow-sm active:scale-95"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Listen to Mix</span>
                            </a>
                            {discordThreadUrl && (
                              <a
                                href={discordThreadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Critique on Discord Thread"
                                className="w-8 h-8 rounded-full flex items-center justify-center bg-[#5865F2]/15 hover:bg-[#5865F2] text-[#5865F2] hover:text-white border border-[#5865F2]/40 transition-colors shrink-0 shadow-sm"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>

                {/* Discussion Snippet */}
                {track.comments.length > 0 && (
                  <div className="pt-2 border-t border-border/40 space-y-1.5">
                    <h5 className="text-[10px] font-mono uppercase text-dim font-semibold flex items-center gap-1.5">
                      <MessageSquare className="w-3 h-3 text-mid" />
                      <span>Recent Notes ({track.comments.length})</span>
                    </h5>
                    <div className="bg-surface-high/50 border border-border/50 rounded-2xl p-3 text-xs text-mid space-y-1">
                      {track.comments.slice(0, 2).map((c: StemComment) => (
                        <p key={c.id} className="truncate text-xs">
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
      )}

    </div>
  );
}
