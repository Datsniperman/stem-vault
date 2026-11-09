'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import {
  Sliders,
  Download,
  FileAudio,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  CheckCircle2,
  FolderArchive,
} from 'lucide-react';
import { detectTrackCategory } from '@/lib/daw/colorMap';

interface TrackItem {
  id: string;
  name: string;
  filename: string;
}

export default function DawConverterPage() {
  const [title, setTitle] = useState('');
  const [bpm, setBpm] = useState<number | ''>(120);
  const [targetFormat, setTargetFormat] = useState<'reaper' | 'ableton' | 'dawproject'>('reaper');
  const [tracks, setTracks] = useState<TrackItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesDropped = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newTracks: TrackItem[] = Array.from(files).map((f) => {
      const cleanName = f.name.replace(/\.[a-zA-Z0-9]+$/, '').replace(/[-_]/g, ' ');
      return {
        id: Math.random().toString(36).slice(2),
        name: cleanName,
        filename: f.name,
      };
    });

    setTracks((prev) => [...prev, ...newTracks]);
    if (!title && files[0]) {
      setTitle(files[0].name.replace(/\.[a-zA-Z0-9]+$/, '').replace(/[-_]/g, ' '));
    }
  };

  const handleAddManualTrack = () => {
    const num = tracks.length + 1;
    setTracks((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        name: `Track ${num}`,
        filename: `Track_${num}.wav`,
      },
    ]);
  };

  const handleRemoveTrack = (id: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleTrackChange = (id: string, field: 'name' | 'filename', val: string) => {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const updated = { ...t, [field]: val };
        if (field === 'name' && !t.filename.endsWith('.wav')) {
          updated.filename = `${val.replace(/\s+/g, '_')}.wav`;
        }
        return updated;
      })
    );
  };

  const handleGenerate = async () => {
    if (!title.trim()) {
      setError('Please provide a project title.');
      return;
    }
    if (tracks.length === 0) {
      setError('Please add or drop at least one track.');
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      const res = await fetch('/api/daw/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          bpm: bpm || 120,
          targetFormat,
          tracks,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `Server returned HTTP ${res.status}`);
      }

      // Trigger file download in browser
      const blob = await res.blob();
      const safeTitle = title.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
      const ext = targetFormat === 'reaper' ? 'rpp' : targetFormat === 'ableton' ? 'als' : 'dawproject';
      const filename = `${safeTitle}.${ext}`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Failed to generate DAW project.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Title Header */}
        <div className="mb-8 border-b border-neutral-800 pb-6">
          <div className="flex items-center gap-3 text-cyan-400 text-xs font-mono uppercase tracking-wider mb-2">
            <Sliders className="w-4 h-4" />
            <span>Cross-Platform Studio Utilities</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            DAW Session Generator & Converter
          </h1>
          <p className="text-sm text-neutral-400 max-w-3xl">
            Convert multitrack stems or project structures into native, color-coded, ready-to-open session
            files for your digital audio workstation. No source DAW software required.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="underline hover:text-white">
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Settings & Target DAW */}
          <div className="space-y-6">
            <div className="p-5 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Project Parameters</span>
              </h2>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  Song / Session Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Sunday Service Worship Mix"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  Tempo (BPM)
                </label>
                <input
                  type="number"
                  value={bpm}
                  onChange={(e) => setBpm(e.target.value ? Number(e.target.value) : '')}
                  placeholder="120"
                  min="20"
                  max="300"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-2">
                  Target Destination DAW
                </label>
                <div className="space-y-2">
                  <label
                    className={`flex items-center gap-3 p-2.5 rounded border cursor-pointer transition-colors ${
                      targetFormat === 'reaper'
                        ? 'bg-neutral-800 border-cyan-500 text-white'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="format"
                      checked={targetFormat === 'reaper'}
                      onChange={() => setTargetFormat('reaper')}
                      className="sr-only"
                    />
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0" />
                    <div>
                      <div className="text-xs font-medium">REAPER (.rpp)</div>
                      <div className="text-[10px] text-neutral-500">
                        Tracks, color grouping, aligned timeline items
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-3 p-2.5 rounded border cursor-pointer transition-colors ${
                      targetFormat === 'ableton'
                        ? 'bg-neutral-800 border-cyan-500 text-white'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="format"
                      checked={targetFormat === 'ableton'}
                      onChange={() => setTargetFormat('ableton')}
                      className="sr-only"
                    />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 shrink-0" />
                    <div>
                      <div className="text-xs font-medium">Ableton Live (.als)</div>
                      <div className="text-[10px] text-neutral-500">
                        Arranger audio tracks, clip timeline, auto-coloring
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-3 p-2.5 rounded border cursor-pointer transition-colors ${
                      targetFormat === 'dawproject'
                        ? 'bg-neutral-800 border-cyan-500 text-white'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="format"
                      checked={targetFormat === 'dawproject'}
                      onChange={() => setTargetFormat('dawproject')}
                      className="sr-only"
                    />
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-400 shrink-0" />
                    <div>
                      <div className="text-xs font-medium">DAWproject (.dawproject)</div>
                      <div className="text-[10px] text-neutral-500">
                        Universal standard (Studio One, Bitwig Studio)
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating || tracks.length === 0}
                className="w-full bg-white hover:bg-neutral-200 disabled:opacity-40 text-black font-semibold text-xs px-4 py-2.5 rounded transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                <span>{isGenerating ? 'Packaging Session...' : 'Generate Project File'}</span>
              </button>
            </div>

            {/* Instruction Tip */}
            <div className="p-4 rounded-lg bg-neutral-900/30 border border-neutral-800/80 text-xs text-neutral-400 space-y-2">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                <span>How to use:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-neutral-400 leading-relaxed">
                <li>Add your stem filenames or drop audio tracks.</li>
                <li>Pick your DAW format (REAPER, Ableton, or DAWproject).</li>
                <li>Click Generate to download the project file.</li>
                <li>Place the project file in the same folder as your audio stems and double click to open!</li>
              </ol>
            </div>
          </div>

          {/* Right Column: Track List & Dropzone */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-5 rounded-lg bg-neutral-900/60 border border-neutral-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                  <FileAudio className="w-4 h-4 text-neutral-400" />
                  <span>Session Tracks ({tracks.length})</span>
                </h2>
                <button
                  onClick={handleAddManualTrack}
                  className="bg-neutral-800 hover:bg-neutral-700 text-white text-xs px-2.5 py-1.5 rounded transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Track</span>
                </button>
              </div>

              {/* Drag and Drop Zone */}
              <label className="block border-2 border-dashed border-neutral-800 hover:border-neutral-700 rounded-lg p-6 text-center cursor-pointer transition-colors mb-4 group">
                <input
                  type="file"
                  multiple
                  accept="audio/*,.wav,.flac,.mp3,.aiff,.ogg"
                  onChange={handleFilesDropped}
                  className="hidden"
                />
                <FolderArchive className="w-8 h-8 text-neutral-600 group-hover:text-cyan-400 mx-auto mb-2 transition-colors" />
                <div className="text-xs font-medium text-white mb-1">
                  Drop audio stem files here to auto-populate track names
                </div>
                <div className="text-[11px] text-neutral-500">
                  WAV, FLAC, MP3, AIFF - audio files are not uploaded to any server; metadata is parsed locally
                </div>
              </label>

              {/* Tracks List */}
              {tracks.length === 0 ? (
                <div className="text-center py-8 text-xs text-neutral-500">
                  No tracks added yet. Drop files above or click &quot;Add Track&quot;.
                </div>
              ) : (
                <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                  {tracks.map((t, idx) => {
                    const cat = detectTrackCategory(t.name);
                    return (
                      <div
                        key={t.id}
                        className="flex items-center gap-3 p-2.5 rounded bg-neutral-950 border border-neutral-800/80 text-xs"
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.colorHex }}
                          title={`Detected instrument: ${cat.category}`}
                        />
                        <span className="font-mono text-neutral-500 w-6 text-right shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={t.name}
                          onChange={(e) => handleTrackChange(t.id, 'name', e.target.value)}
                          placeholder="Track name"
                          className="flex-1 bg-transparent border-b border-transparent hover:border-neutral-700 focus:border-cyan-500 text-white px-1 py-0.5 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={t.filename}
                          onChange={(e) => handleTrackChange(t.id, 'filename', e.target.value)}
                          placeholder="filename.wav"
                          className="w-36 sm:w-48 bg-neutral-900/60 border border-neutral-800 rounded px-2 py-1 text-neutral-400 text-[11px] focus:outline-none font-mono"
                        />
                        <button
                          onClick={() => handleRemoveTrack(t.id)}
                          className="text-neutral-500 hover:text-red-400 p-1 transition-colors"
                          title="Remove track"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
