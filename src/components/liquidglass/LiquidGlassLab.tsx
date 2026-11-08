'use client';

import React, { useState, useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import {
  Glass,
  Button,
  Slider,
  SegmentedControl,
  Switch,
  Toolbar,
  ToolbarGroup,
} from '@onlymoein/liquidglass';
import { useBetaTheme, Wallpaper, AppTheme } from '@/context/BetaThemeContext';
import { refracts, browserName, refit, useThrow } from '@/lib/liquidglass';
import { Play, Pause, Volume2, Sparkles, Sliders, Copy, Check, Disc3, Layers } from 'lucide-react';

const WALLPAPERS: { value: Wallpaper; label: string }[] = [
  { value: 'dusk', label: 'Dusk' },
  { value: 'flow', label: 'Flow' },
  { value: 'dawn', label: 'Dawn' },
  { value: 'lines', label: 'Lines' },
  { value: 'obsidian', label: 'Obsidian' },
];

const THEMES: { value: AppTheme; label: string }[] = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'Auto' },
];

function Lens({
  style,
  size,
  label,
  kick,
  onMove,
  start,
  children,
}: {
  style?: CSSProperties;
  size: 'hero' | 'lab';
  label: string;
  kick?: { x: number; y: number };
  onMove?: () => void;
  start: Parameters<typeof useThrow>[1]['start'];
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useThrow(ref, { start, kick, onMove });

  return (
    <div ref={ref} className="drag" data-size={size} role="group" tabIndex={0} aria-label={label}>
      <Glass className="lens" style={style}>
        {children}
      </Glass>
    </div>
  );
}

function Field({ label, value, children }: { label: string; value?: string; children: ReactNode }) {
  return (
    <div className="field">
      <div className="field-label">
        <span>{label}</span>
        {value ? <output>{value}</output> : null}
      </div>
      {children}
    </div>
  );
}

export function LiquidGlassLab() {
  const {
    wallpaper,
    setWallpaper,
    theme,
    setTheme,
    transparency,
    setTransparency,
    bend,
    setBend,
    rim,
    setRim,
    zoom,
    setZoom,
    shine,
    setShine,
  } = useBetaTheme();

  const [touched, setTouched] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const stageRef = useRef<HTMLDivElement>(null);

  const bends = refracts();

  // Trigger refit whenever lens variables change
  useEffect(() => {
    if (stageRef.current) {
      refit(stageRef.current);
    }
  }, [bend, rim, zoom, shine, transparency]);

  const lensVars: CSSProperties = {
    '--lg-thickness': bend,
    '--lg-bezel': rim,
    '--lg-zoom': zoom,
    '--lg-shine': shine,
    '--lg-transparency': transparency,
  } as CSSProperties;

  const generatedCss = `:root {
  --lg-transparency: ${transparency.toFixed(2)};
  --lg-thickness: ${bend};
  --lg-bezel: ${rim};
  --lg-zoom: ${zoom.toFixed(2)};
  --lg-shine: ${shine.toFixed(2)};
}`;

  const handleCopyCss = async () => {
    try {
      await navigator.clipboard.writeText(generatedCss);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Lab Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium text-white mb-3">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span>Interactive Liquid Glass Optics Lab</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
          Liquid Glass Studio Lab
        </h1>
        <p className="text-sm sm:text-base text-neutral-300 max-w-2xl">
          Apple iOS 27 Liquid Glass for The Mixing Vault. Grab the lens and drag it across the multitrack specimens below to experience dynamic optical refraction, light bending, and real-time audio controls.
        </p>
      </div>

      {/* Main Grid: Interactive Stage + Live Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Stage Area (7 cols) */}
        <div className="lg:col-span-7">
          <div className="stage lab-stage" ref={stageRef}>
            {/* Background Studio Specimen Elements (Visible through refractive glass) */}
            <div className="specimen">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-xs text-neutral-300">
                <Disc3 className="w-3.5 h-3.5 text-emerald-400 animate-spin" style={{ animationDuration: '4s' }} />
                <span>MULTITRACK SESSION / 24-BIT 48kHz</span>
              </div>

              <div className="text-center font-black tracking-tighter text-5xl sm:text-7xl opacity-90 drop-shadow-md">
                VAULT 27
              </div>

              {/* Fake Audio Waveform & Stem Meters */}
              <div className="flex items-end justify-center gap-1.5 h-16 w-full max-w-md my-2 px-4 py-2 rounded-2xl bg-black/30 backdrop-blur-md border border-white/10">
                {[40, 65, 85, 30, 95, 70, 50, 100, 45, 80, 60, 90, 75, 35, 85, 55, 95, 40].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-full bg-linear-to-t from-sky-500 via-indigo-400 to-pink-400 transition-all duration-300"
                    style={{
                      height: `${isPlaying ? Math.max(15, (h + Math.sin(i) * 30) % 100) : h * 0.5}%`,
                      opacity: isPlaying ? 0.95 : 0.6,
                    }}
                  />
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 text-left w-full max-w-md text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-black/40 backdrop-blur-sm border border-white/10">
                  <div className="text-neutral-400 text-[10px]">LEAD VOCAL STEM</div>
                  <div className="text-white font-bold">128 BPM • C# Minor</div>
                </div>
                <div className="p-2.5 rounded-xl bg-black/40 backdrop-blur-sm border border-white/10">
                  <div className="text-neutral-400 text-[10px]">TRUE PEAK / LUFS</div>
                  <div className="text-emerald-400 font-bold">-0.3 dB • -14.1 LUFS</div>
                </div>
              </div>
            </div>

            {/* Draggable Refractive Lens */}
            <Lens
              size="lab"
              label="Interactive Liquid Glass Lens. Drag or throw it across the session."
              style={bends ? lensVars : undefined}
              kick={{ x: -400, y: 40 }}
              onMove={() => setTouched(true)}
              start={(room, own) => ({
                x: (room.width - own.width) / 2,
                y: (room.height - own.height) / 2,
              })}
            >
              <div className="flex flex-col items-center gap-1 pointer-events-none">
                <span className="lens-hint" data-gone={touched || undefined}>
                  Drag &amp; Throw Me
                </span>
                <span className="text-[10px] font-mono tracking-wider uppercase text-white/70">
                  {zoom.toFixed(2)}× LENS
                </span>
              </div>
            </Lens>
          </div>
        </div>

        {/* Controls Panel (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="lab-controls text-white">
            <div className="flex items-center justify-between pb-3 border-b border-white/15">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Sliders className="w-5 h-5 text-sky-400" />
                <span>Optics &amp; Environment</span>
              </h3>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/15">
                {browserName()} {bends ? '✓ Refraction Active' : '• Fallback Frost'}
              </span>
            </div>

            {/* Transparency */}
            <Field
              label="Glass Transparency"
              value={transparency < 0.4 ? 'Tinted' : transparency > 0.7 ? 'Ultra Clear' : 'Balanced Glass'}
            >
              <Slider
                aria-label="Transparency"
                value={transparency * 100}
                min={10}
                max={100}
                onValueChange={(val) => setTransparency(val / 100)}
              />
            </Field>

            {/* Wallpaper Switcher */}
            <Field label="Ambient Wallpaper">
              <SegmentedControl
                aria-label="Wallpaper"
                value={wallpaper}
                onValueChange={(val) => setWallpaper(val as Wallpaper)}
                items={WALLPAPERS}
              />
            </Field>

            {/* Appearance Switcher */}
            <Field label="Color Theme">
              <SegmentedControl
                aria-label="Theme"
                value={theme}
                onValueChange={(val) => setTheme(val as AppTheme)}
                items={THEMES}
              />
            </Field>

            <div className="pt-4 border-t border-white/15 flex flex-col gap-4">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-neutral-300">
                Lens Physics &amp; Light Curve
              </h4>

              {/* Bend (Thickness) */}
              <Field label="Lens Bend (Thickness)" value={String(bend)}>
                <Slider
                  aria-label="Bend"
                  value={bend}
                  min={0}
                  max={70}
                  disabled={!bends}
                  onValueChange={(val) => setBend(Math.round(val))}
                />
              </Field>

              {/* Rim Width (Bezel) */}
              <Field label="Rim Bezel Width" value={String(rim)}>
                <Slider
                  aria-label="Rim width"
                  value={rim}
                  min={3}
                  max={60}
                  disabled={!bends}
                  onValueChange={(val) => setRim(Math.round(val))}
                />
              </Field>

              {/* Magnification Zoom */}
              <Field label="Optical Zoom" value={`${zoom.toFixed(2)}×`}>
                <Slider
                  aria-label="Zoom"
                  value={zoom * 100}
                  min={100}
                  max={170}
                  disabled={!bends}
                  onValueChange={(val) => setZoom(val / 100)}
                />
              </Field>

              {/* Specular Shine */}
              <Field label="Rim Highlight Shine" value={`${(shine * 100).toFixed(0)}%`}>
                <Slider
                  aria-label="Shine"
                  value={shine * 100}
                  min={0}
                  max={200}
                  onValueChange={(val) => setShine(val / 100)}
                />
              </Field>
            </div>

            {/* CSS Token Generator */}
            <div className="pt-4 border-t border-white/15">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase text-neutral-400">Generated CSS Tokens</span>
                <Button size="small" onClick={handleCopyCss}>
                  {copied ? (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <Check className="w-3.5 h-3.5" /> Copied
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Copy className="w-3.5 h-3.5" /> Copy CSS
                    </span>
                  )}
                </Button>
              </div>
              <pre className="snippet text-neutral-200">
                <code>{generatedCss}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Audio Controls Showcase in Liquid Glass */}
      <div className="mt-12 pt-8 border-t border-white/15">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Layers className="w-6 h-6 text-sky-400" />
          <span>Liquid Glass Audio Components</span>
        </h2>
        <p className="text-sm text-neutral-300 mb-6 max-w-xl">
          Custom interactive playback and studio mixing controls rendered directly with iOS Liquid Glass materials.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Player Controller */}
          <Glass style={{ padding: '24px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-neutral-400 uppercase">Stem Audition Bar</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>

            <div>
              <div className="text-base font-bold text-white">Lead Vocal Stems - Master Bus</div>
              <div className="text-xs text-neutral-400">Tyler Kerpsack • 9 Isolated Tracks</div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="filled"
                size="regular"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                <span>{isPlaying ? 'Pause' : 'Audition'}</span>
              </Button>
              <Button size="regular">Solo Stems</Button>
            </div>

            <div className="pt-2">
              <div className="flex justify-between text-xs text-neutral-400 mb-1.5 font-mono">
                <span>01:14</span>
                <span>03:45</span>
              </div>
              <Slider defaultValue={32} min={0} max={100} aria-label="Playback scrubber" />
            </div>
          </Glass>

          {/* Card 2: Volume & Monitoring */}
          <Glass style={{ padding: '24px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <span className="text-xs font-mono text-neutral-400 uppercase">Monitor Levels</span>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-sky-400" />
                Headphone Monitor
              </span>
              <span className="text-xs font-mono text-white/80">{volume}%</span>
            </div>

            <Slider
              value={volume}
              min={0}
              max={100}
              aria-label="Monitor Volume"
              onValueChange={setVolume}
            />

            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <span className="text-sm text-neutral-300">Dim Output (-20dB)</span>
              <Switch aria-label="Dim Output" defaultChecked={false} />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-300">Mono Sum</span>
              <Switch aria-label="Mono Sum" defaultChecked={false} />
            </div>
          </Glass>

          {/* Card 3: Multitrack Download Packaging */}
          <Glass style={{ padding: '24px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'space-between' }}>
            <div>
              <span className="text-xs font-mono text-neutral-400 uppercase">Cloudflare R2 Direct</span>
              <div className="text-base font-bold text-white mt-1">Lossless Multitrack ZIP</div>
              <p className="text-xs text-neutral-300 mt-2">
                All 24-bit 48kHz WAV audio tracks packaged losslessly into a single uncompressed ZIP archive with zero egress bandwidth throttling.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button variant="filled" size="regular">
                Download Entire Session (.ZIP)
              </Button>
              <Button size="regular">
                Browse 9 Isolated Audio Stems
              </Button>
            </div>
          </Glass>
        </div>
      </div>
    </div>
  );
}
