'use client';

import { useState } from 'react';
import { Trash2, ShieldCheck, ShieldOff } from 'lucide-react';
import { deleteStem, toggleStemVerification } from '@/app/actions/stems';
import { useToast } from '@/context/ToastContext';

interface AdminBarProps {
  stemId: string;
  uploaderId: string | null;
  isVerified: boolean;
  onDelete: (id: string) => void;
  onVerifyToggle: (id: string, verified: boolean) => void;
}

export function AdminBar({
  stemId,
  isVerified,
  onDelete,
  onVerifyToggle,
}: AdminBarProps) {
  const { addToast } = useToast();
  const [deleting, setDeleting] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Permanently delete this multitrack?')) return;
    setDeleting(true);
    const result = await deleteStem(stemId);
    if (result.success) {
      addToast('Stem deleted.', 'success');
      onDelete(stemId);
    } else {
      addToast(`Delete failed: ${result.message}`, 'error');
    }
    setDeleting(false);
  };

  const handleVerifyToggle = async () => {
    setVerifying(true);
    const newVerifiedState = !isVerified;
    const result = await toggleStemVerification(stemId, newVerifiedState);
    if (result.success) {
      addToast(`Stem ${newVerifiedState ? 'marked Verified' : 'unmarked'}.`, 'success');
      onVerifyToggle(stemId, newVerifiedState);
    } else {
      addToast(`Failed: ${result.message}`, 'error');
    }
    setVerifying(false);
  };

  return (
    <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded px-1.5 py-0.5 ml-1.5 shrink-0">
      <button
        onClick={handleVerifyToggle}
        disabled={verifying}
        title={isVerified ? 'Remove Verified' : 'Mark as Verified'}
        className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors disabled:opacity-50"
      >
        {isVerified ? (
          <ShieldOff className="w-3.5 h-3.5" />
        ) : (
          <ShieldCheck className="w-3.5 h-3.5" />
        )}
      </button>
      <button
        onClick={handleDelete}
        disabled={deleting}
        title="Delete stem"
        className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors disabled:opacity-50"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
