'use client';

import React, { useState, useEffect } from 'react';
import { X, Upload, Music2, AlertCircle, Loader2 } from 'lucide-react';
import { Multi, StorageQuotaInfo } from '@/types';

interface UploadMixModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMultiId?: string;
  onSuccess?: () => void;
}

export function UploadMixModal({
  isOpen,
  onClose,
  defaultMultiId,
  onSuccess,
}: UploadMixModalProps) {
  const [title, setTitle] = useState('');
  const [selectedMultiId, setSelectedMultiId] = useState(defaultMultiId || '');
  const [file, setFile] = useState<File | null>(null);
  const [multis, setMultis] = useState<Multi[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quota, setQuota] = useState<StorageQuotaInfo | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSelectedMultiId(defaultMultiId || '');
      // Fetch available multis for dropdown
      fetch('/api/multis')
        .then(res => res.json())
        .then(data => setMultis(data.multis || []))
        .catch(err => console.warn('Could not load multis:', err));

      // Fetch quota
      fetch('/api/storage/quota')
        .then(res => res.json())
        .then(data => setQuota(data))
        .catch(err => console.warn('Could not load quota:', err));
    }
  }, [isOpen, defaultMultiId]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const ext = selected.name.toLowerCase();
    const valid = ['.wav', '.flac', '.mp3', '.aiff', '.aif', '.ogg'].some(x => ext.endsWith(x));
    if (!valid) {
      setError('Supported formats: WAV, FLAC, MP3, AIFF, OGG.');
      setFile(null);
      return;
    }

    if (selected.size > 500 * 1024 * 1024) {
      setError(`File size is ${(selected.size / (1024 * 1024)).toFixed(1)} MB. Beta limit is 500 MB.`);
      setFile(null);
      return;
    }

    setError(null);
    setFile(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Mix title is required.');
      return;
    }
    if (!file) {
      setError('Please select an audio file for your mix.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      if (selectedMultiId) formData.append('multi_id', selectedMultiId);
      formData.append('file', file);

      const res = await fetch('/api/mixes/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload mix');
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error uploading mix.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[fade-in_0.15s_ease-out]">
      <div className="bg-[#121212] border border-neutral-800 rounded-xl w-full max-w-lg shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Music2 className="w-5 h-5 text-neutral-300" />
              <span>Upload Finished Mix</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Share your master or mix (WAV / FLAC / MP3, max 500 MB).
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quota */}
        {quota && (
          <div className="px-4 py-2.5 bg-neutral-900/60 border-b border-neutral-800/60 flex items-center justify-between text-xs">
            <span className="text-neutral-400">
              {quota.is_unlimited ? (
                <>Admin Storage: <strong className="text-neutral-200">{(quota.user_bytes_used / (1024 * 1024)).toFixed(1)} MB</strong> used <span className="text-emerald-400 font-semibold ml-1">(Unlimited)</span></>
              ) : (
                <>Storage: <strong className="text-neutral-200">{(quota.user_bytes_used / (1024 * 1024)).toFixed(1)} MB</strong> / 2 GB used</>
              )}
            </span>
            {!quota.is_unlimited && (
              <div className="w-24 bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-neutral-200"
                  style={{ width: `${Math.min(quota.user_percent, 100)}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/80 rounded-lg text-red-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Mix Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Connor's Final Mixdown (v3)"
                disabled={uploading}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Linked Multi / Song (Optional)
              </label>
              <select
                value={selectedMultiId}
                onChange={e => setSelectedMultiId(e.target.value)}
                disabled={uploading}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-500"
              >
                <option value="">— Standalone Mix (No Multi) —</option>
                {multis.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Audio File (WAV, FLAC, MP3) <span className="text-red-400">*</span>
              </label>
              <div className="relative border-2 border-dashed border-neutral-800 hover:border-neutral-700 rounded-lg p-5 flex flex-col items-center justify-center text-center transition-colors bg-neutral-900/30">
                <Music2 className="w-7 h-7 text-neutral-500 mb-1.5" />
                <p className="text-xs text-neutral-300 font-medium">
                  {file ? file.name : 'Choose audio file'}
                </p>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  {file ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : 'Max 500 MB per mix'}
                </p>
                <input
                  type="file"
                  accept="audio/*,.wav,.flac,.mp3,.aiff,.aif,.ogg"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={uploading}
                className="text-xs text-neutral-400 hover:text-white px-3 py-1.5 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading || !file || !title.trim()}
                className="bg-white hover:bg-neutral-200 disabled:opacity-50 text-black font-semibold text-xs px-4 py-2 rounded transition-colors flex items-center gap-1.5 shadow-sm"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Mix</span>
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
