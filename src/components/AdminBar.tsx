'use client';

import { useState } from 'react';
import { Trash2, ShieldCheck, ShieldOff } from 'lucide-react';
import { deleteStem, updateUserRole } from '@/app/actions/stems';
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
  uploaderId,
  isVerified,
  onDelete,
  onVerifyToggle,
}: AdminBarProps) {
  const { addToast } = useToast();
  const [deleting, setDeleting] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Permanently delete this stem? This cannot be undone.')) return;
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
    if (!uploaderId) {
      addToast('Cannot verify: uploader has no account.', 'error');
      return;
    }
    setVerifying(true);
    // Toggle verified role — downgrade to 'user' or upgrade to 'verified'
    const newRole = isVerified ? 'user' : 'verified';
    const result = await updateUserRole(uploaderId, newRole);
    if (result.success) {
      addToast(`Uploader ${isVerified ? 'un-verified' : 'verified'}.`, 'success');
      onVerifyToggle(stemId, !isVerified);
    } else {
      addToast(`Verify failed: ${result.message}`, 'error');
    }
    setVerifying(false);
  };

  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        onClick={handleVerifyToggle}
        disabled={verifying}
        title={isVerified ? 'Remove verified status' : 'Grant verified engineer status'}
        className="p-1.5 text-verified hover:text-warm-white hover:bg-verified-dim transition-colors disabled:opacity-50"
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
        title="Delete stem (admin)"
        className="p-1.5 text-error hover:text-warm-white hover:bg-error/20 transition-colors disabled:opacity-50"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
