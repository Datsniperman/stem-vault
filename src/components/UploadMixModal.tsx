'use client';

import React, { useState, useEffect } from 'react';
import { X, Upload, Music2, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { Multi } from '@/types';

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
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setUploadProgress(null);
      setStatusMessage('');
      setSelectedMultiId(defaultMultiId || '');
      fetch('/api/multis')
        .then(res => res.json())
        .then(data => setMultis(data.multis || []))
        .catch(err => console.warn('Could not load multis:', err));
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

    setError(null);
    setFile(selected);
  };

  const uploadDirectToR2 = (uploadUrl: string, fileData: Blob, contentType: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl, true);
      xhr.setRequestHeader('Content-Type', contentType);

      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) {
          const percent = Math.round((evt.loaded / evt.total) * 100);
          setUploadProgress(percent);
          setStatusMessage(`Uploading to Cloudflare R2: ${percent}%`);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Storage server returned HTTP ${xhr.status}: ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => {
        reject(
          new Error(
            'Direct Cloudflare R2 upload was blocked by browser CORS policy. Please configure CORS on your "mixing-vault-files" bucket in Cloudflare Dashboard.'
          )
        );
      };

      xhr.send(fileData);
    });
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
    setUploadProgress(null);
    setStatusMessage('Initiating upload...');
    setError(null);

    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();

    try {
      // 1. Request presigned upload URL for direct-to-R2 upload (bypasses Vercel 4.5MB limit)
      let presignRes: Response | null = null;
      try {
        presignRes = await fetch('/api/storage/presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type || 'audio/wav',
            folder: 'mixes',
          }),
        });
      } catch (e) {
        console.warn('Presign request error, falling back:', e);
      }

      let presignData: any = null;
      if (presignRes && presignRes.ok) {
        try {
          presignData = await presignRes.json();
        } catch {}
      }

      // If presigning succeeded and R2 is active, do direct browser PUT to R2
      if (presignData?.uploadUrl && presignData?.isR2) {
        setStatusMessage('Streaming directly to Cloudflare R2...');
        await uploadDirectToR2(presignData.uploadUrl, file, file.type || 'audio/wav');

        setStatusMessage('Saving mix metadata...');
        const createRes = await fetch('/api/mixes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            multi_id: selectedMultiId || null,
            r2_key: presignData.key,
            public_url: presignData.publicUrl,
            format: ext.replace('.', '').toUpperCase(),
            size_bytes: file.size,
          }),
        });

        const text = await createRes.text();
        let createData: any = null;
        try {
          createData = text ? JSON.parse(text) : null;
        } catch {}

        if (!createRes.ok) {
          throw new Error(createData?.error || text || 'Failed to save mix details.');
        }

        if (onSuccess) onSuccess();
        onClose();
        return;
      }

      // 2. Fallback to standard server upload (for local server environments)
      setStatusMessage('Uploading to server...');
      const formData = new FormData();
      formData.append('title', title.trim());
      if (selectedMultiId) formData.append('multi_id', selectedMultiId);
      formData.append('file', file);

      const res = await fetch('/api/mixes/upload', {
        method: 'POST',
        body: formData,
      });

      const resText = await res.text();
      let data: any = null;
      try {
        data = resText ? JSON.parse(resText) : null;
      } catch {
        if (res.status === 413 || resText.includes('Request Entity')) {
          throw new Error('Vercel 4.5 MB serverless limit reached. Cloudflare R2 direct upload is required for large files.');
        }
        throw new Error(resText || `Upload failed with HTTP ${res.status}`);
      }

      if (!res.ok) {
        throw new Error(data?.error || `Upload failed with status ${res.status}`);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error uploading mix.');
    } finally {
      setUploading(false);
      setUploadProgress(null);
      setStatusMessage('');
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
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded hover:bg-neutral-800 transition-colors"
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
                <option value="">None (Standalone Mix)</option>
                {multis.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Audio File <span className="text-red-400">*</span>
              </label>
              <div className="relative border-2 border-dashed border-neutral-800 hover:border-neutral-700 rounded-lg p-6 flex flex-col items-center justify-center text-center transition-colors bg-neutral-900/30">
                <Music2 className="w-7 h-7 text-neutral-500 mb-1.5" />
                <p className="text-xs text-neutral-300 font-medium">
                  {file ? file.name : 'Choose audio file'}
                </p>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  {file ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : 'WAV, FLAC, MP3, AIFF, OGG (unlimited)'}
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

            {uploading && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>{statusMessage || 'Uploading...'}</span>
                  {uploadProgress !== null && <span>{uploadProgress}%</span>}
                </div>
                {uploadProgress !== null && (
                  <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-white h-full rounded-full transition-all duration-150"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            )}

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
