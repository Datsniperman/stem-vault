'use client';

import { useState } from 'react';
import { ExternalLink, Heart, Music2, MessageSquare, Layers, Download, Search, MessageCircle, Hash } from 'lucide-react';
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

  const sortedTracks = [...filteredTracks].sort((a, b) => {
    const aMixes = (localMixes[a.id] || a.mixes).length;
    const bMixes = (localMixes[b.id] || b.mixes).length;
    return bMixes - aMixes;
  });

  const totalMixes = tracks.reduce((acc, t) => acc + (localMixes[t.id] || t.mixes).length, 0);

  const handleLike = async (mixId: string, stemId: string) => {
    if (!user) {
      addToast('Please sign in with Discord to react to mixes.', 'error');
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
    <div className="space-y-6">

      {/* Search & Channel Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#2b2d31] border border-[#1f2023] p-3 sm:p-4 rounded shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#949ba4] pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by song, artist, mixer..."
            className="w-full bg-[#1e1f22] border border-[#1f2023] rounded pl-8 pr-3 py-1.5 text-xs text-[#dbdee1] placeholder-[#949ba4] focus:outline-none focus:border-[#5865F2]"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-[#949ba4]">
          <span className="bg-[#1e1f22] border border-[#1f2023] px-2.5 py-1 rounded">
            <strong className="text-[#f2f3f5]">{totalMixes}</strong> Community Mixes
          </span>
          <span className="bg-[#1e1f22] border border-[#1f2023] px-2.5 py-1 rounded">
            <strong className="text-[#f2f3f5]">{tracks.length}</strong> Multitrack Sessions
          </span>
        </div>
      </div>

      {/* Track Feed Grid */}
      {sortedTracks.length === 0 ? (
        <div className="bg-[#2b2d31] border border-[#1f2023] p-10 text-center rounded text-xs text-[#949ba4] space-y-1">
          <p className="text-sm font-semibold text-[#f2f3f5]">No mixes found.</p>
          <p>Try searching for a different song or church name.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedTracks.map(track => {
            const mixesList = localMixes[track.id] || track.mixes;
            const guildId = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID || '';
            const discordThreadUrl = track.discord_thread_id && guildId
              ? `https://discord.com/channels/${guildId}/${track.discord_thread_id}`
              : null;

            return (
              <div
                key={track.id}
                className="bg-[#2b2d31] border border-[#1f2023] border-l-4 border-l-[#5865F2] p-5 rounded space-y-4 shadow-sm"
              >
                {/* Track Info Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1f2023] pb-3">
                  <div>
                    <h3 className="text-base font-bold text-[#f2f3f5]">{track.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#949ba4] mt-0.5">
                      <span className="text-[#dbdee1] font-medium">{track.artist}</span>
                      {track.bpm && <span>• {track.bpm} BPM</span>}
                      {track.key && <span>• Key: {track.key}</span>}
                      {track.track_count && <span>• {track.track_count} Stems</span>}
                      {track.daw_template_url && (
                        <span className="text-[10px] text-[#23a55a] bg-[#23a55a]/10 border border-[#23a55a]/30 px-1.5 py-0.2 rounded font-medium flex items-center gap-1">
                          <Layers className="w-3 h-3" /> DAW Template
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {discordThreadUrl && (
                      <a
                        href={discordThreadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#1e1f22] hover:bg-[#35373c] text-[#5865F2] border border-[#1f2023] text-xs font-medium px-3 py-1.5 rounded transition-colors flex items-center gap-1.5"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Discord Thread</span>
                      </a>
                    )}
                    <Link
                      href={`/stems/${track.id}`}
                      className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Get Stems & Mix</span>
                    </Link>
                  </div>
                </div>

                {/* Community Mixes for this Session */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#949ba4] block">
                    Community Mixes ({mixesList.length})
                  </span>

                  {mixesList.length === 0 ? (
                    <div className="bg-[#1e1f22] border border-[#1f2023] p-4 rounded text-center text-xs text-[#949ba4] space-y-1">
                      <p>No community mixes submitted yet for this pack.</p>
                      <Link href={`/stems/${track.id}?action=submit`} className="text-xs text-[#5865F2] hover:underline font-medium inline-block">
                        Submit the first mix →
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {mixesList.map(mix => (
                        <article
                          key={mix.id}
                          className="bg-[#1e1f22] border border-[#1f2023] p-3 rounded flex flex-col justify-between space-y-2 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-start justify-between gap-1">
                              <h5 className="font-semibold text-[#f2f3f5] truncate">
                                {mix.song_name || mix.title}
                              </h5>
                              <button
                                onClick={() => handleLike(mix.id, track.id)}
                                disabled={likingMap[mix.id]}
                                className="flex items-center gap-1 text-[11px] bg-[#2b2d31] hover:bg-[#35373c] border border-[#3f4147] text-[#dbdee1] px-1.5 py-0.5 rounded shrink-0 transition-colors"
                              >
                                <Heart className="w-3 h-3 fill-[#5865F2] text-[#5865F2]" />
                                <span>{mix.likes_count}</span>
                              </button>
                            </div>

                            <p className="text-[11px] text-[#949ba4]">
                              by{' '}
                              <Link
                                href={`/user/${encodeURIComponent(mix.user_handle.replace(/^@/, ''))}`}
                                className="text-[#dbdee1] hover:text-[#5865F2] hover:underline font-medium"
                              >
                                {mix.user_handle}
                              </Link>
                            </p>

                            {(mix.musical_key || mix.bpm) && (
                              <p className="text-[10px] text-[#80848e] font-mono">
                                {mix.musical_key && <span>Key: {mix.musical_key}</span>}
                                {mix.bpm && <span> • {mix.bpm} BPM</span>}
                              </p>
                            )}

                            {mix.description && (
                              <p className="text-[11px] text-[#949ba4] line-clamp-2 bg-[#2b2d31] p-1.5 rounded">
                                {mix.description}
                              </p>
                            )}
                          </div>

                          <div className="pt-1.5 border-t border-[#232428] flex items-center justify-between">
                            <a
                              href={mix.mix_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-[#5865F2] hover:underline font-medium flex items-center gap-1"
                            >
                              <span>Listen</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                            {discordThreadUrl && (
                              <a
                                href={discordThreadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Critique in Discord thread"
                                className="text-[#949ba4] hover:text-[#5865F2] p-1"
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
                  <div className="pt-2 border-t border-[#1f2023] text-xs text-[#949ba4] space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#80848e]">Recent Notes:</span>
                    {track.comments.slice(0, 1).map((c: StemComment) => (
                      <p key={c.id} className="truncate">
                        <strong className="text-[#f2f3f5]">{c.user_handle}:</strong> {c.content}
                      </p>
                    ))}
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
