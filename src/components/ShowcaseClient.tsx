'use client';

import { useState } from 'react';
import { ExternalLink, Heart, Layers, Search, MessageCircle } from 'lucide-react';
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
      (m.song_name && m.song_name.toLowerCase().includes(q)) ||
      m.user_handle.toLowerCase().includes(q) ||
      (m.description && m.description.toLowerCase().includes(q))
    );
    return matchesTrack || matchesMixes;
  });

  const sortedTracks = [...filteredTracks].sort((a, b) => b.mixes.length - a.mixes.length);
  const totalMixes = tracks.reduce((sum, t) => sum + t.mixes.length, 0);

  const handleLike = async (mixId: string, stemId: string) => {
    if (!user) {
      addToast('Please connect to like mixes.', 'info');
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

      {/* Search & Header Stats */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#121212] border border-neutral-800/80 p-4 rounded-lg shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by song, artist, mixer..."
            className="w-full bg-[#0d0d0e] border border-neutral-800 rounded pl-8 pr-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-neutral-400 font-mono">
          <span className="bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded">
            <strong className="text-white">{totalMixes}</strong> Mixes
          </span>
          <span className="bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded">
            <strong className="text-white">{tracks.length}</strong> Sessions
          </span>
        </div>
      </div>

      {/* Track Feed Grid */}
      {sortedTracks.length === 0 ? (
        <div className="bg-[#121212] border border-neutral-800/80 p-12 text-center rounded-lg text-xs text-neutral-400 space-y-1">
          <p className="text-sm font-semibold text-white">No mixes found</p>
          <p>Try searching for a different song or artist name.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {sortedTracks.map(track => {
            const mixesList = localMixes[track.id] || track.mixes;
            const guildId = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID || '';
            const discordThreadUrl = track.discord_thread_id && guildId
              ? `https://discord.com/channels/${guildId}/${track.discord_thread_id}`
              : null;

            return (
              <div
                key={track.id}
                className="bg-[#121212] border border-neutral-800/80 p-5 rounded-lg space-y-4 shadow-xs"
              >
                {/* Track Info Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800/80 pb-3">
                  <div>
                    <h3 className="text-base font-semibold text-white">{track.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 mt-0.5">
                      <span className="text-neutral-300 font-medium">{track.artist}</span>
                      {track.bpm && <span>• {track.bpm} BPM</span>}
                      {track.key && <span>• Key {track.key}</span>}
                      {track.track_count && <span>• {track.track_count} Stems</span>}
                      {track.daw_template_url && (
                        <span className="text-[10px] font-mono text-neutral-300 bg-neutral-900 border border-neutral-800 px-1.5 py-0.2 rounded flex items-center gap-1">
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
                        className="bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-xs font-medium px-3 py-1.5 rounded transition-colors flex items-center gap-1.5"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Discord Thread</span>
                      </a>
                    )}
                    <Link
                      href={`/stems/${track.id}`}
                      className="bg-white hover:bg-neutral-200 text-black text-xs font-semibold px-3 py-1.5 rounded transition-colors"
                    >
                      View Session
                    </Link>
                  </div>
                </div>

                {/* Mixes List */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                      Community Mixes ({mixesList.length})
                    </span>
                  </div>

                  {mixesList.length === 0 ? (
                    <div className="bg-[#0d0d0e] border border-neutral-800/60 p-4 rounded text-center text-xs text-neutral-400">
                      No mixes posted yet for this session.{' '}
                      <Link href={`/stems/${track.id}?action=submit`} className="text-neutral-300 hover:underline">
                        Be the first to submit a mix.
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {mixesList.map(mix => (
                        <article
                          key={mix.id}
                          className="bg-[#0d0d0e] border border-neutral-800/80 p-3.5 rounded-md flex flex-col justify-between space-y-2.5"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="text-xs font-semibold text-white">
                                  {mix.song_name || mix.title}
                                </h4>
                                <p className="text-[11px] text-neutral-400">
                                  Mixed by <strong className="text-neutral-300">{mix.user_handle}</strong>
                                </p>
                              </div>

                              <button
                                onClick={() => handleLike(mix.id, track.id)}
                                disabled={likingMap[mix.id]}
                                className="flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 text-[11px] transition-colors"
                              >
                                <Heart className="w-3 h-3 text-neutral-400" />
                                <span>{mix.likes_count}</span>
                              </button>
                            </div>

                            <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono mt-1.5">
                              {mix.musical_key && (
                                <span className="bg-neutral-900 border border-neutral-800 px-1.5 py-0.2 rounded">
                                  Key: {mix.musical_key}
                                </span>
                              )}
                              {mix.bpm && (
                                <span className="bg-neutral-900 border border-neutral-800 px-1.5 py-0.2 rounded">
                                  {mix.bpm} BPM
                                </span>
                              )}
                            </div>

                            {mix.description && (
                              <p className="text-[11px] text-neutral-400 mt-2 line-clamp-2 leading-relaxed bg-[#121212] p-2 rounded border border-neutral-800/60 font-mono text-[10px]">
                                {mix.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-800/60">
                            <a
                              href={mix.mix_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-semibold text-white hover:text-neutral-300 transition-colors flex items-center gap-1.5"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Listen to Mix</span>
                            </a>

                            {discordThreadUrl && (
                              <a
                                href={discordThreadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Critique in Discord thread"
                                className="text-neutral-500 hover:text-white p-1"
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
                  <div className="pt-2 border-t border-neutral-800/80 text-xs text-neutral-400 space-y-1">
                    <span className="text-[10px] uppercase font-mono text-neutral-400">Recent Session Notes</span>
                    {track.comments.slice(0, 1).map((c: StemComment) => (
                      <p key={c.id} className="truncate">
                        <strong className="text-neutral-300">{c.user_handle}:</strong> {c.content}
                      </p>
                    ))}
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 pt-6 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <span className="text-white font-medium">The Mixing Vault</span>
          <span>•</span>
          <span>Tyler Kerpsack All Access</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          <span>•</span>
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          <span>•</span>
          <Link href="/dmca" className="hover:text-white transition-colors">DMCA</Link>
        </div>
      </footer>

    </div>
  );
}
