'use client';

import React, { useState } from 'react';
import { X, Upload, Video, Sparkles, Loader2, ShieldCheck } from 'lucide-react';
import { createRecordedSession } from '@/app/actions/sessions';

interface UploadSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function UploadSessionModal({ isOpen, onClose, onSuccess }: UploadSessionModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [presenter, setPresenter] = useState('Tyler Kerpsack');
  const [durationMinutes, setDurationMinutes] = useState('45');
  const [requiredTier, setRequiredTier] = useState<'PLUS' | 'PREMIUM'>('PLUS');
  const [storageProvider, setStorageProvider] = useState<'hls' | 'cloudflare_stream' | 'mux'>('hls');
  const [videoAssetId, setVideoAssetId] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [tags, setTags] = useState('worship, live mix, compression');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !videoAssetId.trim()) {
      setError('Title and Video Asset ID / HLS Manifest URL are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const parsedTags = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await createRecordedSession({
        title: title.trim(),
        description: description.trim() || undefined,
        presenter: presenter.trim() || undefined,
        duration_seconds: durationMinutes ? Math.round(Number(durationMinutes) * 60) : undefined,
        required_tier: requiredTier,
        storage_provider: storageProvider,
        video_asset_id: videoAssetId.trim(),
        video_url: videoAssetId.startsWith('http') ? videoAssetId.trim() : undefined,
        thumbnail_url: thumbnailUrl.trim() || undefined,
        tags: parsedTags,
        published: true,
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to save session');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while publishing the session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Upload Recorded Session</h2>
              <p className="text-xs text-neutral-400">Add an exclusive video to the member vault</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-sm">
          {error && (
            <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Session Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Mixing In-Ears & Front-of-House from One Console"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Presenter</label>
              <input
                type="text"
                value={presenter}
                onChange={(e) => setPresenter(e.target.value)}
                placeholder="Tyler Kerpsack"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Duration (minutes)</label>
              <input
                type="number"
                min="1"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                placeholder="45"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Required Tier Selection */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-2">
              Required Membership Tier
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  requiredTier === 'PLUS'
                    ? 'bg-emerald-950/30 border-emerald-500 text-white'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <input
                  type="radio"
                  name="required_tier"
                  value="PLUS"
                  checked={requiredTier === 'PLUS'}
                  onChange={() => setRequiredTier('PLUS')}
                  className="sr-only"
                />
                <ShieldCheck className={`w-4 h-4 ${requiredTier === 'PLUS' ? 'text-emerald-400' : 'text-neutral-500'}`} />
                <div>
                  <div className="font-semibold text-xs">Plus Tier</div>
                  <div className="text-[10px] text-neutral-500">Accessible by Plus & Premium</div>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  requiredTier === 'PREMIUM'
                    ? 'bg-amber-950/30 border-amber-500 text-white'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <input
                  type="radio"
                  name="required_tier"
                  value="PREMIUM"
                  checked={requiredTier === 'PREMIUM'}
                  onChange={() => setRequiredTier('PREMIUM')}
                  className="sr-only"
                />
                <Sparkles className={`w-4 h-4 ${requiredTier === 'PREMIUM' ? 'text-amber-400' : 'text-neutral-500'}`} />
                <div>
                  <div className="font-semibold text-xs">Premium Tier</div>
                  <div className="text-[10px] text-neutral-500">Exclusive to Pro Members</div>
                </div>
              </label>
            </div>
          </div>

          {/* Streaming Platform */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Video Source / Platform
            </label>
            <select
              value={storageProvider}
              onChange={(e) => setStorageProvider(e.target.value as any)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="hls">HLS Master Playlist (.m3u8)</option>
              <option value="cloudflare_stream">Cloudflare Stream (Asset ID)</option>
              <option value="mux">Mux Video (Playback ID)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Video Asset ID or Stream URL <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={videoAssetId}
              onChange={(e) => setVideoAssetId(e.target.value)}
              placeholder="e.g. https://.../stream.m3u8 or Cloudflare Stream UID"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500 font-mono text-xs"
            />
            <p className="text-[11px] text-neutral-500 mt-1">
              Delivered via chunked HLS tokens to prevent file downloads.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Thumbnail Image URL (Optional)
            </label>
            <input
              type="url"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://.../thumbnail.jpg"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Session breakdown, covered consoles, routing techniques..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Tags</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="yamaha, compression, routing"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-xs font-medium text-neutral-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg text-xs font-medium bg-emerald-500 hover:bg-emerald-400 text-black transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              <span>Publish Session</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
