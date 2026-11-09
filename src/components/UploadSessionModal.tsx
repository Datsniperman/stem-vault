'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Video,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
  Trash2,
} from 'lucide-react';
import { createRecordedSession } from '@/app/actions/sessions';

interface UploadSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function UploadSessionModal({ isOpen, onClose, onSuccess }: UploadSessionModalProps) {
  const [title, setTitle] = useState('');
  const [presenter, setPresenter] = useState('Tyler Kerpsack');
  const [description, setDescription] = useState('');

  // Video File state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [videoUploadProgress, setVideoUploadProgress] = useState<number | null>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);

  // Thumbnail File state
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbPreviewUrl, setThumbPreviewUrl] = useState<string | null>(null);
  const [thumbUploadProgress, setThumbUploadProgress] = useState<number | null>(null);
  const [uploadedThumbUrl, setUploadedThumbUrl] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const thumbInputRef = useRef<HTMLInputElement | null>(null);
  const activeXhrRef = useRef<XMLHttpRequest | null>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    if (activeXhrRef.current) {
      try {
        activeXhrRef.current.abort();
      } catch (e) {}
      activeXhrRef.current = null;
    }
    setTitle('');
    setPresenter('Tyler Kerpsack');
    setDescription('');
    setVideoFile(null);
    setVideoDuration(null);
    setVideoUploadProgress(null);
    setUploadedVideoUrl(null);
    setThumbFile(null);
    setThumbPreviewUrl(null);
    setThumbUploadProgress(null);
    setUploadedThumbUrl(null);
    setIsSubmitting(false);
    setStatusMessage(null);
    setError(null);
    onClose();
  };

  // Upload file via same-origin streaming endpoint to bypass cross-origin CORS limitations
  const uploadToStorage = async (
    file: File,
    folder: string,
    onProgress: (percent: number) => void
  ): Promise<string> => {
    const presignRes = await fetch('/api/storage/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
        folder,
      }),
    });

    if (!presignRes.ok) {
      const data = await presignRes.json().catch(() => null);
      throw new Error(data?.error || 'Failed to prepare cloud upload');
    }

    const { key, publicUrl } = await presignRes.json();
    const proxyUploadUrl = `/api/storage/upload?key=${encodeURIComponent(key)}`;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      activeXhrRef.current = xhr;
      xhr.open('PUT', proxyUploadUrl, true);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) {
          const percent = Math.round((evt.loaded / evt.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        activeXhrRef.current = null;
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(publicUrl);
        } else {
          try {
            const errJson = JSON.parse(xhr.responseText);
            reject(new Error(errJson.error || `Upload failed with status ${xhr.status}`));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => {
        activeXhrRef.current = null;
        reject(new Error('Network error during file upload. Check your connection.'));
      };

      xhr.send(file);
    });
  };

  const handleVideoSelect = (file: File) => {
    setVideoFile(file);
    setError(null);

    if (!title.trim()) {
      const clean = file.name
        .replace(/\.[a-zA-Z0-9]+$/, '')
        .replace(/[-_]/g, ' ')
        .trim();
      setTitle(clean);
    }

    const url = URL.createObjectURL(file);
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = url;
    tempVideo.onloadedmetadata = () => {
      if (tempVideo.duration && !isNaN(tempVideo.duration)) {
        setVideoDuration(Math.round(tempVideo.duration));
      }
      URL.revokeObjectURL(url);
    };
  };

  const handleThumbSelect = (file: File) => {
    setThumbFile(file);
    const preview = URL.createObjectURL(file);
    setThumbPreviewUrl(preview);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Please provide a session title.');
      return;
    }

    if (!videoFile && !uploadedVideoUrl) {
      setError('Please select a video file to upload.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let finalVideoUrl = uploadedVideoUrl;
      let finalThumbUrl = uploadedThumbUrl;

      // 1. Upload Video if not yet uploaded
      if (videoFile && !finalVideoUrl) {
        setStatusMessage('Uploading video to Cloudflare storage...');
        finalVideoUrl = await uploadToStorage(videoFile, 'sessions', (percent) => {
          setVideoUploadProgress(percent);
          setStatusMessage(`Uploading video: ${percent}%`);
        });
        setUploadedVideoUrl(finalVideoUrl);
      }

      // 2. Upload Thumbnail if provided
      if (thumbFile && !finalThumbUrl) {
        setStatusMessage('Uploading thumbnail image...');
        finalThumbUrl = await uploadToStorage(thumbFile, 'thumbnails', (percent) => {
          setThumbUploadProgress(percent);
        });
        setUploadedThumbUrl(finalThumbUrl);
      }

      // 3. Create Session Record in Database
      setStatusMessage('Publishing recorded session to vault...');
      const res = await createRecordedSession({
        title: title.trim(),
        description: description.trim() || undefined,
        presenter: presenter.trim() || undefined,
        duration_seconds: videoDuration || undefined,
        storage_provider: 'hls',
        video_asset_id: finalVideoUrl!,
        video_url: finalVideoUrl!,
        thumbnail_url: finalThumbUrl || undefined,
        published: true,
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to save session');
      }

      onSuccess();
      handleReset();
    } catch (err: any) {
      setError(err.message || 'An error occurred during upload.');
    } finally {
      setIsSubmitting(false);
      setStatusMessage(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Upload Recorded Session</h2>
              <p className="text-xs text-neutral-400">Directly upload video and thumbnail to the member vault</p>
            </div>
          </div>
          <button
            onClick={handleReset}
            disabled={isSubmitting}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-sm">
          {error && (
            <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Video Dropzone */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Video File <span className="text-red-400">*</span>
            </label>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*,.mp4,.mov,.webm,.m4v"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleVideoSelect(f);
              }}
              className="hidden"
            />

            {!videoFile ? (
              <div
                onClick={() => videoInputRef.current?.click()}
                className="border-2 border-dashed border-neutral-800 hover:border-emerald-500/50 rounded-xl p-6 text-center cursor-pointer transition-colors bg-neutral-950/40 hover:bg-neutral-950 group"
              >
                <Video className="w-8 h-8 text-neutral-600 group-hover:text-emerald-400 mx-auto mb-2 transition-colors" />
                <div className="text-xs font-medium text-white mb-1">
                  Click or drag video file here
                </div>
                <div className="text-[11px] text-neutral-500">
                  MP4, MOV, or WebM (Direct Cloudflare storage)
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                    <Video className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-medium text-white truncate">{videoFile.name}</div>
                    <div className="text-[11px] text-neutral-500">
                      {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
                      {videoDuration ? ` • ${Math.floor(videoDuration / 60)} min` : ''}
                    </div>
                  </div>
                </div>

                {!isSubmitting && (
                  <button
                    type="button"
                    onClick={() => {
                      setVideoFile(null);
                      setUploadedVideoUrl(null);
                      setVideoUploadProgress(null);
                    }}
                    className="text-neutral-500 hover:text-red-400 p-1.5 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Video Upload Progress Bar */}
            {videoUploadProgress !== null && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-neutral-400">
                  <span>Uploading video...</span>
                  <span className="font-mono">{videoUploadProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-200"
                    style={{ width: `${videoUploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Thumbnail Dropzone */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Thumbnail Cover Image (Optional)
            </label>
            <input
              ref={thumbInputRef}
              type="file"
              accept="image/*,.jpg,.jpeg,.png,.webp"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleThumbSelect(f);
              }}
              className="hidden"
            />

            {!thumbPreviewUrl ? (
              <div
                onClick={() => thumbInputRef.current?.click()}
                className="border-2 border-dashed border-neutral-800 hover:border-emerald-500/50 rounded-xl p-4 text-center cursor-pointer transition-colors bg-neutral-950/40 hover:bg-neutral-950 group flex items-center justify-center gap-3"
              >
                <ImageIcon className="w-5 h-5 text-neutral-600 group-hover:text-emerald-400 transition-colors" />
                <span className="text-xs text-neutral-400 group-hover:text-neutral-200">
                  Select or drop a cover image (JPG, PNG, WebP)
                </span>
              </div>
            ) : (
              <div className="relative aspect-video rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 group">
                <img src={thumbPreviewUrl} alt="Thumbnail preview" className="w-full h-full object-cover" />
                {!isSubmitting && (
                  <button
                    type="button"
                    onClick={() => {
                      setThumbFile(null);
                      setThumbPreviewUrl(null);
                      setUploadedThumbUrl(null);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/80 hover:bg-red-950 text-white transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Session Details */}
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
            <label className="block text-xs font-medium text-neutral-300 mb-1">Description (Optional)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Session breakdown, topics covered, routing techniques..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500 text-xs"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-3 flex items-center justify-between border-t border-neutral-800">
            <span className="text-xs text-neutral-500">
              {statusMessage || ''}
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleReset}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg text-xs font-medium text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !videoFile}
                className="px-5 py-2 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-black transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload & Publish</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
