'use client';

import { useState, useEffect } from 'react';
import { X, AlertCircle, Link as LinkIcon, Edit3 } from 'lucide-react';
import { updateStem } from '@/app/actions/stems';
import { Stem } from '@/types';
import { useToast } from '@/context/ToastContext';

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface border border-border rounded-sm w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">

        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-amber/10 border border-amber/30 flex items-center justify-center text-amber">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display text-2xl text-warm-white">Edit Stem Session</h2>
              <p className="text-dim text-xs font-body mt-0.5">
                Update details for <span className="text-amber font-medium">{stem.title}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-dim hover:text-warm-white p-1.5 transition-colors rounded-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Errors list if any */}
        {errors && Object.keys(errors).length > 0 && (
          <div className="mx-6 mt-4 border border-error/30 bg-error/10 rounded-sm px-4 py-3 shrink-0">
            <p className="text-sm font-body text-error mb-2 font-medium">Please fix these errors:</p>
            <ul className="space-y-1">
              {Object.entries(errors).map(([field, msg]) => (
                <li key={field} className="text-sm text-error font-body flex items-center gap-1.5">
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
            <Field label="Church Name / Artist *" name="artist" value={formData.artist} onChange={handleChange} placeholder="e.g. Elevation Worship" error={errors?.artist} />
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
            <label htmlFor="edit-description" className="block text-xs text-dim font-body flex items-center justify-between">
              <span>Special Notes / Description (Optional)</span>
              <span className="text-[10px] text-dim/60">Key changes, extra stems, instructions</span>
            </label>
            <textarea
              id="edit-description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="e.g. Includes live drums, click track in Bb, and organ stems..."
              className="w-full bg-obsidian border border-border rounded-sm px-3 py-2 text-warm-white font-body text-sm focus:outline-none focus:border-amber placeholder:text-dim/40 transition-colors resize-none"
            />
          </div>

          {/* Row 6: Tags */}
          <div className="space-y-1.5">
            <label htmlFor="edit-tags" className="block text-xs text-dim font-body flex items-center justify-between">
              <span>Tags (Optional)</span>
              <span className="text-[10px] text-dim/60">Comma-separated, max 8</span>
            </label>
            <input
              id="edit-tags"
              name="tags"
              type="text"
              value={formData.tags}
              onChange={handleChange}
              placeholder="e.g. click track, live recording, keys heavy, multibus"
              className="w-full bg-obsidian border border-border rounded-sm px-3 py-2 text-warm-white font-body text-sm focus:outline-none focus:border-amber placeholder:text-dim/40 transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="font-body text-sm text-dim hover:text-warm-white px-4 py-2 border border-border hover:border-border-warm rounded-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="bg-amber hover:bg-amber-muted disabled:opacity-50 text-obsidian font-body font-semibold text-sm px-6 py-2 rounded-sm transition-colors"
            >
              {isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  inputMode,
  min,
  max,
}: {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  inputMode?: 'numeric' | 'text' | 'decimal' | 'tel' | 'search' | 'email' | 'url';
  min?: number;
  max?: number;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={`edit-${name}`} className="block text-xs text-dim font-body">
        {label}
      </label>
      <input
        id={`edit-${name}`}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        inputMode={inputMode}
        min={min}
        max={max}
        className={`w-full bg-obsidian border rounded-sm px-3 py-2 text-warm-white font-body text-sm focus:outline-none placeholder:text-dim/40 transition-colors ${
          error ? 'border-error focus:border-error' : 'border-border focus:border-amber'
        }`}
      />
      {error && <p className="text-[11px] text-error font-body">{error}</p>}
    </div>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={`edit-${name}`} className="block text-xs text-dim font-body">
        {label}
      </label>
      <select
        id={`edit-${name}`}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full bg-obsidian border border-border rounded-sm px-3 py-2 text-warm-white font-body text-sm focus:outline-none focus:border-amber transition-colors"
      >
        {options.map(opt => (
          <option key={opt} value={opt} className="bg-surface text-warm-white">
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}