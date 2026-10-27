'use client';

import { useState, useEffect } from 'react';
import {
  Star,
  MessageSquare,
  Music2,
  Heart,
  Send,
  PlusCircle,
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
  Tag,
  Edit3,
  MessageCircle,
  CheckCircle2,
  X,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { Stem, Profile, StemComment, StemMix } from '@/types';
import { rateStem, addComment, submitMix, toggleMixLike, flagStem, deleteStem, deleteComment, incrementDownloadCount } from '@/app/actions/stems';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/Header';
import { clsx } from 'clsx';
import { AdminBar } from './AdminBar';
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
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Handle Star Rating
  const handleRate = async (star: number) => {
    if (!user) {
      addToast('Please sign in to rate this stem session.', 'info');
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
        addToast('Mix submitted to the showcase & Discord!', 'success');
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

  // Handle Like on Mix
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

  // Handle Delete Comment
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
      result.success ? 'Session reported. Thanks for keeping the vault clean.' : result.message,
      result.success ? 'info' : 'error'
    );
    setReporting(false);
  };

  const handleDownload = () => {
    incrementDownloadCount(stemData.id).catch(() => {});
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface text-warm-white pb-16">
      <Header />

      {/* Top Breadcrumb & Navigation */}
      <div className="max-w-6xl mx-auto w-full px-5 sm:px-8 pt-8 pb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-dim hover:text-amber bg-surface-raised/80 hover:bg-surface-high border border-border/70 px-4 py-2 rounded-full transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Session Feed</span>
        </Link>
      </div>

      {/* Hero Workstation Card */}
      <div className="max-w-6xl mx-auto w-full px-5 sm:px-8">
        <div className="bg-surface-raised/90 border border-border/80 rounded-3xl p-6 sm:p-10 shadow-m3-2 space-y-8 backdrop-blur-md">

          {/* Header Row */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold px-3 py-1 rounded-full border border-border/80 bg-surface-high text-warm-white">
                  {stem.host_platform}
                </span>
                {localVerified && (
                  <span className="text-xs font-bold text-amber bg-amber/15 border border-amber/40 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 stroke-[3]" /> PRO SESSION
                  </span>
                )}
                {stemData.daw_template_url && (
                  <span className="text-xs font-semibold text-cyan-300 bg-cyan-950/60 border border-cyan-700/50 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" /> DAW TEMPLATE ATTACHED
                  </span>
                )}
              </div>

              {/* Rating Display */}
              <div className="flex items-center gap-2 bg-surface-high border border-border/70 px-3.5 py-1.5 rounded-full shadow-sm">
                <div className="flex items-center text-amber">
                  <Star className="w-4 h-4 fill-amber text-amber" />
                  <span className="ml-1.5 text-sm font-bold">{avgRating > 0 ? avgRating : 'New'}</span>
                </div>
                <span className="text-xs text-dim">({ratingCount} {ratingCount === 1 ? 'rating' : 'ratings'})</span>
              </div>
            </div>

            {/* Title & Artist */}
            <div>
              <h1 className="font-display text-3xl sm:text-5xl font-bold text-warm-white tracking-tight leading-tight">
                {stem.title}
              </h1>
              <p className="text-amber text-xl sm:text-2xl font-body font-semibold mt-1.5">{stem.artist}</p>
            </div>

            {/* Submitter & Date Chips */}
            <div className="flex flex-wrap gap-2 text-xs text-dim pt-1">
              <div className="flex items-center gap-1.5 bg-surface-high border border-border/60 px-3 py-1.5 rounded-full">
                <User className="w-3.5 h-3.5 text-amber" />
                <span>
                  Submitted by{' '}
                  <Link
                    href={`/user/${encodeURIComponent(stem.uploader_handle.replace(/^@/, ''))}`}
                    className="text-warm-white font-semibold hover:text-amber hover:underline transition-colors"
                  >
                    {stem.uploader_handle}
                  </Link>
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-surface-high border border-border/60 px-3 py-1.5 rounded-full">
                <Calendar className="w-3.5 h-3.5 text-amber" />
                <span>Added {formattedDate}</span>
              </div>
            </div>

            {/* Primary Action Buttons (M3 Filled & Tonal Pills) */}
            <div className="pt-4 flex flex-wrap items-center gap-3">
              <a
                href={stemData.download_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleDownload}
                className="flex items-center gap-2 bg-amber hover:bg-amber-muted text-obsidian font-bold text-sm px-6 py-3 rounded-full transition-all shadow-m3-1 hover:shadow-m3-2 active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Download Stems ({stemData.host_platform})</span>
                <ExternalLink className="w-4 h-4 opacity-75 ml-0.5" />
              </a>

              {stemData.daw_template_url && (
                <a
                  href={stemData.daw_template_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-cyan-950/70 border border-cyan-700/60 hover:bg-cyan-900/70 text-cyan-300 font-semibold text-sm px-5 py-3 rounded-full transition-all shadow-m3-1 hover:shadow-m3-2"
                >
                  <Layers className="w-4 h-4" />
                  <span>Download DAW Template</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>
              )}

              {stemData.discord_thread_id && (
                <a
                  href={`https://discord.com/channels/${process.env.NEXT_PUBLIC_DISCORD_GUILD_ID || ''}/${stemData.discord_thread_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold text-sm px-5 py-3 rounded-full transition-all shadow-m3-1 hover:shadow-m3-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Discord Feedback Thread</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>
              )}

              {canEdit && (
                <button
                  onClick={() => setIsEditOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-warm-white bg-surface-high border border-border/70 hover:border-amber hover:text-amber px-4 py-3 rounded-full transition-colors"
                >
                  <Edit3 className="w-4 h-4 text-amber" />
                  <span>Edit Session</span>
                </button>
              )}

              <button
                onClick={handleReport}
                disabled={reporting}
                className="flex items-center gap-1.5 text-xs text-dim hover:text-error border border-border/70 hover:border-error/50 px-4 py-3 rounded-full transition-colors disabled:opacity-40"
              >
                <Flag className="w-4 h-4" />
                <span>Report Dead Link</span>
              </button>
            </div>
          </div>

          <EditStemModal
            isOpen={isEditOpen}
            stem={stemData}
            onClose={() => setIsEditOpen(false)}
            onStemUpdated={(updated) => setStemData(updated)}
          />

          {/* Technical Specs Grid */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-mono uppercase tracking-wider text-amber font-semibold">
              Session Technical Specifications
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <SpecBox icon={<Music className="w-4 h-4 text-amber" />} label="Tempo" value={stem.bpm ? `${stem.bpm} BPM` : 'Unspecified'} />
              <SpecBox icon={<FileAudio className="w-4 h-4 text-amber" />} label="Musical Key" value={stem.key || 'Unspecified'} />
              <SpecBox icon={<Layers className="w-4 h-4 text-amber" />} label="Stem Count" value={stem.track_count ? `${stem.track_count} Tracks` : 'Unspecified'} />
              <SpecBox icon={<HardDrive className="w-4 h-4 text-amber" />} label="Format / Quality" value={stem.format} />
            </div>
          </div>

          {/* Tags */}
          {(stem.tags || []).length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-mono text-dim uppercase tracking-wider">Tags:</span>
              {(stem.tags || []).map(tag => (
                <span key={tag} className="text-xs font-medium text-mid bg-surface-high border border-border/60 px-3 py-1 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Special Notes */}
          {stem.description && (
            <div className="space-y-2 bg-surface-high/60 border border-border/70 p-5 rounded-2xl">
              <h3 className="text-xs font-mono uppercase tracking-wider text-amber font-semibold">
                Special Notes & Session Details
              </h3>
              <p className="text-sm font-body text-warm-white leading-relaxed whitespace-pre-wrap">
                {stem.description}
              </p>
            </div>
          )}

          {/* Rate This Stem Section */}
          <div className="bg-surface-high border border-border/70 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-warm-white">Rate Audio Quality & Session Mixability</h3>
              <p className="text-xs text-dim mt-0.5">Help community mixers identify clean, high-quality worship multitracks.</p>
            </div>

            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  disabled={ratingLoading}
                  onClick={() => handleRate(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1.5 rounded-full transition-transform hover:scale-110 focus:outline-none disabled:opacity-50 hover:bg-white/5"
                  title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                >
                  <Star
                    className={clsx(
                      'w-6 h-6 transition-colors',
                      (hoverRating || userRating) >= star
                        ? 'fill-amber text-amber'
                        : 'text-dim hover:text-amber/50'
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Dual Column: Community Mix Showcase & Member Discussions */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8 mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">

        {/* Community Mixes Showcase */}
        <section id="mixes-section" className="space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <Music2 className="w-5 h-5 text-amber" />
              <h2 className="font-display text-xl font-bold text-warm-white">Community Mixes</h2>
              <span className="text-xs bg-surface-high border border-border/70 text-dim px-2.5 py-0.5 rounded-full font-mono">
                {mixes.length}
              </span>
            </div>

            <button
              onClick={() => setShowMixForm(s => !s)}
              className="flex items-center gap-1.5 text-xs font-semibold bg-amber hover:bg-amber-muted text-obsidian px-4 py-2 rounded-full transition-all shadow-sm active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Share Your Mix</span>
            </button>
          </div>

          {/* Mix Submission Form */}
          {showMixForm && (
            <div className="bg-surface-high border border-amber/40 p-6 rounded-3xl space-y-4 shadow-m3-2 animate-[fade-in_0.2s_ease-out]">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <h3 className="text-xs font-mono uppercase text-amber font-semibold tracking-wider flex items-center gap-2">
                  <Music2 className="w-4 h-4" />
                  Post Your Mix for Discord & Community Feedback
                </h3>
                <button
                  type="button"
                  onClick={() => setShowMixForm(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-dim hover:text-warm-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {!user ? (
                <div className="p-5 bg-surface border border-border/80 rounded-2xl space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#5865F2]/15 border border-[#5865F2]/30 flex items-center justify-center shrink-0 text-[#5865F2]">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-warm-white">Discord Login Required</p>
                      <p className="text-xs text-dim mt-0.5 leading-relaxed">
                        You must be logged in with your Discord account to submit a mix. Your mix will be linked to your server nickname and automatically broadcasted to the Discord mix critique thread!
                      </p>
                    </div>
                  </div>
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
                    className="flex items-center justify-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-semibold px-5 py-2.5 rounded-full transition-all shadow-md active:scale-95"
                  >
                    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                    Log in via Discord
                  </button>
                </div>
              ) : (
                <form onSubmit={handleMixSubmit} className="space-y-4">
                  {/* Discord Member Identity Banner */}
                  <div className="bg-[#5865F2]/10 border border-[#5865F2]/30 px-3.5 py-2.5 rounded-2xl flex items-center justify-between text-xs font-body">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-warm-white font-medium">
                        Submitting as: <strong className="text-amber">{profile?.server_display_name || profile?.display_name || userHandle}</strong> (from Discord Server)
                      </span>
                    </div>
                    <span className="text-[10px] text-[#5865F2] font-semibold uppercase tracking-wider">Discord Verified</span>
                  </div>

                  {/* Song Name */}
                  <div className="space-y-1">
                    <label className="block text-xs text-mid font-medium">Song Name *</label>
                    <input
                      type="text"
                      required
                      value={songName}
                      onChange={e => setSongName(e.target.value)}
                      placeholder="e.g. Goodness of God (Live Mix)"
                      className="w-full bg-surface border border-border/80 rounded-xl px-3.5 py-2.5 text-sm text-warm-white focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber/40 placeholder:text-dim/50"
                    />
                  </div>

                  {/* Musical Key & BPM */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs text-mid font-medium">Musical Key *</label>
                      <input
                        type="text"
                        required
                        value={musicalKey}
                        onChange={e => setMusicalKey(e.target.value)}
                        placeholder="e.g. C Major, F#m, Ab"
                        className="w-full bg-surface border border-border/80 rounded-xl px-3.5 py-2.5 text-sm text-warm-white focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber/40 placeholder:text-dim/50"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs text-mid font-medium">BPM (Tempo) *</label>
                      <input
                        type="number"
                        required
                        min={30}
                        max={300}
                        value={bpmInput}
                        onChange={e => setBpmInput(e.target.value)}
                        placeholder="e.g. 72"
                        className="w-full bg-surface border border-border/80 rounded-xl px-3.5 py-2.5 text-sm text-warm-white focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber/40 placeholder:text-dim/50"
                      />
                    </div>
                  </div>

                  {/* Cloud Mix URL */}
                  <div className="space-y-1">
                    <label className="block text-xs text-mid font-medium">Cloud Mix URL (Google Drive, Dropbox, Box, OneDrive) *</label>
                    <input
                      type="url"
                      required
                      value={mixUrl}
                      onChange={e => setMixUrl(e.target.value)}
                      placeholder="https://drive.google.com/... or https://dropbox.com/..."
                      className="w-full bg-surface border border-border/80 rounded-xl px-3.5 py-2.5 text-sm text-warm-white focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber/40 placeholder:text-dim/50"
                    />
                  </div>

                  {/* Mix Notes */}
                  <div className="space-y-1">
                    <label className="block text-xs text-mid font-medium">Mix Notes / Signal Chain / Questions (Optional)</label>
                    <textarea
                      value={mixNotes}
                      onChange={e => setMixNotes(e.target.value)}
                      rows={2}
                      placeholder="Console/DAW used, master bus processing, questions for other mixers..."
                      className="w-full bg-surface border border-border/80 rounded-xl px-3.5 py-2.5 text-sm text-warm-white focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber/40 placeholder:text-dim/50 resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
                    <button
                      type="button"
                      onClick={() => setShowMixForm(false)}
                      className="px-4 py-2 text-xs text-dim hover:text-warm-white font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={mixLoading}
                      className="bg-amber hover:bg-amber-muted disabled:opacity-50 text-obsidian font-bold text-xs px-5 py-2.5 rounded-full transition-all flex items-center gap-2 shadow-m3-1 active:scale-95"
                    >
                      {mixLoading ? (
                        <span>Submitting to Discord…</span>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit Mix & Post to Discord</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Mixes List */}
          {mixes.length === 0 ? (
            <div className="bg-surface-raised/70 border border-border/70 p-8 text-center rounded-3xl space-y-2 shadow-m3-1">
              <p className="text-sm font-medium text-dim">No community mixes posted yet.</p>
              <p className="text-xs text-dim/70">Be the first engineer to share your mix from these stems!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mixes.map(mix => (
                <div key={mix.id} className="bg-surface-raised/80 border border-border/70 p-4 sm:p-5 rounded-2xl space-y-3 hover:border-amber/40 transition-all shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-display font-bold text-warm-white text-base leading-snug">{mix.title}</h4>
                      <p className="text-xs text-amber font-medium">by {mix.user_handle}</p>
                    </div>

                    <button
                      onClick={() => handleLikeMix(mix.id)}
                      className={clsx(
                        'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all shrink-0',
                        mix.user_has_liked
                          ? 'bg-amber/15 border-amber/40 text-amber font-bold shadow-sm'
                          : 'bg-surface-high border-border/70 text-dim hover:text-warm-white hover:border-border'
                      )}
                    >
                      <Heart className={clsx('w-3.5 h-3.5', mix.user_has_liked && 'fill-amber text-amber')} />
                      <span>{mix.likes_count}</span>
                    </button>
                  </div>

                  {mix.description && (
                    <p className="text-xs text-mid leading-relaxed bg-surface-high/60 border border-border/50 p-3 rounded-xl">{mix.description}</p>
                  )}

                  <div className="pt-1 flex items-center justify-between">
                    <a
                      href={mix.mix_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-amber hover:underline font-semibold"
                    >
                      <span>Listen to Mix</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Member Discussions & Comments */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber" />
              <h2 className="font-display text-xl font-bold text-warm-white">Member Comments</h2>
              <span className="text-xs bg-surface-high border border-border/70 text-dim px-2.5 py-0.5 rounded-full font-mono">
                {comments.length}
              </span>
            </div>
          </div>

          {/* New Comment Input */}
          <form onSubmit={handleCommentSubmit} className="flex gap-2">
            <input
              type="text"
              value={commentInput}
              onChange={e => setCommentInput(e.target.value)}
              placeholder={user ? "Add a comment or production feedback..." : "Sign in to leave a comment"}
              disabled={!user || commentLoading}
              className="flex-1 bg-surface-raised/80 border border-border/80 rounded-full px-4 py-2.5 text-sm text-warm-white focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber/40 placeholder:text-dim/50 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!user || commentLoading || !commentInput.trim()}
              className="bg-amber hover:bg-amber-muted disabled:opacity-50 text-obsidian w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 shadow-sm active:scale-95"
              title="Post Comment"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Comment Stream */}
          {comments.length === 0 ? (
            <div className="bg-surface-raised/70 border border-border/70 p-8 text-center rounded-3xl space-y-1 shadow-m3-1">
              <p className="text-sm font-medium text-dim">No comments yet.</p>
              <p className="text-xs text-dim/70">Start the conversation about this session.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {comments.map(c => {
                const canDelete = isAdmin || (profile && profile.id === c.user_id);
                return (
                  <div key={c.id} className="bg-surface-raised/80 border border-border/70 p-4 rounded-2xl space-y-1.5 group shadow-sm">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/user/${encodeURIComponent(c.user_handle.replace(/^@/, ''))}`}
                          className="font-semibold text-amber hover:underline transition-colors"
                        >
                          {c.user_handle}
                        </Link>
                        <span className="text-[10px] text-dim font-mono">{getTimeAgo(c.created_at)}</span>
                      </div>
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          title="Delete comment"
                          className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full flex items-center justify-center text-dim hover:text-error hover:bg-error/10 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-warm-white leading-relaxed">{c.content}</p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>

      {/* Mix Submission Success Modal (M3 Dialog) */}
      {mixSuccessData?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-md animate-[fade-in_0.15s_ease-out]">
          <div className="bg-surface-raised border border-emerald-500/40 rounded-3xl w-full max-w-md shadow-m3-3 p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-display text-2xl font-bold text-warm-white">Mix Submitted Successfully!</h3>
              <p className="text-dim text-xs leading-relaxed">
                Your mix <strong className="text-amber">{mixSuccessData.mixTitle}</strong> has been posted to the showcase and forwarded to Discord for community feedback.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
              {mixSuccessData.discordThreadUrl && (
                <a
                  href={mixSuccessData.discordThreadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-semibold py-3 px-5 rounded-full transition-all shadow-md active:scale-95"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Discord Feedback Thread
                </a>
              )}
              <button
                onClick={() => setMixSuccessData(null)}
                className="flex items-center justify-center gap-2 bg-surface-high hover:bg-border text-dim hover:text-warm-white text-xs py-3 px-5 rounded-full transition-all border border-border/80 font-medium"
              >
                View on The Mixing Vault
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal for Discord Sign-in */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

    </div>
  );
}

function SpecBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-surface-high/80 border border-border/70 p-4 rounded-2xl space-y-1 shadow-sm">
      <div className="flex items-center gap-1.5 text-xs text-dim">
        {icon}
        <span>{label}</span>
      </div>
      <p className="font-semibold text-sm text-warm-white truncate">{value}</p>
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
