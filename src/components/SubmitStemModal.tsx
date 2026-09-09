'use client';

import { useActionState, useEffect, useRef } from 'react';
import { X, AlertCircle, Link, Info } from 'lucide-react';
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
  const { user } = useAuth();
  const { addToast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(submitStem, INITIAL_STATE);
  const hasHandledSuccess = useRef(false);

  useEffect(() => {
    if (!state.success && !state.message) return;
    if (state.success && !hasHandledSuccess.current) {
      hasHandledSuccess.current = true;
      if (state.stem) onStemAdded(state.stem);
      addToast(state.message || 'Stems submitted to the archive.', 'success');
      formRef.current?.reset();
      onClose();
    } else if (!state.success && state.message && !state.errors) {
      addToast(state.message, 'error');
    }
  }, [state]);

  useEffect(() => {
    if (isOpen) hasHandledSuccess.current = false;
  }, [isOpen]);

  if (!isOpen) return null;

  if (!user) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-sm"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="bg-surface border border-border rounded-sm w-full max-w-sm shadow-2xl text-center p-8">
          <h2 className="font-display text-2xl text-warm-white mb-2">Sign in to submit</h2>
          <p className="font-body text-sm text-dim mb-6">
            You need an account to submit stems to the archive.
          </p>
          <button onClick={onClose} className="text-sm text-dim hover:text-warm-white underline font-body transition-colors">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface border border-border rounded-sm w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">

        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-display text-2xl text-warm-white">Submit to the archive</h2>
            <p className="text-dim text-sm font-body mt-0.5">Share a multitrack session with the community</p>
          </div>
          <button onClick={onClose} className="text-dim hover:text-warm-white p-1.5 transition-colors rounded-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Share link notice */}
        <div className="px-6 pt-5 shrink-0">
          <div className="flex items-start gap-3 bg-amber-dim border border-amber/20 rounded-sm px-4 py-3">
            <Link className="w-4 h-4 text-amber shrink-0 mt-0.5" />
            <p className="text-sm text-amber font-body leading-relaxed">
              Make sure your link is set to <strong>"Anyone with the link can view"</strong> before submitting. Private or quota-exceeded links will be flagged and removed.
            </p>
          </div>

          {/* Validation errors */}
          {state.errors && Object.keys(state.errors).length > 0 && !state.success && (
            <div className="mt-3 border border-error/30 bg-error/10 rounded-sm px-4 py-3">
              <p className="text-sm font-body text-error mb-2 font-medium">Please fix these errors:</p>
              <ul className="space-y-1">
                {Object.entries(state.errors).map(([field, msg]) => (
                  <li key={field} className="text-sm text-error font-body flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {msg}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <form ref={formRef} action={formAction} className="px-6 pb-6 pt-5 space-y-4 flex-1">
          {/* Row 1: Title + Artist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Song Title *" name="title" placeholder="e.g. Gratitude" error={state.errors?.title} />
            <Field label="Artist *" name="artist" placeholder="e.g. Brandon Lake" error={state.errors?.artist} />
          </div>

          {/* Row 2: Cloud Link */}
          <Field
            label="Cloud Link *"
            name="download_url"
            type="url"
            placeholder="https://drive.google.com/…"
            error={state.errors?.download_url}
          />

          {/* Row 3: Platform + Format */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField label="Host Platform" name="host_platform" options={HOST_PLATFORMS} />
            <SelectField label="Audio Format" name="format" options={FORMATS} />
          </div>

          {/* Row 4: BPM + Key + Track Count */}
          <div className="grid grid-cols-3 gap-4">
            <Field label="BPM" name="bpm" type="number" placeholder="72" inputMode="numeric" min={30} max={300} error={state.errors?.bpm} />
            <Field label="Key" name="key" placeholder="Bb" />
            <Field label="Track Count" name="track_count" type="number" placeholder="36" inputMode="numeric" min={1} max={128} error={state.errors?.track_count} />
          </div>

          {/* Row 5: Handle */}
          <Field
            label="Your Handle"
            name="uploader_handle"
            placeholder="@mixguy_foh"
            defaultValue={user?.email?.split('@')[0] ? `@${user.email.split('@')[0]}` : ''}
          />

          {/* Row 6: Description / Special Notes */}
          <div className="space-y-1.5">
            <label htmlFor="description" className="block text-xs text-dim font-body flex items-center justify-between">
              <span>Special Notes / Description (Optional)</span>
              <span className="text-[10px] text-dim/60">Key changes, extra stems, instructions</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="e.g. Includes live drums, click track in Bb, and organ stems. Drums split into kick, snare, toms..."
              className="w-full bg-obsidian border border-border rounded-sm px-3 py-2 text-warm-white font-body text-sm focus:outline-none focus:border-amber placeholder:text-dim/40 transition-colors resize-none"
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
              className={clsx(
                'bg-amber hover:bg-amber-muted text-obsidian font-body font-bold text-sm px-8 py-2 rounded-sm',
                'transition-colors',
                isPending && 'opacity-60 cursor-not-allowed'
              )}
            >
              {isPending ? 'Submitting…' : 'Submit to Archive'}
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
      <label htmlFor={name} className="block text-xs text-dim font-body">
        {label}
      </label>
      <input
        id={name}
        name={name}
        {...rest}
        className={clsx(
          'w-full bg-obsidian border rounded-sm px-3 py-2 text-warm-white font-body text-sm',
          'focus:outline-none placeholder:text-dim/40 transition-colors',
          error ? 'border-error focus:border-error' : 'border-border focus:border-amber'
        )}
      />
      {error && <p className="text-xs text-error font-body">{error}</p>}
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  name: string;
  options: string[];
}

function SelectField({ label, name, options }: SelectFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-xs text-dim font-body">
        {label}
      </label>
      <select
        id={name}
        name={name}
        className="w-full bg-obsidian border border-border rounded-sm px-3 py-2 text-warm-white font-body text-sm focus:outline-none focus:border-amber transition-colors appearance-none"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
