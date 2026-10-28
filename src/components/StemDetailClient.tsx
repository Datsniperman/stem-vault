'use client';

import { useState, useEffect } from 'react';
import {
  Star,
  MessageSquare,
  Music2,
  Heart,
  Send,
  Plus,
  ExternalLink,
  Download,
  Flag,
  Check,
  Music,
  Calendar,
  User,
  HardDrive,
  Layers,
  FileAudio,
  ArrowLeft,
  Trash2,
  Edit3,
  MessageCircle,
  CheckCircle2,
  X,
  Hash,
} from 'lucide-react';
import Link from 'next/link';
import { Stem, Profile, StemComment, StemMix } from '@/types';
import { rateStem, addComment, submitMix, toggleMixLike, flagStem, deleteComment, incrementDownloadCount } from '@/app/actions/stems';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/Header';
import { clsx } from 'clsx';
import { EditStemModal } from './EditStemModal';
import { AuthModal } from './AuthModal';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

interface StemDetailClientProps {
  stem: Stem;
  profile: Profile | null;
  initialComments: StemComment[];
  initialMixes: StemMix[];
  initialAvgRating: number;
  initialUserRating: number;
  initialRatingCount: number;
}

export function StemDetailClient({
  stem,
  profile: serverProfile,
  initialComments,
  initialMixes,
  initialAvgRating,
  initialUserRating,
  initialRatingCount,
}: StemDetailClientProps) {
  const { addToast } = useToast();
  const { user: clientUser, profile: clientProfile, accessToken } = useAuth();
  const profile = clientProfile || serverProfile;
  const user = clientUser || (profile ? { id: profile.id, email: profile.email } : null);

  const userHandle = profile?.display_name
    ? `@${profile.display_name}`
    : profile?.email
    ? `@${profile.email.split('@')[0]}`
    : clientUser?.email
    ? `@${clientUser.email.split('@')[0]}`
    : 'Anonymous';

  // Ratings State
  const [avgRating, setAvgRating] = useState(initialAvgRating);
  const [userRating, setUserRating] = useState(initialUserRating);
  const [ratingCount, setRatingCount] = useState(initialRatingCount);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingLoading, setRatingLoading] = useState(false);

  // Comments State
  const [comments, setComments] = useState<StemComment[]>(initialComments);
  const [commentInput, setCommentInput] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  // Mixes State
  const [mixes, setMixes] = useState<StemMix[]>(initialMixes);
  const [showMixForm, setShowMixForm] = useState(false);
  const [songName, setSongName] = useState(stem.title || '');
  const [musicalKey, setMusicalKey] = useState(stem.key || '');
  const [bpmInput, setBpmInput] = useState(stem.bpm ? String(stem.bpm) : '');
  const [mixUrl, setMixUrl] = useState('');
  const [mixNotes, setMixNotes] = useState('');
  const [mixLoading, setMixLoading] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [mixSuccessData, setMixSuccessData] = useState<{
    isOpen: boolean;
    mixTitle: string;
    discordThreadUrl?: string | null;
  } | null>(null);

  // Check URL query param ?action=submit to auto-open mix form
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('action') === 'submit') {
        setShowMixForm(true);
        const el = document.getElementById('mixes-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  // Stem local state & Edit Modal
  const [stemData, setStemData] = useState<Stem>(stem);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Status & Local state
  const [reporting, setReporting] = useState(false);
  const [localVerified, setLocalVerified] = useState(stem.is_verified);

  const isAdmin = profile?.role === 'admin';
  const isOwner = user?.id && user.id === stemData.user_id;
  const canEdit = isOwner || isAdmin;

  const formattedDate = new Date(stemData.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Handle Star Rating
  const handleRate = async (star: number) => {
    if (!user) {
      addToast('Please sign in with Discord to rate this session.', 'info');
      return;
    }
    setRatingLoading(true);
    const res = await rateStem(stem.id, star, accessToken || undefined);
    if (res.success) {
      addToast('Thank you for rating!', 'success');
      const oldUserRating = userRating;
      setUserRating(star);
      if (oldUserRating === 0) {
        const newCount = ratingCount + 1;
        setRatingCount(newCount);
        setAvgRating(parseFloat(((avgRating * ratingCount + star) / newCount).toFixed(1)));
      } else {
        setAvgRating(parseFloat(((avgRating * ratingCount - oldUserRating + star) / ratingCount).toFixed(1)));
      }
    } else {
      addToast(res.message, 'error');
    }
    setRatingLoading(false);
  };

  // Handle New Comment
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      addToast('Please sign in to comment.', 'info');
      return;
    }
    if (!commentInput.trim()) return;

    setCommentLoading(true);
    const res = await addComment(stem.id, commentInput, accessToken || undefined);
    if (res.success) {
      addToast('Comment posted.', 'success');
      setComments(prev => [
        {
          id: String(Date.now()),
          stem_id: stem.id,
          user_id: user.id,
          user_handle: userHandle,
          content: commentInput.trim(),
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      setCommentInput('');
    } else {
      addToast(res.message, 'error');
    }
    setCommentLoading(false);
  };

  // Handle New Mix Submission
  const handleMixSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      addToast('Please log in with Discord to submit a mix.', 'info');
      setAuthModalOpen(true);
      return;
    }

    const parsedBpm = parseFloat(bpmInput);
    if (!songName.trim()) {
      addToast('Song name is required.', 'error');
      return;
    }
    if (!musicalKey.trim()) {
      addToast('Musical key is required.', 'error');
      return;
    }
    if (isNaN(parsedBpm) || parsedBpm <= 0) {
      addToast('Please enter a valid BPM.', 'error');
      return;
    }
    if (!mixUrl.trim()) {
      addToast('Cloud mix URL is required.', 'error');
      return;
    }

    setMixLoading(true);
    try {
      const res = await submitMix({
        stemId: stem.id,
        songName: songName.trim(),
        key: musicalKey.trim(),
        bpm: parsedBpm,
        mixUrl: mixUrl.trim(),
        notes: mixNotes.trim() || undefined,
        accessToken: accessToken || undefined,
      });

      if (res.success) {
        addToast('Mix posted to showcase & Discord thread!', 'success');
        const submittedTitle = `${songName.trim()} (${musicalKey.trim()} @ ${parsedBpm} BPM)`;
        setMixes(prev => [
          {
            id: res.mixId || String(Date.now()),
            stem_id: stem.id,
            user_id: user.id,
            user_handle: profile?.server_display_name || userHandle,
            title: submittedTitle,
            song_name: songName.trim(),
            musical_key: musicalKey.trim(),
            bpm: parsedBpm,
            mix_url: mixUrl.trim(),
            description: mixNotes.trim() || null,
            likes_count: 0,
            user_has_liked: false,
            discord_post_id: res.discordPostId || null,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);

        const guildId = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID || '';
        const threadId = stemData.discord_thread_id;
        const threadUrl = threadId && guildId
          ? `https://discord.com/channels/${guildId}/${threadId}`
          : null;

        setMixSuccessData({
          isOpen: true,
          mixTitle: submittedTitle,
          discordThreadUrl: threadUrl,
        });

        setMixUrl('');
        setMixNotes('');
        setShowMixForm(false);
      } else {
        addToast(res.message, 'error');
      }
    } catch (err: any) {
      addToast(err?.message || 'Failed to submit mix.', 'error');
    } finally {
      setMixLoading(false);
    }
  };

  const handleLikeMix = async (mixId: string) => {
    if (!user) {
      addToast('Please sign in to like a mix.', 'info');
      return;
    }
    const res = await toggleMixLike(mixId, stem.id, accessToken || undefined);
    if (res.success) {
      setMixes(prev =>
        prev.map(m => {
          if (m.id === mixId) {
            const newCount = res.liked ? m.likes_count + 1 : Math.max(0, m.likes_count - 1);
            return { ...m, likes_count: newCount, user_has_liked: res.liked };
          }
          return m;
        })
      );
    } else {
      addToast(res.message, 'error');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const res = await deleteComment(commentId, stem.id);
    if (res.success) {
      addToast('Comment deleted.', 'info');
      setComments(prev => prev.filter(c => c.id !== commentId));
    } else {
      addToast(res.message, 'error');
    }
  };

  const handleReport = async () => {
    setReporting(true);
    const result = await flagStem(stemData.id);
    addToast(
      result.success ? 'Session reported.' : result.message,
      result.success ? 'info' : 'error'
    );
    setReporting(false);
  };

  const handleDownload = () => {
    incrementDownloadCount(stemData.id).catch(() => {});
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#313338] text-[#dbdee1] pb-16">
      <Header />

      {/* Top Channel Breadcrumb */}
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 pt-5 pb-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-[#949ba4] hover:text-[#f2f3f5] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to multitracks</span>
        </Link>
      </div>

      {/* Main Forum Post Card (Discord Embed style) */}
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6">
        <div className="bg-[#2b2d31] border border-[#1f2023] border-l-4 border-l-[#5865F2] rounded p-6 sm:p-8 space-y-6 shadow-sm">

          {/* Header Row */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-medium px-2.5 py-0.5 rounded bg-[#1e1f22] text-[#949ba4] border border-[#1f2023]">
                  {stem.host_platform}
                </span>
                {localVerified && (
                  <span className="text-[11px] font-semibold text-[#23a55a] bg-[#23a55a]/10 border border-[#23a55a]/30 px-2 py-0.5 rounded flex items-center gap-1">
                    <Check className="w-3 h-3 stroke-[3]" /> PRO SESSION
                  </span>
                )}
                {stemData.daw_template_url && (
                  <span className="text-[11px] font-medium text-[#5865F2] bg-[#5865F2]/10 border border-[#5865F2]/25 px-2 py-0.5 rounded flex items-center gap-1">
                    <Layers className="w-3 h-3" /> DAW Template Included
                  </span>
                )}
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1.5 text-xs bg-[#1e1f22] border border-[#1f2023] px-2.5 py-1 rounded">
                <Star className="w-3.5 h-3.5 fill-[#f0b232] text-[#f0b232]" />
                <span className="font-semibold text-[#f2f3f5]">{avgRating > 0 ? avgRating : 'New'}</span>
                <span className="text-[#949ba4]">({ratingCount})</span>
              </div>
            </div>

            {/* Title & Artist */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#f2f3f5] tracking-tight">
                {stem.title}
              </h1>
              <p className="text-sm font-medium text-[#949ba4] mt-0.5">{stem.artist}</p>
            </div>

            {/* Submitter & Date */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#949ba4] pt-1">
              <span>
                Uploaded by{' '}
                <Link
                  href={`/user/${encodeURIComponent(stem.uploader_handle.replace(/^@/, ''))}`}
                  className="text-[#f2f3f5] font-medium hover:text-[#5865F2] hover:underline"
                >
                  {stem.uploader_handle}
                </Link>
              </span>
              <span>•</span>
              <span>{formattedDate}</span>
            </div>

            {/* Primary Action Buttons (Discord styled) */}
            <div className="pt-3 flex flex-wrap items-center gap-2.5">
              <a
                href={stemData.download_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleDownload}
                className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-semibold px-4 py-2 rounded transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Stems ({stemData.host_platform})</span>
                <ExternalLink className="w-3 h-3 opacity-75" />
              </a>

              {stemData.daw_template_url && (
                <a
                  href={stemData.daw_template_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#23a55a]/15 text-[#23a55a] border border-[#23a55a]/30 hover:bg-[#23a55a]/25 text-xs font-semibold px-3.5 py-2 rounded transition-colors flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Download DAW Template</span>
                  <ExternalLink className="w-3 h-3 opacity-75" />
                </a>
              )}

              {stemData.discord_thread_id && (
                <a
                  href={`https://discord.com/channels/${process.env.NEXT_PUBLIC_DISCORD_GUILD_ID || ''}/${stemData.discord_thread_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#1e1f22] hover:bg-[#35373c] text-[#5865F2] border border-[#1f2023] text-xs font-semibold px-3.5 py-2 rounded transition-colors flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Discord Feedback Thread</span>
                  <ExternalLink className="w-3 h-3 opacity-75" />
                </a>
              )}

              {canEdit && (
                <button
                  onClick={() => setIsEditOpen(true)}
                  className="bg-[#1e1f22] hover:bg-[#35373c] text-[#dbdee1] border border-[#1f2023] text-xs font-medium px-3 py-2 rounded transition-colors flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              )}

              <button
                onClick={handleReport}
                disabled={reporting}
                className="text-xs text-[#949ba4] hover:text-[#f23f43] p-2 transition-colors disabled:opacity-40"
                title="Report dead link"
              >
                <Flag className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <EditStemModal
            isOpen={isEditOpen}
            stem={stemData}
            onClose={() => setIsEditOpen(false)}
            onStemUpdated={(updated) => setStemData(updated)}
          />

          {/* Technical Specs Grid (Discord Embed Fields) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            <SpecField label="TEMPO" value={stem.bpm ? `${stem.bpm} BPM` : 'Unspecified'} />
            <SpecField label="KEY" value={stem.key || 'Unspecified'} />
            <SpecField label="CHANNELS" value={stem.track_count ? `${stem.track_count} Tracks` : 'Unspecified'} />
            <SpecField label="FORMAT" value={stem.format} />
          </div>

          {/* Tags */}
          {(stem.tags || []).length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
              <span className="text-[#949ba4]">Tags:</span>
              {(stem.tags || []).map(tag => (
                <span key={tag} className="text-[#80848e] bg-[#1e1f22] border border-[#1f2023] px-2 py-0.5 rounded font-mono text-[11px]">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {stem.description && (
            <div className="bg-[#1e1f22] border border-[#1f2023] p-4 rounded space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#949ba4] tracking-wider block">Session Details:</span>
              <p className="text-xs text-[#dbdee1] leading-relaxed whitespace-pre-wrap">{stem.description}</p>
            </div>
          )}

          {/* Star Rating Section */}
          <div className="bg-[#1e1f22] border border-[#1f2023] p-3.5 rounded flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-[#f2f3f5]">Rate Multitrack Quality</p>
              <p className="text-[11px] text-[#949ba4]">Help members find clean, high-grade live multitracks.</p>
            </div>

            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  disabled={ratingLoading}
                  onClick={() => handleRate(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 hover:scale-110 transition-transform focus:outline-none disabled:opacity-50"
                  title={`Rate ${star} star`}
                >
                  <Star
                    className={clsx(
                      'w-4 h-4 transition-colors',
                      (hoverRating || userRating) >= star
                        ? 'fill-[#f0b232] text-[#f0b232]'
                        : 'text-[#4e5058] hover:text-[#f0b232]/50'
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Dual Column: Community Mix Showcase & Member Discussions */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">

        {/* Community Mixes */}
        <section id="mixes-section" className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#1f2023]">
            <div className="flex items-center gap-2">
              <Music2 className="w-4 h-4 text-[#5865F2]" />
              <h2 className="text-sm font-semibold text-[#f2f3f5]">Community Mixes</h2>
              <span className="text-[10px] bg-[#1e1f22] text-[#949ba4] px-1.5 py-0.2 rounded font-mono">
                {mixes.length}
              </span>
            </div>

            <button
              onClick={() => setShowMixForm(s => !s)}
              className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs px-2.5 py-1 rounded transition-colors flex items-center gap-1 font-medium"
            >
              <Plus className="w-3 h-3" />
              <span>Submit Mix</span>
            </button>
          </div>

          {/* Mix Submission Form */}
          {showMixForm && (
            <div className="bg-[#2b2d31] border border-[#5865F2]/40 p-4 rounded space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#1f2023]">
                <h3 className="text-xs font-semibold text-[#f2f3f5] flex items-center gap-1.5">
                  <Music2 className="w-3.5 h-3.5 text-[#5865F2]" />
                  <span>Post Mix for Discord Critique</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowMixForm(false)}
                  className="text-[#949ba4] hover:text-[#f2f3f5] p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {!user ? (
                <div className="p-3 bg-[#1e1f22] border border-[#1f2023] rounded space-y-2">
                  <p className="text-xs text-[#949ba4]">
                    Log in with your Discord account to post your mix to the community and Discord feedback thread.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const supabase = getSupabaseBrowserClient();
                      if (supabase) {
                        supabase.auth.signInWithOAuth({
                          provider: 'discord',
                          options: {
                            scopes: 'identify guilds guilds.members.read',
                            redirectTo: window.location.href,
                          },
                        });
                      } else {
                        setAuthModalOpen(true);
                      }
                    }}
                    className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-medium px-3 py-1.5 rounded transition-colors"
                  >
                    Connect Discord
                  </button>
                </div>
              ) : (
                <form onSubmit={handleMixSubmit} className="space-y-3 text-xs">
                  <div className="bg-[#1e1f22] px-2.5 py-1.5 rounded flex items-center justify-between text-[11px] text-[#949ba4]">
                    <span>Posting as: <strong className="text-[#f2f3f5]">{profile?.server_display_name || userHandle}</strong></span>
                    <span className="text-[#23a55a] font-medium">● Verified</span>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#949ba4] mb-1 font-medium">Song Name *</label>
                    <input
                      type="text"
                      required
                      value={songName}
                      onChange={e => setSongName(e.target.value)}
                      placeholder="e.g. Goodness of God (Live Mix)"
                      className="w-full bg-[#1e1f22] border border-[#1f2023] rounded px-3 py-1.5 text-xs text-[#dbdee1] focus:outline-none focus:border-[#5865F2]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-[#949ba4] mb-1 font-medium">Key *</label>
                      <input
                        type="text"
                        required
                        value={musicalKey}
                        onChange={e => setMusicalKey(e.target.value)}
                        placeholder="e.g. C Major"
                        className="w-full bg-[#1e1f22] border border-[#1f2023] rounded px-3 py-1.5 text-xs text-[#dbdee1] focus:outline-none focus:border-[#5865F2]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#949ba4] mb-1 font-medium">BPM *</label>
                      <input
                        type="number"
                        required
                        min={30}
                        max={300}
                        value={bpmInput}
                        onChange={e => setBpmInput(e.target.value)}
                        placeholder="72"
                        className="w-full bg-[#1e1f22] border border-[#1f2023] rounded px-3 py-1.5 text-xs text-[#dbdee1] focus:outline-none focus:border-[#5865F2]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#949ba4] mb-1 font-medium">Cloud Mix Link (Drive, Dropbox) *</label>
                    <input
                      type="url"
                      required
                      value={mixUrl}
                      onChange={e => setMixUrl(e.target.value)}
                      placeholder="https://drive.google.com/..."
                      className="w-full bg-[#1e1f22] border border-[#1f2023] rounded px-3 py-1.5 text-xs text-[#dbdee1] focus:outline-none focus:border-[#5865F2]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#949ba4] mb-1 font-medium">Mix Notes / Signal Chain (Optional)</label>
                    <textarea
                      value={mixNotes}
                      onChange={e => setMixNotes(e.target.value)}
                      rows={2}
                      placeholder="Console, DAW, bus processing, questions..."
                      className="w-full bg-[#1e1f22] border border-[#1f2023] rounded px-3 py-1.5 text-xs text-[#dbdee1] focus:outline-none focus:border-[#5865F2] resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowMixForm(false)}
                      className="px-2.5 py-1 text-xs text-[#949ba4] hover:text-[#f2f3f5]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={mixLoading}
                      className="bg-[#5865F2] hover:bg-[#4752C4] disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded font-medium flex items-center gap-1.5"
                    >
                      {mixLoading ? 'Posting…' : 'Submit Mix & Post to Discord'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Mixes List */}
          {mixes.length === 0 ? (
            <div className="bg-[#2b2d31] border border-[#1f2023] p-6 text-center rounded text-xs text-[#949ba4]">
              No mixes submitted yet for this session.
            </div>
          ) : (
            <div className="space-y-2">
              {mixes.map(mix => (
                <div key={mix.id} className="bg-[#2b2d31] border border-[#1f2023] p-3.5 rounded space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-semibold text-[#f2f3f5]">{mix.title}</h4>
                      <p className="text-[11px] text-[#949ba4]">by {mix.user_handle}</p>
                    </div>

                    <button
                      onClick={() => handleLikeMix(mix.id)}
                      className={clsx(
                        'flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border transition-colors',
                        mix.user_has_liked
                          ? 'bg-[#5865F2]/15 border-[#5865F2]/40 text-[#5865F2] font-semibold'
                          : 'bg-[#1e1f22] border-[#1f2023] text-[#949ba4] hover:text-[#dbdee1]'
                      )}
                    >
                      <Heart className={clsx('w-3 h-3', mix.user_has_liked && 'fill-[#5865F2] text-[#5865F2]')} />
                      <span>{mix.likes_count}</span>
                    </button>
                  </div>

                  {mix.description && (
                    <p className="text-[11px] text-[#dbdee1] bg-[#1e1f22] p-2 rounded">{mix.description}</p>
                  )}

                  <a
                    href={mix.mix_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[#5865F2] hover:underline font-medium"
                  >
                    <span>Listen to Mix</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Member Discussions & Comments */}
        <section className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#1f2023]">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#80848e]" />
              <h2 className="text-sm font-semibold text-[#f2f3f5]">Notes & Discussion</h2>
              <span className="text-[10px] bg-[#1e1f22] text-[#949ba4] px-1.5 py-0.2 rounded font-mono">
                {comments.length}
              </span>
            </div>
          </div>

          {/* Comment Stream */}
          {comments.length === 0 ? (
            <div className="bg-[#2b2d31] border border-[#1f2023] p-6 text-center rounded text-xs text-[#949ba4]">
              No notes posted yet.
            </div>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {comments.map(c => {
                const canDelete = isAdmin || (profile && profile.id === c.user_id);
                return (
                  <div key={c.id} className="bg-[#2b2d31] border border-[#1f2023] p-3 rounded space-y-1 group text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/user/${encodeURIComponent(c.user_handle.replace(/^@/, ''))}`}
                          className="font-semibold text-[#f2f3f5] hover:text-[#5865F2] hover:underline"
                        >
                          {c.user_handle}
                        </Link>
                        <span className="text-[10px] text-[#80848e]">{getTimeAgo(c.created_at)}</span>
                      </div>
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          title="Delete note"
                          className="opacity-0 group-hover:opacity-100 p-1 text-[#80848e] hover:text-[#f23f43] transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-[#dbdee1] leading-relaxed">{c.content}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* New Comment Input (Discord message bar style) */}
          <form onSubmit={handleCommentSubmit} className="flex gap-2 pt-1">
            <input
              type="text"
              value={commentInput}
              onChange={e => setCommentInput(e.target.value)}
              placeholder={user ? "Message #session-notes..." : "Connect Discord to message..."}
              disabled={!user || commentLoading}
              className="flex-1 bg-[#1e1f22] border border-[#1f2023] rounded px-3 py-2 text-xs text-[#dbdee1] focus:outline-none focus:border-[#5865F2] placeholder-[#80848e] disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!user || commentLoading || !commentInput.trim()}
              className="bg-[#5865F2] hover:bg-[#4752C4] disabled:opacity-40 text-white p-2 rounded transition-colors shrink-0"
              title="Post note"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </section>

      </div>

      {/* Mix Submission Success Modal */}
      {mixSuccessData?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-[fade-in_0.15s_ease-out]">
          <div className="bg-[#313338] border border-[#1f2023] rounded-lg w-full max-w-md shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#23a55a]/15 border border-[#23a55a]/30 flex items-center justify-center mx-auto text-[#23a55a]">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-[#f2f3f5]">Mix Posted to Discord!</h3>
              <p className="text-xs text-[#949ba4] leading-relaxed">
                Your mix <strong className="text-[#f2f3f5]">{mixSuccessData.mixTitle}</strong> has been shared to the Discord multitrack thread for peer critique.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
              {mixSuccessData.discordThreadUrl && (
                <a
                  href={mixSuccessData.discordThreadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-semibold py-2 px-4 rounded transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Discord Thread</span>
                </a>
              )}
              <button
                onClick={() => setMixSuccessData(null)}
                className="bg-[#2b2d31] hover:bg-[#35373c] text-[#dbdee1] text-xs py-2 px-4 rounded transition-colors border border-[#1f2023]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 pt-6 border-t border-[#1f2023] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#949ba4]">
        <div className="flex items-center gap-2">
          <span className="text-[#f2f3f5] font-semibold">The Mixing Vault</span>
          <span>•</span>
          <span>Tyler Kerpsack All Access</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/terms" className="hover:text-[#f2f3f5] hover:underline">Terms</Link>
          <span>•</span>
          <Link href="/privacy" className="hover:text-[#f2f3f5] hover:underline">Privacy</Link>
          <span>•</span>
          <Link href="/dmca" className="hover:text-[#f2f3f5] hover:underline">DMCA</Link>
        </div>
      </footer>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

    </div>
  );
}

function SpecField({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#1e1f22] border border-[#1f2023] p-2.5 rounded space-y-0.5">
      <span className="text-[10px] text-[#949ba4] uppercase font-bold block">{label}</span>
      <p className="text-xs font-semibold text-[#f2f3f5] truncate">{value}</p>
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
