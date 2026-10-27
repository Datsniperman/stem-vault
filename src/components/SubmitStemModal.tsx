'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { X, AlertCircle, Link, Music2, FileAudio, Layers, CheckCircle2 } from 'lucide-react';
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

  // Controlled form state to preserve input values on submit errors
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
      addToast('Multitrack session published live & announced to Discord!', 'success');
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
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-md"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="bg-surface-raised border border-border/80 rounded-3xl w-full max-w-sm shadow-m3-3 text-center p-8 space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#5865F2]/15 border border-[#5865F2]/30 flex items-center justify-center mx-auto text-[#5865F2]">
            <Music2 className="w-6 h-6" />
          </div>
          <h2 className="font-display text-2xl font-bold text-warm-white">Discord Login Required</h2>
          <p className="font-body text-xs text-dim leading-relaxed">
            You must be logged in with your Discord account in the All Access server to publish stems to The Mixing Vault.
          </p>
          <button
            onClick={onClose}
            className="text-xs font-semibold text-amber hover:underline pt-2 block mx-auto"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-md animate-[fade-in_0.15s_ease-out]"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface-raised border border-border/80 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-m3-3 flex flex-col">

        {/* Header (M3 Dialog Header) */}
        <div className="px-6 py-5 border-b border-border/60 flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-display text-2xl font-bold text-warm-white flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-amber/15 border border-amber/30 flex items-center justify-center text-amber">
                <Music2 className="w-4 h-4" />
              </div>
              Publish Multitrack Pack
            </h2>
            <p className="text-dim text-xs font-body mt-1">
              Publishing as <span className="text-amber font-semibold">{uploaderHandle}</span> • <span className="text-emerald-400 font-medium">Instant Release</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-dim hover:text-warm-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Share link & instant release notice */}
        <div className="px-6 pt-5 shrink-0">
          <div className="flex items-start gap-3 bg-amber/10 border border-amber/30 rounded-2xl px-4 py-3.5">
            <Link className="w-4 h-4 text-amber shrink-0 mt-0.5" />
            <p className="text-xs text-amber leading-relaxed">
              Your multitrack pack will go live <strong>immediately</strong> in The Mixing Vault, and KerpBot will post an announcement and mix critique thread to Discord. Set permissions to <strong>"Anyone with the link can view/download"</strong>.
            </p>
          </div>

          {/* Validation errors */}
          {state.errors && Object.keys(state.errors).length > 0 && !state.success && (
            <div className="mt-3 border border-error/30 bg-error/10 rounded-2xl px-4 py-3">
              <p className="text-xs text-error mb-1.5 font-semibold">Please fix the following:</p>
              <ul className="space-y-1">
                {Object.entries(state.errors).map(([field, msg]) => (
                  <li key={field} className="text-xs text-error flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {msg}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <form action={formAction} className="px-6 pb-6 pt-5 space-y-4 flex-1">
          <input type="hidden" name="uploader_handle" value={uploaderHandle} />

          {/* Row 1: Title + Church/Artist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Song Title *" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Gratitude" error={state.errors?.title} />
            <Field label="Church / Artist *" name="artist" value={formData.artist} onChange={handleChange} placeholder="e.g. Brandon Lake / Bethel" error={state.errors?.artist} />
          </div>

          {/* Row 2: Multitrack Stems Cloud Link */}
          <Field
            label="Multitrack Stems Download Link *"
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
            placeholder="https://drive.google.com/… (Logic Pro, Pro Tools, Reaper, Studio One template)"
            error={state.errors?.daw_template_url}
          />

          {/* Row 4: Platform + Format */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField label="Host Platform" name="host_platform" value={formData.host_platform} onChange={handleChange} options={HOST_PLATFORMS} />
            <SelectField label="Audio Format" name="format" value={formData.format} onChange={handleChange} options={FORMATS} />
          </div>

          {/* Row 5: BPM + Key + Track Count */}
          <div className="grid grid-cols-3 gap-4">
            <Field label="BPM" name="bpm" type="number" value={formData.bpm} onChange={handleChange} placeholder="72" inputMode="numeric" min={30} max={300} error={state.errors?.bpm} />
            <Field label="Key" name="key" value={formData.key} onChange={handleChange} placeholder="Bb" />
            <Field label="Track Count" name="track_count" type="number" value={formData.track_count} onChange={handleChange} placeholder="36" inputMode="numeric" min={1} max={128} error={state.errors?.track_count} />
          </div>

          {/* Row 6: Description / Special Notes */}
          <div className="space-y-1.5">
            <label htmlFor="description" className="block text-xs text-mid font-medium flex items-center justify-between">
              <span>Special Notes / Multitrack Specs (Optional)</span>
              <span className="text-[10px] text-dim">Console routing, sample rate, extra stems</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="e.g. Recorded live at 48kHz/24-bit. Includes click & cues, split kick in/out, snare top/bottom, stereo room mics, and stem group tracks..."
              className="w-full bg-surface-high border border-border/80 rounded-xl px-3.5 py-2.5 text-warm-white text-xs focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber/40 placeholder:text-dim/40 transition-colors resize-none"
            />
          </div>

          {/* Row 7: Tags */}
          <div className="space-y-1.5">
            <label htmlFor="tags" className="block text-xs text-mid font-medium flex items-center justify-between">
              <span>Tags (Optional)</span>
              <span className="text-[10px] text-dim">Comma-separated, max 8</span>
            </label>
            <input
              id="tags"
              name="tags"
              type="text"
              value={formData.tags}
              onChange={handleChange}
              placeholder="e.g. live, worship, daw template, multibus, logic, avid"
              className="w-full bg-surface-high border border-border/80 rounded-xl px-3.5 py-2 text-warm-white text-xs focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber/40 placeholder:text-dim/40 transition-colors"
            />
          </div>

          {/* Row 8: Rights Certification Checkbox */}
          <div className="flex items-start gap-2.5 pt-2 border-t border-border/60">
            <input
              type="checkbox"
              id="certify-rights"
              required
              className="mt-0.5 accent-amber rounded cursor-pointer"
            />
            <label htmlFor="certify-rights" className="text-xs text-mid leading-relaxed cursor-pointer">
              I certify that these audio files and templates are authorized for non-commercial mixing practice within the Tyler Kerpsack All Access community.
            </label>
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
              {isPending ? 'Publishing to Vault & Discord…' : 'Publish Multitrack Pack'}
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
