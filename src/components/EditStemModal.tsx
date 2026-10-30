'use client';

import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
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

    try {
      const body = new FormData();
      body.append('title', formData.title);
      body.append('artist', formData.artist);
      body.append('download_url', formData.download_url);
      if (formData.daw_template_url) body.append('daw_template_url', formData.daw_template_url);
      body.append('host_platform', formData.host_platform);
      body.append('format', formData.format);
      if (formData.bpm) body.append('bpm', formData.bpm);
      if (formData.key) body.append('key', formData.key);
      if (formData.track_count) body.append('track_count', formData.track_count);
      if (formData.description) body.append('description', formData.description);
      if (formData.tags) body.append('tags', formData.tags);

      const res = await updateStem(stem.id, body);

      if (res.success && res.stem) {
        addToast('Multitrack session updated.', 'success');
        onStemUpdated(res.stem);
        onClose();
      } else {
        if (res.errors) {
          setErrors(res.errors);
        }
        addToast(res.message || 'Failed to update session.', 'error');
      }
    } catch (err: any) {
      addToast(err?.message || 'Failed to update session.', 'error');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-[fade-in_0.15s_ease-out]"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#121212] border border-neutral-800 rounded-lg w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-semibold text-white">
              Edit Multitrack Session
            </h2>
            <p className="text-neutral-400 text-xs mt-0.5">Update metadata or cloud storage link</p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Errors list */}
        {errors && Object.keys(errors).length > 0 && (
          <div className="mx-6 mt-3 border border-neutral-700 bg-neutral-900 rounded p-3 shrink-0">
            <p className="text-xs text-white mb-1 font-semibold">Please fix:</p>
            <ul className="space-y-0.5 text-xs text-neutral-300">
              {Object.entries(errors).map(([field, msg]) => (
                <li key={field} className="flex items-center gap-1.5">
                  <AlertCircle className="w-3 h-3 shrink-0 text-neutral-400" />
                  <span>{msg}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-3.5 flex-1 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Song Title *" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Gratitude" error={errors?.title} />
            <Field label="Church / Artist *" name="artist" value={formData.artist} onChange={handleChange} placeholder="e.g. Elevation Worship" error={errors?.artist} />
          </div>

          <Field
            label="Cloud Link *"
            name="download_url"
            type="url"
            value={formData.download_url}
            onChange={handleChange}
            placeholder="https://drive.google.com/…"
            error={errors?.download_url}
          />

          <Field
            label="DAW Template Link (Optional)"
            name="daw_template_url"
            type="url"
            value={formData.daw_template_url}
            onChange={handleChange}
            placeholder="https://drive.google.com/… (Logic, Pro Tools, Reaper session)"
            error={errors?.daw_template_url}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SelectField label="Host Platform" name="host_platform" value={formData.host_platform} onChange={handleChange} options={HOST_PLATFORMS} />
            <SelectField label="Audio Format" name="format" value={formData.format} onChange={handleChange} options={FORMATS} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="BPM" name="bpm" type="number" value={formData.bpm} onChange={handleChange} placeholder="72" inputMode="numeric" min={30} max={300} error={errors?.bpm} />
            <Field label="Key" name="key" value={formData.key} onChange={handleChange} placeholder="Bb" />
            <Field label="Tracks" name="track_count" type="number" value={formData.track_count} onChange={handleChange} placeholder="36" inputMode="numeric" min={1} max={128} error={errors?.track_count} />
          </div>

          <div className="space-y-1">
            <label htmlFor="edit-description" className="block text-[11px] font-mono uppercase text-neutral-400">
              Session Details (Optional)
            </label>
            <textarea
              id="edit-description"
              name="description"
              rows={2}
              value={formData.description}
              onChange={handleChange}
              placeholder="Session notes, routing, cues..."
              className="w-full bg-[#0d0d0e] border border-neutral-800 rounded px-3 py-2 text-neutral-200 text-xs focus:outline-none focus:border-neutral-500 placeholder-neutral-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2.5 pt-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-neutral-400 hover:text-white px-3 py-1.5 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={clsx(
                'bg-white hover:bg-neutral-200 text-black font-semibold text-xs px-4 py-1.5 rounded transition-colors shadow-xs',
                isPending && 'opacity-60 cursor-not-allowed'
              )}
            >
              {isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  error?: string;
}

function Field({ label, name, error, ...rest }: FieldProps) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-[11px] font-mono uppercase text-neutral-400">
        {label}
      </label>
      <input
        id={name}
        name={name}
        {...rest}
        className={clsx(
          'w-full bg-[#0d0d0e] border rounded px-3 py-1.5 text-neutral-200 text-xs focus:outline-none',
          error ? 'border-neutral-500' : 'border-neutral-800 focus:border-neutral-500'
        )}
      />
      {error && <p className="text-[11px] text-neutral-400">{error}</p>}
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
    <div className="space-y-1">
      <label htmlFor={name} className="block text-[11px] font-mono uppercase text-neutral-400">
        {label}
      </label>
      <select
        id={name}
        name={name}
        {...rest}
        className="w-full bg-[#0d0d0e] border border-neutral-800 rounded px-3 py-1.5 text-neutral-200 text-xs focus:outline-none focus:border-neutral-500 cursor-pointer"
      >
        {options.map(o => <option key={o} value={o} className="bg-[#121212]">{o}</option>)}
      </select>
    </div>
  );
}
