'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, Upload, FileArchive, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import JSZip from 'jszip';
import { sanitizeTrackFilename } from '@/lib/audio/renamer';

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

interface ParsedAudioEntry {
  entry: JSZip.JSZipObject;
  filename: string;
  ext: string;
}

const ALLOWED_AUDIO_EXTENSIONS = new Set(['.wav', '.flac', '.mp3', '.aiff', '.aif', '.ogg']);

export function UploadMultiModal({ isOpen, onClose, onSuccess }: UploadMultiModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultMappings, setResultMappings] = useState<RenameMapping[] | null>(null);
  const [createdMultiId, setCreatedMultiId] = useState<string | null>(null);

  // Background parsing tracking
  const [parsedEntries, setParsedEntries] = useState<ParsedAudioEntry[] | null>(null);
  const bgParsePromiseRef = useRef<Promise<ParsedAudioEntry[]> | null>(null);
  const bgErrorRef = useRef<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setStatusMessage('');
      setUploadProgress(null);
      setResultMappings(null);
      setCreatedMultiId(null);
      setParsedEntries(null);
      bgParsePromiseRef.current = null;
      bgErrorRef.current = null;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const startBackgroundZipParsing = (zipFile: File): Promise<ParsedAudioEntry[]> => {
    bgErrorRef.current = null;

    const promise = (async () => {
      let zip: JSZip;
      try {
        zip = await JSZip.loadAsync(zipFile);
      } catch (err: any) {
        throw new Error('Could not parse ZIP archive. Please ensure it is a valid ZIP file.');
      }

      const audioEntries: ParsedAudioEntry[] = [];
      zip.forEach((relativePath, entry) => {
        if (entry.dir) return;
        const name = entry.name.replace(/^.*[\\\/]/, '');
        if (name.startsWith('._') || name === '.DS_Store' || relativePath.includes('__MACOSX')) return;

        const lastDot = name.lastIndexOf('.');
        const ext = lastDot !== -1 ? name.slice(lastDot).toLowerCase() : '';
        if (ALLOWED_AUDIO_EXTENSIONS.has(ext)) {
          audioEntries.push({ entry, filename: name, ext });
        }
      });

      if (audioEntries.length === 0) {
        throw new Error('No valid audio files (WAV, FLAC, MP3, AIFF, OGG) found in this ZIP archive.');
      }

      setParsedEntries(audioEntries);
      return audioEntries;
    })();

    bgParsePromiseRef.current = promise;
    promise.catch(err => {
      console.warn('Background zip parse error:', err);
      bgErrorRef.current = err.message || 'Failed to inspect ZIP file.';
    });

    return promise;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.name.toLowerCase().endsWith('.zip')) {
      setError('Only ZIP archives (.zip) are supported for multitrack packs.');
      setFile(null);
      return;
    }

    setError(null);
    setFile(selected);

    // Auto-fill title from filename if title is blank
    if (!title.trim()) {
      const cleanTitle = selected.name.replace(/\.zip$/i, '').replace(/[-_]/g, ' ');
      setTitle(cleanTitle);
    }

    // Immediately start background parsing
    startBackgroundZipParsing(selected);
  };

  const uploadDirectToR2 = (
    uploadUrl: string,
    fileData: Blob,
    contentType: string,
    onProgress?: (percent: number) => void
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl, true);
      xhr.setRequestHeader('Content-Type', contentType);

      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable && onProgress) {
          const percent = Math.round((evt.loaded / evt.total) * 100);
          onProgress(percent);
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
        reject(new Error('Storage upload failed. Please check network connection.'));
      };

      xhr.send(fileData);
    });
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
    setStatusMessage('Reading ZIP archive...');
    setUploadProgress(10);

    try {
      // 1. Get parsed audio entries (wait for background promise if still running)
      let audioEntries = parsedEntries;
      if (bgErrorRef.current && !audioEntries) {
        bgErrorRef.current = null;
        audioEntries = await startBackgroundZipParsing(file);
      } else if (!audioEntries && bgParsePromiseRef.current) {
        setStatusMessage('Reading ZIP archive...');
        audioEntries = await bgParsePromiseRef.current;
      } else if (!audioEntries) {
        audioEntries = await startBackgroundZipParsing(file);
      }

      setStatusMessage(`Found ${audioEntries.length} audio tracks. Creating multi pack...`);
      setUploadProgress(20);

      // 2. Create the Multi record in database
      const multiRes = await fetch('/api/multis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
        }),
      });

      const multiText = await multiRes.text();
      let multiData: any = null;
      try {
        multiData = multiText ? JSON.parse(multiText) : null;
      } catch {}

      if (!multiRes.ok || !multiData?.multi?.id) {
        throw new Error(multiData?.error || multiText || 'Failed to create multi.');
      }

      const multiId = multiData.multi.id;
      setCreatedMultiId(multiId);

      // 3. Upload the full ZIP archive directly to Cloudflare R2
      setStatusMessage('Uploading full session ZIP archive to cloud storage...');
      try {
        const safeZipName = `${title.trim().replace(/[^a-zA-Z0-9_-]/g, '_')}_stems.zip`;
        const zipPresignRes = await fetch('/api/storage/presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: safeZipName,
            contentType: 'application/zip',
            folder: `multis/${multiId}/zip`,
          }),
        });

        if (zipPresignRes.ok) {
          const zipPresignData = await zipPresignRes.json();
          if (zipPresignData?.uploadUrl) {
            await uploadDirectToR2(zipPresignData.uploadUrl, file, 'application/zip', (pct) => {
              setUploadProgress(20 + Math.round(pct * 0.2));
            });
            await fetch(`/api/multis/${multiId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                zip_r2_key: zipPresignData.key,
                zip_public_url: zipPresignData.publicUrl,
                zip_size_bytes: file.size,
              }),
            });
          }
        }
      } catch (zipUploadErr) {
        console.warn('Could not upload full zip archive to R2:', zipUploadErr);
      }

      // 4. Upload each individual stem track directly to Cloudflare R2
      const mappings: RenameMapping[] = [];
      const usedNames = new Set<string>();

      for (let i = 0; i < audioEntries.length; i++) {
        const item = audioEntries[i];
        const storedName = sanitizeTrackFilename(item.filename, usedNames);
        usedNames.add(storedName.toLowerCase());

        const overallProgress = 40 + Math.round(((i + 1) / audioEntries.length) * 55);
        setUploadProgress(overallProgress);
        setStatusMessage(`Uploading stem ${i + 1} of ${audioEntries.length}: ${storedName}...`);

        const blob = await item.entry.async('blob');

        // Request presigned URL
        const presignRes = await fetch('/api/storage/presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: storedName,
            contentType: blob.type || 'audio/wav',
            folder: `multis/${multiId}`,
          }),
        });

        const presignText = await presignRes.text();
        let presignData: any = null;
        try {
          presignData = presignText ? JSON.parse(presignText) : null;
        } catch {}

        if (!presignRes.ok || !presignData?.uploadUrl) {
          throw new Error(presignData?.error || 'Failed to get presigned upload URL.');
        }

        // Direct upload to R2
        await uploadDirectToR2(presignData.uploadUrl, blob, blob.type || 'audio/wav');

        // Register track in database
        const trackRes = await fetch(`/api/multis/${multiId}/tracks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stored_filename: storedName,
            original_filename: item.filename,
            format: item.ext.replace('.', '').toUpperCase(),
            size_bytes: blob.size,
            r2_key: presignData.key,
            public_url: presignData.publicUrl,
            duration_seconds: null,
          }),
        });

        if (!trackRes.ok) {
          const trackData = await trackRes.json().catch(() => ({}));
          throw new Error(trackData?.error || 'Failed to save track record.');
        }

        mappings.push({
          original: item.filename,
          stored: storedName,
          size_bytes: blob.size,
          duration_seconds: null,
        });
      }

      setResultMappings(mappings);

      // Finalize multitrack and announce to Discord once files are uploaded
      setUploadProgress(98);
      setStatusMessage('Finalizing multitrack and announcing to Discord...');
      try {
        const pubRes = await fetch('/api/multis/' + multiId + '/publish', {
          method: 'POST',
        });
        if (!pubRes.ok) {
          console.warn('[upload] Publish notification warning:', await pubRes.text());
        }
      } catch (pubErr) {
        console.error('[upload] Failed to publish announcement:', pubErr);
      }

      setUploadProgress(100);
      setStatusMessage('Upload complete!');
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
      <div className="bg-[#121212] border border-neutral-800 rounded-xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <FileArchive className="w-5 h-5 text-neutral-300" />
              <span>Upload Multitrack Song (ZIP)</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              {resultMappings
                ? 'Review file rename mappings and proceed to your multi page.'
                : 'Upload a ZIP multitrack archive. Audio files will be automatically validated and cleaned.'}
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
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
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
                      className="p-2.5 bg-neutral-900/70 border border-neutral-800 rounded text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-neutral-500 font-mono shrink-0">#{idx + 1}</span>
                        <span className="text-neutral-400 truncate max-w-[180px] sm:max-w-[220px]" title={m.original}>
                          {m.original}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                        <span className="text-white font-medium truncate max-w-[180px] sm:max-w-[220px]" title={m.stored}>
                          {m.stored}
                        </span>
                      </div>
                      <span className="text-neutral-500 text-[11px] font-mono shrink-0">
                        {(m.size_bytes / (1024 * 1024)).toFixed(1)} MB
                      </span>
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
                  Multitrack ZIP Archive <span className="text-red-400">*</span>
                </label>
                <div className="relative border-2 border-dashed border-neutral-800 hover:border-neutral-700 rounded-lg p-5 flex flex-col items-center justify-center text-center transition-colors bg-neutral-900/30">
                  <FileArchive className="w-8 h-8 text-neutral-500 mb-1.5" />
                  <p className="text-xs text-neutral-200 font-medium truncate max-w-sm">
                    {file ? file.name : 'Click to select or drag & drop a ZIP file'}
                  </p>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    {file
                      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                      : 'WAV, FLAC, MP3, AIFF, OGG files inside — Unlimited upload'}
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

              {/* Visual Animated Progress Bar - ONLY shown once the user clicks upload */}
              {uploading && (
                <div className="space-y-1.5 bg-neutral-900/60 border border-neutral-800 p-3.5 rounded-lg animate-[fade-in_0.15s_ease-out]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-300 font-mono text-[11px] truncate flex items-center gap-1.5">
                      {uploadProgress === 100 ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400 shrink-0" />
                      )}
                      <span>{statusMessage || 'Processing upload...'}</span>
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

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={uploading}
                  className="px-3.5 py-1.5 rounded text-xs font-medium text-neutral-400 hover:text-white transition-colors"
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
                      <span>Uploading Multi...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Multi (ZIP)</span>
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
