'use client';

import { useState, useEffect } from 'react';
import { X, AlertCircle, Edit3 } from 'lucide-react';
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-[fade-in_0.15s_ease-out]"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#313338] border border-[#1f2023] rounded-lg w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1f2023] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold text-[#f2f3f5]">Edit Stem Session</h2>
            <p className="text-[#949ba4] text-xs mt-0.5">
              Editing: <span className="text-[#f2f3f5] font-semibold">{stem.title}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#949ba4] hover:text-[#f2f3f5] p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Errors list */}
        {errors && Object.keys(errors).length > 0 && (
          <div className="mx-6 mt-3 border border-[#f23f43]/40 bg-[#f23f43]/10 rounded p-3 shrink-0">
            <p className="text-xs text-[#f23f43] mb-1 font-semibold">Please fix:</p>
            <ul className="space-y-0.5 text-xs text-[#f23f43]">
              {Object.entries(errors).map(([field, msg]) => (
                <li key={field} className="flex items-center gap-1.5">
                  <AlertCircle className="w-3 h-3 shrink-0" />
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
            <label htmlFor="edit-description" className="block text-[11px] font-bold uppercase tracking-wider text-[#949ba4]">
              Session Details (Optional)
            </label>
            <textarea
              id="edit-description"
              name="description"
              rows={2}
              value={formData.description}
              onChange={handleChange}
              placeholder="Session notes, routing, cues..."
              className="w-full bg-[#1e1f22] border border-[#1f2023] rounded px-3 py-2 text-[#dbdee1] text-xs focus:outline-none focus:border-[#5865F2] placeholder-[#80848e] resize-none"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="edit-tags" className="block text-[11px] font-bold uppercase tracking-wider text-[#949ba4]">
              Tags (Optional)
            </label>
            <input
              id="edit-tags"
              name="tags"
              type="text"
              value={formData.tags}
              onChange={handleChange}
              placeholder="e.g. worship, live, click track, drums split"
              className="w-full bg-[#1e1f22] border border-[#1f2023] rounded px-3 py-1.5 text-[#dbdee1] text-xs focus:outline-none focus:border-[#5865F2] placeholder-[#80848e]"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#1f2023]">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-[#dbdee1] hover:underline px-3 py-1.5 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={clsx(
                'bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold text-xs px-4 py-1.5 rounded transition-colors shadow-sm',
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
      <label htmlFor={name} className="block text-[11px] font-bold uppercase tracking-wider text-[#949ba4]">
        {label}
      </label>
      <input
        id={name}
        name={name}
        {...rest}
        className={clsx(
          'w-full bg-[#1e1f22] border rounded px-3 py-1.5 text-[#dbdee1] text-xs focus:outline-none',
          error ? 'border-[#f23f43]' : 'border-[#1f2023] focus:border-[#5865F2]'
        )}
      />
      {error && <p className="text-[11px] text-[#f23f43]">{error}</p>}
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
      <label htmlFor={name} className="block text-[11px] font-bold uppercase tracking-wider text-[#949ba4]">
        {label}
      </label>
      <select
        id={name}
        name={name}
        {...rest}
        className="w-full bg-[#1e1f22] border border-[#1f2023] rounded px-3 py-1.5 text-[#dbdee1] text-xs focus:outline-none focus:border-[#5865F2] cursor-pointer"
      >
        {options.map(o => <option key={o} value={o} className="bg-[#1e1f22]">{o}</option>)}
      </select>
    </div>
  );
}
