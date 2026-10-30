'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import NextLink from 'next/link';
import { X, AlertCircle } from 'lucide-react';
import { submitStem } from '@/app/actions/stems';
import { FormState, Stem } from '@/types';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { clsx } from 'clsx';

const INITIAL_STATE: FormState = { success: false, message: '' };

const HOST_PLATFORMS = ['Google Drive', 'Dropbox', 'OneDrive', 'Box', 'Other'];
const FORMATS = [
  'WAV (48kHz/24-bit)',
  'WAV (44.1kHz/16-bit)',
  'FLAC',
  'Multitrack Zip',
];

interface SubmitStemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStemAdded: (stem: Stem) => void;
}

export function SubmitStemModal({ isOpen, onClose, onStemAdded }: SubmitStemModalProps) {
  const { user, profile } = useAuth();
  const { addToast } = useToast();
  const [state, formAction, isPending] = useActionState(submitStem, INITIAL_STATE);
  const hasHandledSuccess = useRef(false);

  const uploaderHandle = profile?.server_display_name
    ? profile.server_display_name
    : profile?.display_name
    ? `@${profile.display_name.replace(/^@/, '')}`
    : user?.email
    ? `@${user.email.split('@')[0]}`
    : '@member';

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
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
  };

  useEffect(() => {
    if (!state.success && !state.message) return;
    if (state.success && !hasHandledSuccess.current) {
      hasHandledSuccess.current = true;
      addToast('Multitrack session published & posted to Discord!', 'success');
      if (state.stem) {
        onStemAdded(state.stem);
      }
      resetForm();
      onClose();
    } else if (!state.success && state.message) {
      addToast(state.message, 'error');
    }
  }, [state, addToast, onClose, onStemAdded]);

  useEffect(() => {
    if (isOpen) {
      hasHandledSuccess.current = false;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  if (!user) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="bg-[#121212] border border-neutral-800 rounded-lg w-full max-w-sm shadow-2xl text-center p-6 space-y-3">
          <h2 className="text-base font-semibold text-white">Connection Required</h2>
          <p className="text-xs text-neutral-400 leading-relaxed">
            You must be connected with your Discord account in Tyler Kerpsack All Access to upload multitrack stems.
          </p>
          <button
            onClick={onClose}
            className="text-xs text-white underline pt-2 block mx-auto font-medium"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

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
              Publish Multitrack Pack
            </h2>
            <p className="text-neutral-400 text-xs mt-0.5">
              Posting as <span className="text-white font-medium">{uploaderHandle}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info notice */}
        <div className="px-6 pt-4 shrink-0">
          <div className="bg-[#0d0d0e] border border-neutral-800 rounded p-3 text-xs text-neutral-400 leading-relaxed">
            Multitracks publish <strong>instantly</strong> to the library and KerpBot creates a dedicated mix feedback thread in Discord. Make sure cloud links are set to <strong>&quot;Anyone with the link can view/download&quot;</strong>.
          </div>

          {/* Validation errors */}
          {state.errors && Object.keys(state.errors).length > 0 && !state.success && (
            <div className="mt-2.5 border border-neutral-700 bg-neutral-900 rounded p-3">
              <p className="text-xs text-white mb-1 font-semibold">Please fix:</p>
              <ul className="space-y-0.5 text-xs text-neutral-300">
                {Object.entries(state.errors).map(([field, msg]) => (
                  <li key={field} className="flex items-center gap-1.5">
                    <AlertCircle className="w-3 h-3 shrink-0 text-neutral-400" />
                    <span>{msg}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <form action={formAction} className="px-6 py-4 space-y-3.5 flex-1 text-xs">
          <input type="hidden" name="uploader_handle" value={uploaderHandle} />

          {/* Row 1: Title + Artist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Song Title *" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Gratitude" error={state.errors?.title} />
            <Field label="Church / Artist *" name="artist" value={formData.artist} onChange={handleChange} placeholder="e.g. Brandon Lake / Bethel" error={state.errors?.artist} />
          </div>

          {/* Row 2: Multitrack Stems Cloud Link */}
          <Field
            label="Multitrack Stems Link (Drive, Dropbox) *"
            name="download_url"
            type="url"
            value={formData.download_url}
            onChange={handleChange}
            placeholder="https://drive.google.com/… or https://dropbox.com/…"
            error={state.errors?.download_url}
          />

          {/* Row 3: Optional DAW Template Link */}
          <Field
            label="DAW Template Link (Optional)"
            name="daw_template_url"
            type="url"
            value={formData.daw_template_url}
            onChange={handleChange}
            placeholder="https://drive.google.com/… (Logic, Pro Tools, Reaper session)"
            error={state.errors?.daw_template_url}
          />

          {/* Row 4: Platform + Format */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SelectField label="Host Platform" name="host_platform" value={formData.host_platform} onChange={handleChange} options={HOST_PLATFORMS} />
            <SelectField label="Audio Format" name="format" value={formData.format} onChange={handleChange} options={FORMATS} />
          </div>

          {/* Row 5: BPM + Key + Track Count */}
          <div className="grid grid-cols-3 gap-3">
            <Field label="BPM" name="bpm" type="number" value={formData.bpm} onChange={handleChange} placeholder="72" inputMode="numeric" min={30} max={300} error={state.errors?.bpm} />
            <Field label="Key" name="key" value={formData.key} onChange={handleChange} placeholder="Bb" />
            <Field label="Tracks" name="track_count" type="number" value={formData.track_count} onChange={handleChange} placeholder="36" inputMode="numeric" min={1} max={128} error={state.errors?.track_count} />
          </div>

          {/* Row 6: Description */}
          <div className="space-y-1">
            <label htmlFor="description" className="block text-[11px] font-mono uppercase text-neutral-400">
              Session Details (Optional)
            </label>
            <textarea
              id="description"
              name="description"
              rows={2}
              value={formData.description}
              onChange={handleChange}
              placeholder="Recording specs, console routing, extra cues..."
              className="w-full bg-[#0d0d0e] border border-neutral-800 rounded px-3 py-2 text-neutral-200 text-xs focus:outline-none focus:border-neutral-500 placeholder-neutral-500 resize-none"
            />
          </div>


          {/* Row 8: Rights Checkbox */}
          <div className="flex items-start gap-2 pt-2 border-t border-neutral-800">
            <input
              type="checkbox"
              id="certify-rights"
              required
              className="mt-0.5 accent-white rounded cursor-pointer"
            />
            <label htmlFor="certify-rights" className="text-[11px] text-neutral-400 leading-tight cursor-pointer">
              I certify that I am at least 13 years of age, have full authorization to share these files for non-commercial mixing practice, and agree to the{' '}
              <NextLink href="/terms" target="_blank" className="text-white hover:underline">Terms of Service</NextLink>{' '}
              and{' '}
              <NextLink href="/dmca" target="_blank" className="text-white hover:underline">DMCA Policy</NextLink>.
            </label>
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
              {isPending ? 'Publishing…' : 'Publish Multitrack'}
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
