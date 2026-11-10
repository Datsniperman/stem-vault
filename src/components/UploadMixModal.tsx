'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Music2, AlertCircle, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { Multi } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { canSubmitSundayReview } from '@/lib/auth/tiers';

interface UploadMixModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMultiId?: string;
  onSuccess?: () => void;
}

interface StagedUpload {
  key: string;
  publicUrl: string;
  format: string;
  sizeBytes: number;
}

export function UploadMixModal({
  isOpen,
  onClose,
  defaultMultiId,
  onSuccess,
}: UploadMixModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [selectedMultiId, setSelectedMultiId] = useState(defaultMultiId || '');
  const [isSundayReview, setIsSundayReview] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [multis, setMultis] = useState<Multi[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Background upload tracking
  const [stagedUpload, setStagedUpload] = useState<StagedUpload | null>(null);
  const bgUploadPromiseRef = useRef<Promise<StagedUpload> | null>(null);
  const bgErrorRef = useRef<string | null>(null);
  const activeXhrRef = useRef<XMLHttpRequest | null>(null);

  const canReview = canSubmitSundayReview(user);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setUploadProgress(null);
      setStatusMessage('');
      setStagedUpload(null);
      setIsSundayReview(false);
      bgUploadPromiseRef.current = null;
      bgErrorRef.current = null;
      activeXhrRef.current = null;
      setSelectedMultiId(defaultMultiId || '');
      fetch('/api/multis')
        .then(res => res.json())
        .then(data => setMultis(data.multis || []))
        .catch(err => console.warn('Could not load multis:', err));
    }
  }, [isOpen, defaultMultiId]);

  if (!isOpen) return null;

  const handleCancel = () => {
    // 1. Immediately abort active network request if currently uploading
    if (activeXhrRef.current) {
      try {
        activeXhrRef.current.abort();
      } catch (e) {}
      activeXhrRef.current = null;
    }

    // 2. If an R2 key was uploaded, immediately delete it from R2 storage
    if (stagedUpload?.key) {
      const keyToDelete = stagedUpload.key;
      fetch('/api/storage/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: keyToDelete }),
      }).catch(err => console.warn('Could not delete cancelled upload key:', err));
    }

    // 3. Reset all state and close modal
    setFile(null);
    setTitle('');
    setIsSundayReview(false);
    setUploading(false);
    setUploadProgress(null);
    setStatusMessage('');
    setStagedUpload(null);
    bgUploadPromiseRef.current = null;
    bgErrorRef.current = null;
    setError(null);

    onClose();
  };

  const uploadDirectToR2 = (uploadUrl: string, fileData: Blob, contentType: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      activeXhrRef.current = xhr;
      xhr.open('PUT', uploadUrl, true);
      xhr.setRequestHeader('Content-Type', contentType);

      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) {
          const percent = Math.round((evt.loaded / evt.total) * 100);
          setUploadProgress(percent);
          setStatusMessage(`Uploading audio to Cloudflare: ${percent}%`);
        }
      };

      xhr.onload = () => {
        activeXhrRef.current = null;
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Storage server returned HTTP ${xhr.status}: ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => {
        activeXhrRef.current = null;
        reject(new Error('Storage upload failed. Please check network connection.'));
      };

      xhr.onabort = () => {
        activeXhrRef.current = null;
        reject(new Error('Upload cancelled.'));
      };

      xhr.send(fileData);
    });
  };

  const startBackgroundUpload = (selectedFile: File): Promise<StagedUpload> => {
    const ext = selectedFile.name.slice(selectedFile.name.lastIndexOf('.')).toLowerCase();
    const format = ext.replace('.', '').toUpperCase();

    setStatusMessage('Uploading audio to Cloudflare...');
    setUploadProgress(10);

    const promise = (async () => {
      // 1. Get presigned upload URL
      const presignRes = await fetch('/api/storage/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: selectedFile.name,
          contentType: selectedFile.type || 'audio/wav',
          folder: 'mixes',
        }),
      });

      if (!presignRes.ok) {
        throw new Error('Failed to obtain cloud storage upload authorization.');
      }

      const presignData = await presignRes.json();
      if (!presignData?.uploadUrl) {
        throw new Error(presignData?.error || 'Presigned upload URL missing.');
      }

      // 2. Stream directly to Cloudflare R2
      await uploadDirectToR2(presignData.uploadUrl, selectedFile, selectedFile.type || 'audio/wav');

      const staged: StagedUpload = {
        key: presignData.key,
        publicUrl: presignData.publicUrl,
        format,
        sizeBytes: selectedFile.size,
      };

      setStagedUpload(staged);
      setStatusMessage('Upload complete! Saving mix...');
      setUploadProgress(100);
      return staged;
    })();

    bgUploadPromiseRef.current = promise;
    promise.catch(err => {
      console.warn('Background upload error:', err);
      bgErrorRef.current = err.message || 'Background upload failed.';
    });

    return promise;
  };

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

    setError(null);
    setFile(selected);

    // Auto-fill title from filename if title is blank
    if (!title.trim()) {
      const cleanTitle = selected.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(cleanTitle);
    }

    // Silently start background upload (hidden from user until they click upload button)
    startBackgroundUpload(selected);
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
      let uploadInfo = stagedUpload;

      // If background upload encountered an error, retry
      if (bgErrorRef.current && !uploadInfo) {
        bgErrorRef.current = null;
        uploadInfo = await startBackgroundUpload(file);
      } else if (!uploadInfo && bgUploadPromiseRef.current) {
        setStatusMessage('Uploading audio to Cloudflare...');
        uploadInfo = await bgUploadPromiseRef.current;
      } else if (!uploadInfo) {
        uploadInfo = await startBackgroundUpload(file);
      }

      setUploadProgress(100);
      setStatusMessage('Saving mix and notifying Discord...');

      const createRes = await fetch('/api/mixes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          multi_id: selectedMultiId || null,
          r2_key: uploadInfo.key,
          public_url: uploadInfo.publicUrl,
          format: uploadInfo.format,
          size_bytes: uploadInfo.sizeBytes,
          is_sunday_review: isSundayReview && canReview,
        }),
      });

      const text = await createRes.text();
      let createData: any = null;
      try {
        createData = text ? JSON.parse(text) : null;
      } catch {}

      if (!createRes.ok || !createData?.mix?.id) {
        throw new Error(createData?.error || text || 'Failed to save mix.');
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
              Share your master or mix (WAV / FLAC / MP3, unlimited size).
            </p>
          </div>
          <button
            onClick={handleCancel}
            className="text-neutral-400 hover:text-white p-1 rounded hover:bg-neutral-800 transition-colors"
            title="Cancel and close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
                Audio File <span className="text-red-400">*</span>
              </label>
              <div className="relative border-2 border-dashed border-neutral-800 hover:border-neutral-700 rounded-lg p-5 flex flex-col items-center justify-center text-center transition-colors bg-neutral-900/30">
                <Music2 className="w-7 h-7 text-neutral-500 mb-1.5" />
                <p className="text-xs text-neutral-200 font-medium truncate max-w-xs">
                  {file ? file.name : 'Choose audio file (WAV, FLAC, MP3, AIFF, OGG)'}
                </p>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  {file ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : 'Unlimited upload size'}
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

            {/* Visual Animated Progress Bar */}
            {uploading && (
              <div className="space-y-1.5 bg-neutral-900/60 border border-neutral-800 p-3 rounded-lg animate-[fade-in_0.15s_ease-out]">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-300 font-mono text-[11px] truncate flex items-center gap-1.5">
                    {(uploadProgress ?? 0) === 100 ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400 shrink-0" />
                    )}
                    <span>{statusMessage || 'Uploading audio to Cloudflare...'}</span>
                  </span>
                  <span className="text-white font-mono font-bold text-xs shrink-0">
                    {uploadProgress !== null ? `${uploadProgress}%` : ''}
                  </span>
                </div>
                <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress ?? 10}%` }}
                  />
                </div>
              </div>
            )}

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
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-500 cursor-pointer"
              >
                <option value="">None (Standalone Mix)</option>
                {multis.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Sunday Mix Review Toggle (Premium Exclusive) */}
            <div className={`p-3 rounded-lg border transition-colors ${
              canReview
                ? isSundayReview
                  ? 'bg-purple-950/40 border-purple-800/80'
                  : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                : 'bg-neutral-900/30 border-neutral-800/60 opacity-70'
            }`}>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSundayReview}
                  onChange={e => setIsSundayReview(e.target.checked)}
                  disabled={uploading || !canReview}
                  className="w-4 h-4 rounded border-neutral-700 text-purple-600 focus:ring-0 bg-neutral-800 cursor-pointer mt-0.5"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-white">
                      Submit for Sunday Mix Review
                    </span>
                    <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-purple-950/60 text-purple-300 border border-purple-700/50">
                      PREMIUM
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Request direct, personalized mix review and feedback from Jared and the pro engineering team.
                  </p>
                  {!canReview && (
                    <p className="text-[11px] text-amber-400 mt-1 font-medium">
                      Requires Premium Tier ($30/mo). Upgrade in Membership to unlock Sunday reviews.
                    </p>
                  )}
                </div>
              </label>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={handleCancel}
                className="px-3.5 py-1.5 rounded text-xs font-medium text-neutral-400 hover:text-white transition-colors"
              >
                {uploading ? 'Cancel Upload' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={uploading || !file || !title.trim()}
                className="bg-white hover:bg-neutral-200 disabled:opacity-50 text-black font-semibold text-xs px-4 py-2 rounded transition-colors flex items-center gap-1.5 shadow-sm"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Publishing Mix...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Post Mix</span>
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
