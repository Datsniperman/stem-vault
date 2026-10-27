'use client';

import { useState, useEffect } from 'react';
import { X, AlertCircle, Link as LinkIcon, Edit3 } from 'lucide-react';
import { updateStem } from '@/app/actions/stems';
import { Stem } from '@/types';
import { useToast } from '@/context/ToastContext';
import { clsx } from 'clsx';

const HOST_PLATFORMS = ['Google Drive', 'Dropbox', 'OneDrive', 'Box', 'Other'];
const FORMATS = [
  'WAV (48kHz/24-bit)',
  'WAV (44.1kHz/16-bit)',
  'FLAC',
  'Multitrack Zip',
];

interface EditStemModalProps {
  isOpen: boolean;
  stem: Stem | null;
  onClose: () => void;
  onStemUpdated: (updatedStem: Stem) => void;
}

export function EditStemModal({ isOpen, stem, onClose, onStemUpdated }: EditStemModalProps) {
  const { addToast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    download_url: '',
    daw_template_url: '',
    host_platform: 'Google Drive',
    format: 'WAV (48kHz/24-bit)',
    bpm: '',
    key: '',
    track_count: '',
    description: '',
    tags: '',
  });

  useEffect(() => {
    if (stem) {
      setFormData({
        title: stem.title || '',
        artist: stem.artist || '',
        download_url: stem.download_url || '',
        daw_template_url: stem.daw_template_url || '',
        host_platform: stem.host_platform || 'Google Drive',
        format: stem.format || 'WAV (48kHz/24-bit)',
        bpm: stem.bpm ? String(stem.bpm) : '',
        key: stem.key || '',
        track_count: stem.track_count ? String(stem.track_count) : '',
        description: stem.description || '',
        tags: (stem.tags || []).join(', '),
      });
      setErrors({});
    }
  }, [stem, isOpen]);

  if (!isOpen || !stem) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setErrors({});

    const data = new FormData();
    Object.entries(formData).forEach(([key, val]) => {
      data.append(key, val);
    });

    const res = await updateStem(stem.id, data);
    setIsPending(false);

    if (res.success) {
      addToast(res.message, 'success');
      if (res.stem) {
        onStemUpdated(res.stem);
      }
      onClose();
    } else {
      if (res.errors) {
        setErrors(res.errors);
      }
      addToast(res.message, 'error');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-md animate-[fade-in_0.15s_ease-out]"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface-raised border border-border/80 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-m3-3 flex flex-col">

        {/* Header */}
        <div className="px-6 py-5 border-b border-border/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber/15 border border-amber/30 flex items-center justify-center text-amber">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-warm-white">Edit Stem Session</h2>
              <p className="text-dim text-xs font-body mt-0.5">
                Updating <span className="text-amber font-medium">{stem.title}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-dim hover:text-warm-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Errors list if any */}
        {errors && Object.keys(errors).length > 0 && (
          <div className="mx-6 mt-4 border border-error/30 bg-error/10 rounded-2xl px-4 py-3 shrink-0">
            <p className="text-xs text-error mb-1.5 font-semibold">Please fix these errors:</p>
            <ul className="space-y-1">
              {Object.entries(errors).map(([field, msg]) => (
                <li key={field} className="text-xs text-error flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {msg}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-5 space-y-4 flex-1">

          {/* Row 1: Title + Church/Artist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Song Title *" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Gratitude" error={errors?.title} />
            <Field label="Church / Artist *" name="artist" value={formData.artist} onChange={handleChange} placeholder="e.g. Elevation Worship" error={errors?.artist} />
          </div>

          {/* Row 2: Cloud Link */}
          <Field
            label="Cloud Link *"
            name="download_url"
            type="url"
            value={formData.download_url}
            onChange={handleChange}
            placeholder="https://drive.google.com/…"
            error={errors?.download_url}
          />

          {/* Row 2.5: DAW Template Link */}
          <Field
            label="DAW Template Link (Optional)"
            name="daw_template_url"
            type="url"
            value={formData.daw_template_url}
            onChange={handleChange}
            placeholder="https://drive.google.com/… (Logic Pro, Pro Tools, Reaper session)"
            error={errors?.daw_template_url}
          />

          {/* Row 3: Platform + Format */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField label="Host Platform" name="host_platform" value={formData.host_platform} onChange={handleChange} options={HOST_PLATFORMS} />
            <SelectField label="Audio Format" name="format" value={formData.format} onChange={handleChange} options={FORMATS} />
          </div>

          {/* Row 4: BPM + Key + Track Count */}
          <div className="grid grid-cols-3 gap-4">
            <Field label="BPM" name="bpm" type="number" value={formData.bpm} onChange={handleChange} placeholder="72" inputMode="numeric" min={30} max={300} error={errors?.bpm} />
            <Field label="Key" name="key" value={formData.key} onChange={handleChange} placeholder="Bb" />
            <Field label="Track Count" name="track_count" type="number" value={formData.track_count} onChange={handleChange} placeholder="36" inputMode="numeric" min={1} max={128} error={errors?.track_count} />
          </div>

          {/* Row 5: Description / Special Notes */}
          <div className="space-y-1.5">
            <label htmlFor="edit-description" className="block text-xs text-mid font-medium flex items-center justify-between">
              <span>Special Notes / Description (Optional)</span>
              <span className="text-[10px] text-dim">Key changes, extra stems, instructions</span>
            </label>
            <textarea
              id="edit-description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="e.g. Includes live drums, click track in Bb, and organ stems..."
              className="w-full bg-surface-high border border-border/80 rounded-xl px-3.5 py-2.5 text-warm-white text-xs focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber/40 placeholder:text-dim/40 transition-colors resize-none"
            />
          </div>

          {/* Row 6: Tags */}
          <div className="space-y-1.5">
            <label htmlFor="edit-tags" className="block text-xs text-mid font-medium flex items-center justify-between">
              <span>Tags (Optional)</span>
              <span className="text-[10px] text-dim">Comma-separated, max 8</span>
            </label>
            <input
              id="edit-tags"
              name="tags"
              type="text"
              value={formData.tags}
              onChange={handleChange}
              placeholder="e.g. worship, live, click track, drums split"
              className="w-full bg-surface-high border border-border/80 rounded-xl px-3.5 py-2 text-warm-white text-xs focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber/40 placeholder:text-dim/40 transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2.5 pt-3 border-t border-border/60">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-dim hover:text-warm-white px-4 py-2.5 rounded-full hover:bg-surface-high font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={clsx(
                'bg-amber hover:bg-amber-muted text-obsidian font-bold text-xs px-6 py-2.5 rounded-full',
                'transition-all shadow-m3-1 hover:shadow-m3-2 active:scale-95',
                isPending && 'opacity-60 cursor-not-allowed'
              )}
            >
              {isPending ? 'Saving Changes…' : 'Save Session Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  error?: string;
}

function Field({ label, name, error, ...rest }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-xs text-mid font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        {...rest}
        className={clsx(
          'w-full bg-surface-high border rounded-xl px-3.5 py-2 text-warm-white text-xs',
          'focus:outline-none placeholder:text-dim/40 transition-colors',
          error ? 'border-error focus:border-error' : 'border-border/80 focus:border-amber focus:ring-1 focus:ring-amber/40'
        )}
      />
      {error && <p className="text-xs text-error font-medium">{error}</p>}
    </div>
  );
}

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  name: string;
  options: string[];
}

function SelectField({ label, name, options, ...rest }: SelectFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-xs text-mid font-medium">
        {label}
      </label>
      <select
        id={name}
        name={name}
        {...rest}
        className="w-full bg-surface-high border border-border/80 rounded-xl px-3.5 py-2 text-warm-white text-xs focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber/40 transition-colors appearance-none cursor-pointer"
      >
        {options.map(o => <option key={o} value={o} className="bg-surface">{o}</option>)}
      </select>
    </div>
  );
}
