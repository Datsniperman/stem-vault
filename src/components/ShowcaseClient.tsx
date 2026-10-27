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

      {/* Search & Quick Stats Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-surface border border-border p-4 rounded-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dim" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by song title, church/artist, or mixer..."
            className="w-full bg-obsidian border border-border rounded-sm pl-9 pr-3 py-2 text-sm text-warm-white font-body focus:outline-none focus:border-amber placeholder:text-dim/50"
          />
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-dim">
          <span className="bg-surface-raised border border-border px-3 py-1.5 rounded-sm">
            <strong className="text-amber">{totalMixes}</strong> Total Mixes
          </span>
          <span className="bg-surface-raised border border-border px-3 py-1.5 rounded-sm">
            <strong className="text-warm-white">{tracks.length}</strong> Multitrack Sessions
          </span>
        </div>
      </div>

      {/* Track Feed Grid */}
      {sortedTracks.length === 0 ? (
        <div className="bg-surface border border-border p-12 text-center rounded-sm space-y-2">
          <p className="text-base font-body text-warm-white font-medium">No mixes found matching your search.</p>
          <p className="text-xs font-body text-dim">Try searching for a different song or artist title.</p>
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
                className="bg-surface border border-border hover:border-amber/40 p-6 rounded-sm space-y-5 transition-all shadow-lg"
              >
                {/* Track Info Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
                  <div className="space-y-1">
                    <h3 className="font-display text-xl text-warm-white">{track.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-body">
                      <span className="text-amber font-semibold">{track.artist}</span>
                      {track.bpm && <span className="text-dim">• {track.bpm} BPM</span>}
                      {track.key && <span className="text-dim">• Key: {track.key}</span>}
                      {track.track_count && <span className="text-dim">• {track.track_count} Stems</span>}
                      {track.daw_template_url && (
                        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-1.5 py-0.2 rounded">
                          DAW TEMPLATE
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
                        className="inline-flex items-center gap-1.5 bg-[#5865F2]/10 hover:bg-[#5865F2] border border-[#5865F2]/40 text-[#5865F2] hover:text-white font-body font-semibold text-xs px-3.5 py-2 rounded-sm transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Discord Thread</span>
                      </a>
                    )}
                    <Link
                      href={`/stems/${track.id}`}
                      className="inline-flex items-center gap-1.5 bg-amber hover:bg-amber-muted text-obsidian font-body font-bold text-xs px-4 py-2 rounded-sm transition-colors uppercase tracking-wider shadow-sm"
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
                    <div className="bg-obsidian/60 border border-border/60 p-6 rounded-sm text-center space-y-2">
                      <p className="text-xs font-body text-dim">No mixes submitted for this track yet.</p>
                      <Link href={`/stems/${track.id}?action=submit`} className="text-xs font-body text-amber hover:underline font-bold inline-block">
                        Be the first engineer to submit your mix →
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {mixesList.map(mix => (
                        <article
                          key={mix.id}
                          className="group relative bg-obsidian border border-border p-4 rounded-sm flex flex-col justify-between space-y-3 hover:border-amber/50 transition-all duration-200 hover:shadow-[0_4px_16px_rgba(255,183,3,0.06)]"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-0.5">
                                <span className="text-[10px] font-mono text-amber bg-amber/10 border border-amber/30 px-1.5 py-0.2 rounded uppercase tracking-wider inline-block">
                                  Mix Submission
                                </span>
                                <h5 className="font-display text-base text-warm-white leading-snug group-hover:text-amber transition-colors line-clamp-1">
                                  {mix.song_name || mix.title}
                                </h5>
                              </div>
                              <button
                                onClick={() => handleLike(mix.id, track.id)}
                                disabled={likingMap[mix.id]}
                                className="flex items-center gap-1 text-[11px] bg-amber/10 border border-amber/30 text-amber px-2 py-1 rounded-sm font-bold shrink-0 cursor-pointer hover:bg-amber hover:text-obsidian transition-colors"
                              >
                                <Heart className="w-3 h-3 fill-amber" />
                                <span>{mix.likes_count}</span>
                              </button>
                            </div>

                            <p className="text-mid text-xs font-body font-medium">
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
                              <p className="text-mid text-xs font-body leading-relaxed line-clamp-2 bg-surface/40 p-2 rounded border border-border/40">
                                {mix.description}
                              </p>
                            )}
                          </div>

                          <div className="pt-2 border-t border-border/60 flex items-center gap-2">
                            <a
                              href={mix.mix_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 inline-flex items-center justify-center gap-1.5 bg-surface-raised hover:bg-amber text-warm-white hover:text-obsidian border border-border hover:border-amber font-body font-bold text-xs py-2 rounded-sm transition-all uppercase tracking-wider shadow-sm"
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
                                className="p-2 bg-[#5865F2]/10 hover:bg-[#5865F2] text-[#5865F2] hover:text-white border border-[#5865F2]/40 rounded-sm transition-colors shrink-0"
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
                    <div className="bg-obsidian/40 border border-border/40 rounded p-2.5 text-xs font-body text-mid space-y-1">
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
