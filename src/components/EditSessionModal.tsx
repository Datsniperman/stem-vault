'use client';

import React, { useState, useEffect } from 'react';
import { X, Video, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { RecordedSessionListItem } from '@/types/sessions';

interface EditSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: RecordedSessionListItem | null;
  onSuccess?: () => void;
}

export function EditSessionModal({
  isOpen,
  onClose,
  session,
  onSuccess,
}: EditSessionModalProps) {
  const [title, setTitle] = useState('');
  const [presenter, setPresenter] = useState('');
  const [description, setDescription] = useState('');
  const [videoAssetId, setVideoAssetId] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [published, setPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && session) {
      setTitle(session.title || '');
      setPresenter(session.presenter || '');
      setDescription(session.description || '');
      setVideoAssetId(session.video_asset_id || '');
      setVideoUrl(session.video_url || '');
      setThumbnailUrl(session.thumbnail_url || '');
      setPublished(session.published ?? true);
      setError(null);
    }
  }, [isOpen, session]);

  if (!isOpen || !session) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Session title is required.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload: any = {
        title: title.trim(),
        presenter: presenter.trim() || null,
        description: description.trim() || null,
        thumbnail_url: thumbnailUrl.trim() || null,
        published,
      };

      if (videoAssetId.trim()) {
        payload.video_asset_id = videoAssetId.trim();
      }
      if (videoUrl.trim()) {
        payload.video_url = videoUrl.trim();
      }

      const res = await fetch(`/api/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update session.');
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error updating session.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[fade-in_0.15s_ease-out]">
      <div className="bg-[#121212] border border-neutral-800 rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Video className="w-5 h-5 text-neutral-300" />
              <span>Edit Recorded Session</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Update session title, presenter, video paths, or visibility.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded hover:bg-neutral-800 transition-colors"
            title="Cancel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/80 rounded-lg text-red-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Session Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                disabled={saving}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Presenter / Engineer
              </label>
              <input
                type="text"
                value={presenter}
                onChange={e => setPresenter(e.target.value)}
                disabled={saving}
                placeholder="e.g. Tyler Kerpsack, Jared"
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Description / Curriculum Notes
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                disabled={saving}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Video Asset ID / Key
                </label>
                <input
                  type="text"
                  value={videoAssetId}
                  onChange={e => setVideoAssetId(e.target.value)}
                  disabled={saving}
                  placeholder="e.g. sessions/my-session"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Thumbnail Image URL
                </label>
                <input
                  type="text"
                  value={thumbnailUrl}
                  onChange={e => setThumbnailUrl(e.target.value)}
                  disabled={saving}
                  placeholder="https://..."
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
                />
              </div>
            </div>

            <div className="bg-neutral-900/80 border border-neutral-800 p-3 rounded-lg">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={e => setPublished(e.target.checked)}
                  disabled={saving}
                  className="w-4 h-4 rounded border-neutral-700 text-emerald-500 focus:ring-0 bg-neutral-800 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-semibold text-white block">Published to Members</span>
                  <span className="text-[11px] text-neutral-400 block">When checked, session is visible in the library.</span>
                </div>
              </label>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-3.5 py-1.5 rounded text-xs font-medium text-neutral-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !title.trim()}
                className="bg-white hover:bg-neutral-200 disabled:opacity-50 text-black font-semibold text-xs px-4 py-2 rounded transition-colors flex items-center gap-1.5 shadow-sm"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
