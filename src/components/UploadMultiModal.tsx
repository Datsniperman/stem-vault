'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Upload, FileArchive, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { StorageQuotaInfo } from '@/types';

interface UploadMultiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (multiId: string) => void;
}

interface RenameMapping {
  original: string;
  stored: string;
  size_bytes: number;
  duration_seconds: number | null;
}

export function UploadMultiModal({ isOpen, onClose, onSuccess }: UploadMultiModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quota, setQuota] = useState<StorageQuotaInfo | null>(null);
  const [resultMappings, setResultMappings] = useState<RenameMapping[] | null>(null);
  const [createdMultiId, setCreatedMultiId] = useState<string | null>(null);

  // Fetch quota on open
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setResultMappings(null);
      setCreatedMultiId(null);
      fetch('/api/storage/quota')
        .then(res => res.json())
        .then(data => setQuota(data))
        .catch(err => console.warn('Could not fetch quota:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.name.toLowerCase().endsWith('.zip')) {
      setError('Only ZIP archives (.zip) are supported for multitrack packs.');
      setFile(null);
      return;
    }

    if (selected.size > 500 * 1024 * 1024) {
      setError(`File size is ${(selected.size / (1024 * 1024)).toFixed(1)} MB. Beta limit is 500 MB per ZIP.`);
      setFile(null);
      return;
    }

    setError(null);
    setFile(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Multi title is required.');
      return;
    }
    if (!file) {
      setError('Please select a ZIP file containing the multitrack audio stems.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      if (description.trim()) formData.append('description', description.trim());
      formData.append('file', file);

      const res = await fetch('/api/multis/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setResultMappings(data.rename_mappings || []);
      setCreatedMultiId(data.multi?.id);
    } catch (err: any) {
      setError(err.message || 'Failed to upload multitrack ZIP.');
    } finally {
      setUploading(false);
    }
  };

  const handleFinish = () => {
    if (createdMultiId) {
      if (onSuccess) onSuccess(createdMultiId);
      router.push(`/multis/${createdMultiId}`);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[fade-in_0.15s_ease-out]">
      <div className="bg-[#121212] border border-neutral-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <FileArchive className="w-5 h-5 text-neutral-300" />
              <span>{resultMappings ? 'Upload Completed' : 'Upload Multi (Stem Pack)'}</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              {resultMappings
                ? 'Review file rename mappings and proceed to your multi page.'
                : 'Upload a ZIP multitrack archive (max 500 MB). Audio files will be automatically validated and cleaned.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Storage Quota Bar */}
        {quota && !resultMappings && (
          <div className="px-4 py-2.5 bg-neutral-900/60 border-b border-neutral-800/60 flex items-center justify-between text-xs">
            <span className="text-neutral-400">
              {quota.is_unlimited ? (
                <>Admin Storage: <strong className="text-neutral-200">{(quota.user_bytes_used / (1024 * 1024)).toFixed(1)} MB</strong> used <span className="text-emerald-400 font-semibold ml-1">(Unlimited)</span></>
              ) : (
                <>Beta Storage: <strong className="text-neutral-200">{(quota.user_bytes_used / (1024 * 1024)).toFixed(1)} MB</strong> / 2 GB used</>
              )}
            </span>
            {!quota.is_unlimited && (
              <div className="w-28 bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${quota.user_percent > 85 ? 'bg-amber-500' : 'bg-neutral-200'}`}
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

          {resultMappings ? (
            /* Result Screen showing Before -> After Mapping */
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Successfully extracted and stored {resultMappings.length} audio tracks.</span>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                  Filename Rename Mapping (Original → Clean Stored):
                </h4>
                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                  {resultMappings.map((m, idx) => (
                    <div
                      key={idx}
                      className="text-xs bg-neutral-900 border border-neutral-800/80 rounded p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-neutral-400 line-through text-[11px] block truncate">
                          {m.original}
                        </span>
                        <div className="flex items-center gap-1.5 text-neutral-200 font-mono text-[11px] mt-0.5">
                          <ArrowRight className="w-3 h-3 text-neutral-400 shrink-0" />
                          <span className="truncate text-white font-medium">{m.stored}</span>
                        </div>
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono shrink-0 flex items-center gap-2">
                        {m.duration_seconds && <span>{Math.round(m.duration_seconds)}s</span>}
                        <span>{(m.size_bytes / (1024 * 1024)).toFixed(1)} MB</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleFinish}
                  className="bg-white hover:bg-neutral-200 text-black font-semibold text-xs px-4 py-2 rounded transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <span>Go to Multi Page</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* Upload Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Song / Multi Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Gravity - Multitrack Stems"
                  disabled={uploading}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Description / Notes (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="BPM, key, recording notes, microphone setup..."
                  rows={2}
                  disabled={uploading}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Multitrack ZIP Archive <span className="text-red-400">*</span>
                </label>
                <div className="relative border-2 border-dashed border-neutral-800 hover:border-neutral-700 rounded-lg p-6 flex flex-col items-center justify-center text-center transition-colors bg-neutral-900/30">
                  <FileArchive className="w-8 h-8 text-neutral-500 mb-2" />
                  <p className="text-xs text-neutral-300 font-medium">
                    {file ? file.name : 'Click to select or drag & drop a ZIP file'}
                  </p>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    {file
                      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                      : 'WAV, FLAC, MP3, AIFF, OGG files inside — Max 500 MB per ZIP'}
                  </p>
                  <input
                    type="file"
                    accept=".zip,application/zip"
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
                      <span>Extracting & Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Multi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
