'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Download, Loader2, Music2 } from 'lucide-react';
import { AudioVisualizer } from '@/components/ui/audio-visualizer';

interface AudioPlayerProps {
  src: string;
  downloadUrl?: string;
  downloadFilename?: string;
  format?: string;
  title?: string;
  sizeBytes?: number;
  showDownload?: boolean;
}

export function AudioPlayer({
  src,
  downloadUrl,
  downloadFilename,
  format,
  title,
  sizeBytes,
  showDownload = false,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
      setIsLoading(false);
    };
    const onWaiting = () => setIsLoading(true);
    const onPlaying = () => setIsLoading(false);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(err => {
        console.warn('Playback error:', err);
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = parseFloat(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const val = parseFloat(e.target.value);
    audio.volume = val;
    setVolume(val);
    if (val === 0) setIsMuted(true);
    else if (isMuted) setIsMuted(false);
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs) || !isFinite(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  const dlUrl =
    downloadUrl ||
    (downloadFilename
      ? `/api/storage/download?key=${encodeURIComponent(src.replace('/api/storage/raw/', ''))}&filename=${encodeURIComponent(downloadFilename)}`
      : src);

  return (
    <div className="w-full bg-[#111115]/90 border border-white/[0.08] hover:border-white/[0.14] rounded-2xl p-3.5 transition-all shadow-sm">
      <audio ref={audioRef} src={src} preload="metadata" />

      <div className="flex items-center justify-between gap-3">
        {/* Play / Pause Pill Button */}
        <button
          onClick={togglePlay}
          className="w-9 h-9 rounded-full bg-white hover:bg-neutral-200 text-black flex items-center justify-center shrink-0 transition-all hover:scale-105 active:scale-95 shadow-md"
          title={isPlaying ? 'Pause' : 'Play'}
          aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current translate-x-0.5" />
          )}
        </button>

        {/* Track Title, Visualizer & Format Badges */}
        <div className="min-w-0 flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-2">
            {title && (
              <span className="text-xs font-semibold text-white truncate max-w-[240px] sm:max-w-md">
                {title}
              </span>
            )}

            <AudioVisualizer isPlaying={isPlaying} bars={4} className="shrink-0" />

            {format && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.04] text-neutral-300 border border-white/[0.08] shrink-0">
                {format.toUpperCase()}
              </span>
            )}

            {sizeBytes && sizeBytes > 0 && (
              <span className="text-[10px] font-mono text-neutral-500 shrink-0 hidden sm:inline">
                {formatSize(sizeBytes)}
              </span>
            )}
          </div>
        </div>

        {/* Right Action: Download & Volume Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Download Action */}
          {showDownload && (
            <a
              href={dlUrl}
              download={downloadFilename || true}
              className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              title="Download Lossless Track"
            >
              <Download className="w-4 h-4" />
            </a>
          )}

          {/* Volume Control */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={toggleMute}
              className="p-1.5 rounded-full text-neutral-400 hover:text-white transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-3.5 h-3.5" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-white"
              title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
            />
          </div>
        </div>
      </div>

      {/* Progress Bar & Scrubber */}
      <div className="flex items-center gap-2.5 mt-2.5 pt-2 border-t border-white/[0.04]">
        <span className="text-[10px] font-mono text-neutral-400 w-9 text-right shrink-0">
          {formatTime(currentTime)}
        </span>

        <div className="relative flex-1 flex items-center h-4 group">
          <input
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            title="Seek playback"
          />
          {/* Track background */}
          <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden group-hover:h-1.5 transition-all">
            <div
              className="h-full bg-neutral-200 group-hover:bg-white rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <span className="text-[10px] font-mono text-neutral-400 w-9 text-left shrink-0">
          {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}
