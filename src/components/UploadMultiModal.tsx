'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { X, Upload, FileArchive, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { sanitizeTrackFilename } from '@/lib/audio/renamer';
import { parseZipEntries, extractZipEntry, ZipAudioEntry } from '@/lib/zip/parser';

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
  const { user, profile } = useAuth();
  const userRoles: string[] = [
    ...(Array.isArray((user as any)?.roles) ? (user as any).roles : []),
    ...(Array.isArray(user?.user_metadata?.roles) ? user.user_metadata.roles : []),
    ...(Array.isArray(user?.user_metadata?.custom_claims?.roles) ? user.user_metadata.custom_claims.roles : []),
  ];
  const isProUser =
    userRoles.includes('1488346107351269526') ||
    user?.user_metadata?.provider_id === '1377286620344221778' ||
    user?.user_metadata?.provider_id === '635718336822378506';

  const [statusMessage, setStatusMessage] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultMappings, setResultMappings] = useState<RenameMapping[] | null>(null);
  const [createdMultiId, setCreatedMultiId] = useState<string | null>(null);

  // Background parsing and cancellation tracking
  const [parsedEntries, setParsedEntries] = useState<ZipAudioEntry[] | null>(null);
  const bgParsePromiseRef = useRef<Promise<ZipAudioEntry[]> | null>(null);
  const bgErrorRef = useRef<string | null>(null);
  const isCancelledRef = useRef<boolean>(false);
  const activeXhrsRef = useRef<Set<XMLHttpRequest>>(new Set());
  const abortControllerRef = useRef<AbortController>(new AbortController());
  const uploadedKeysRef = useRef<string[]>([]);
  const runningMultiIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      isCancelledRef.current = false;
      activeXhrsRef.current.clear();
      abortControllerRef.current = new AbortController();
      uploadedKeysRef.current = [];
      runningMultiIdRef.current = null;
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

  const handleCancel = async () => {
    isCancelledRef.current = true;

    // 1. Immediately abort all active in-flight XMLHttpRequests
    for (const xhr of activeXhrsRef.current) {
      try {
        xhr.abort();
      } catch (e) {}
    }
    activeXhrsRef.current.clear();

    // 2. Abort all fetch requests
    try {
      abortControllerRef.current.abort();
    } catch (e) {}

    // 3. If a multitrack was created in DB, delete it and its tracks from database and R2
    const targetMultiId = runningMultiIdRef.current || createdMultiId;
    if (targetMultiId) {
      try {
        await fetch(`/api/multis/${targetMultiId}`, {
          method: 'DELETE',
        });
      } catch (delErr) {
        console.warn('Could not delete multi on cancel:', delErr);
      }
    }

    // 4. Delete any R2 keys uploaded so far
    if (uploadedKeysRef.current.length > 0) {
      try {
        await fetch('/api/storage/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keys: [...uploadedKeysRef.current] }),
        });
      } catch (delErr) {
        console.warn('Could not delete uploaded keys on cancel:', delErr);
      }
    }

    // 5. Reset all state and close modal
    setUploading(false);
    setUploadProgress(null);
    setStatusMessage('');
    setFile(null);
    setTitle('');
    setDescription('');
    setResultMappings(null);
    setCreatedMultiId(null);
    runningMultiIdRef.current = null;
    uploadedKeysRef.current = [];
    activeXhrsRef.current.clear();
    bgParsePromiseRef.current = null;
    bgErrorRef.current = null;
    setError(null);

    onClose();
  };

  const startBackgroundZipParsing = (zipFile: File): Promise<ZipAudioEntry[]> => {
    bgErrorRef.current = null;

    const promise = (async () => {
      try {
        const audioEntries = await parseZipEntries(zipFile);
        if (audioEntries.length === 0) {
          throw new Error('No valid audio files (WAV, FLAC, MP3, AIFF, OGG) found in this ZIP archive.');
        }
        setParsedEntries(audioEntries);
        return audioEntries;
      } catch (err: any) {
        throw new Error(err.message || 'Could not parse ZIP archive. Please ensure it is a valid ZIP file.');
      }
    })();

    bgParsePromiseRef.current = promise;
    promise.catch(err => {
      console.warn('Background zip parse error:', err);
      bgErrorRef.current = err.message || 'Failed to inspect ZIP file.';
      setError(err.message);
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

    // Fast, memory-safe central directory parsing via slice
    startBackgroundZipParsing(selected);
  };

  const uploadDirectToR2 = (
    uploadUrl: string,
    fileData: Blob,
    contentType: string,
    onProgress?: (percent: number) => void
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (isCancelledRef.current) {
        return reject(new Error('Upload cancelled.'));
      }

      const xhr = new XMLHttpRequest();
      activeXhrsRef.current.add(xhr);

      xhr.open('PUT', uploadUrl, true);
      xhr.setRequestHeader('Content-Type', contentType);

      xhr.upload.onprogress = (evt) => {
        if (isCancelledRef.current) return;
        if (evt.lengthComputable && onProgress) {
          const percent = Math.round((evt.loaded / evt.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        activeXhrsRef.current.delete(xhr);
        if (isCancelledRef.current) {
          reject(new Error('Upload cancelled.'));
        } else if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Storage server returned HTTP ${xhr.status}: ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => {
        activeXhrsRef.current.delete(xhr);
        reject(new Error('Storage upload failed. Please check network connection.'));
      };

      xhr.onabort = () => {
        activeXhrsRef.current.delete(xhr);
        reject(new Error('Upload cancelled.'));
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

    isCancelledRef.current = false;
    abortControllerRef.current = new AbortController();
    setUploading(true);
    setError(null);
    setStatusMessage('Reading ZIP archive structure...');
    setUploadProgress(5);

    try {
      // 1. Get parsed audio entries (wait for background promise if still running)
      let audioEntries = parsedEntries;
      if (bgErrorRef.current && !audioEntries) {
        bgErrorRef.current = null;
        audioEntries = await startBackgroundZipParsing(file);
      } else if (!audioEntries && bgParsePromiseRef.current) {
        audioEntries = await bgParsePromiseRef.current;
      } else if (!audioEntries) {
        audioEntries = await startBackgroundZipParsing(file);
      }

      if (isCancelledRef.current) return;

      const trackCount = audioEntries?.length || 0;
      setStatusMessage(`Found ${trackCount} audio tracks. Creating multitrack record...`);
      setUploadProgress(15);

      // 2. Create the Multi record in database (only pro users get is_pro = true)
      const multiRes = await fetch('/api/multis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          is_pro: isProUser,
        }),
        signal: abortControllerRef.current.signal,
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
      runningMultiIdRef.current = multiId;
      setCreatedMultiId(multiId);

      if (isCancelledRef.current) return;

      // 3. Upload the full ZIP archive directly to Cloudflare R2
      setStatusMessage('Uploading full multitrack session archive to cloud storage...');
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
          signal: abortControllerRef.current.signal,
        });

        if (zipPresignRes.ok) {
          const zipPresignData = await zipPresignRes.json();
          if (zipPresignData?.uploadUrl) {
            uploadedKeysRef.current.push(zipPresignData.key);
            await uploadDirectToR2(zipPresignData.uploadUrl, file, 'application/zip', (pct) => {
              setUploadProgress(15 + Math.round(pct * 0.45));
            });
            if (isCancelledRef.current) return;
            await fetch(`/api/multis/${multiId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                zip_r2_key: zipPresignData.key,
                zip_public_url: zipPresignData.publicUrl,
                zip_size_bytes: file.size,
              }),
              signal: abortControllerRef.current.signal,
            });
          }
        }
      } catch (zipUploadErr: any) {
        if (isCancelledRef.current) return;
        console.warn('Could not upload full zip archive to R2:', zipUploadErr);
      }

      if (isCancelledRef.current) return;

      // 4. Extract individual stem tracks for preview (if feasible, otherwise session is fully uploaded via ZIP)
      const mappings: RenameMapping[] = [];
      const usedNames = new Set<string>();

      if (audioEntries && audioEntries.length > 0) {
        for (let i = 0; i < audioEntries.length; i++) {
          if (isCancelledRef.current) return;

          const item = audioEntries[i];
          const storedName = sanitizeTrackFilename(item.filename, usedNames);
          usedNames.add(storedName.toLowerCase());

          const overallProgress = 60 + Math.round(((i + 1) / audioEntries.length) * 35);
          setUploadProgress(overallProgress);
          setStatusMessage(`Processing preview stem ${i + 1} of ${audioEntries.length}: ${storedName}...`);

          try {
            const blob = await extractZipEntry(file, item);
            if (isCancelledRef.current) return;

            // Request presigned URL
            const presignRes = await fetch('/api/storage/presign', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                filename: storedName,
                contentType: blob.type || 'audio/wav',
                folder: `multis/${multiId}`,
              }),
              signal: abortControllerRef.current.signal,
            });

            if (presignRes.ok) {
              const presignData = await presignRes.json();
              if (presignData?.uploadUrl) {
                uploadedKeysRef.current.push(presignData.key);
                await uploadDirectToR2(presignData.uploadUrl, blob, blob.type || 'audio/wav');
                if (isCancelledRef.current) return;

                await fetch(`/api/multis/${multiId}/tracks`, {
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
                  signal: abortControllerRef.current.signal,
                });

                mappings.push({
                  original: item.filename,
                  stored: storedName,
                  size_bytes: blob.size,
                  duration_seconds: null,
                });
              }
            }
          } catch (stemErr: any) {
            console.warn(`Could not extract individual stem ${item.filename}:`, stemErr);
          }
        }
      }

      setUploadProgress(100);
      setStatusMessage('Multitrack session uploaded and published successfully!');

      if (mappings.length > 0) {
        setResultMappings(mappings);
      } else {
        // Full session archive ready
        if (onSuccess) onSuccess(multiId);
        onClose();
        router.push(`/multis/${multiId}`);
      }
    } catch (err: any) {
      if (isCancelledRef.current) return;
      console.error('Upload multi error:', err);
      setError(err.message || 'Failed to process multitrack upload.');
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const handleFinish = () => {
    if (createdMultiId) {
      if (onSuccess) onSuccess(createdMultiId);
      onClose();
      router.push(`/multis/${createdMultiId}`);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[fade-in_0.15s_ease-out]">
      <div className="bg-[#121212] border border-neutral-800 rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800 sticky top-0 bg-[#121212] z-10">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <FileArchive className="w-5 h-5 text-neutral-300" />
              <span>Upload Multitrack Song (ZIP)</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Upload a ZIP multitrack archive. Audio files will be automatically validated and cleaned.
            </p>
          </div>
          <button
            onClick={handleCancel}
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

          {resultMappings ? (
            /* Success Screen: Track Cleaning Report */
            <div className="space-y-4">
              <div className="p-3 bg-emerald-950/40 border border-emerald-800/80 rounded-lg text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>
                  Successfully processed and uploaded {resultMappings.length} audio tracks to your multitrack pack!
                </span>
              </div>

              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2">
                  Track Filename Standardization Report
                </h4>
                <div className="bg-neutral-900 border border-neutral-800 rounded-lg max-h-60 overflow-y-auto divide-y divide-neutral-800/60 text-xs font-mono">
                  {resultMappings.map((m, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1 flex items-center gap-2">
                        <span className="text-neutral-400 truncate max-w-[45%]" title={m.original}>
                          {m.original}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                        <span className="text-emerald-300 font-semibold truncate" title={m.stored}>
                          {m.stored}
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-400 shrink-0">
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
                  className="bg-white hover:bg-neutral-200 text-black font-semibold text-xs px-4 py-2 rounded transition-colors"
                >
                  View Multitrack Pack
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* File Drop Area */}
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Multitrack ZIP Archive <span className="text-red-400">*</span>
                </label>
                <div className="relative border-2 border-dashed border-neutral-700 hover:border-neutral-500 rounded-lg p-6 text-center transition-colors bg-neutral-900/40 cursor-pointer">
                  <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                  {file ? (
                    <div>
                      <p className="text-xs font-medium text-white truncate max-w-xs mx-auto">
                        {file.name}
                      </p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        {(file.size / (1024 * 1024)).toFixed(1)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-neutral-300">
                        Click or drag and drop your session ZIP file here
                      </p>
                      <p className="text-[11px] text-neutral-400 mt-1">
                        Must contain audio files (.wav, .flac, .mp3, .aiff, .ogg)
                      </p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept=".zip,application/zip,application/x-zip-compressed"
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

              {/* Informative notice for Pro users - strictly NO checkbox */}
              {isProUser && (
                <div className="bg-amber-950/20 border border-amber-800/60 p-3 rounded-lg">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-white">Pro Multitrack</span>
                    <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-700/50">PREMIUM EXCLUSIVE</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">As a Pro member, your upload will be published directly to Pro Tracks for Premium members.</p>
                </div>
              )}

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
