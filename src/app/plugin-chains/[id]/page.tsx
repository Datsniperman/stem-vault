'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sliders,
  ArrowLeft,
  Calendar,
  User,
  Download,
  Edit,
  Trash2,
  Info,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Tag,
  Layers,
} from 'lucide-react';
import { PluginChain, PluginChainItem } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { CreatePluginChainModal } from '@/components/CreatePluginChainModal';
import { Header } from '@/components/Header';
import { FluidOrb } from '@/components/ui/fluid-orb';

export default function PluginChainDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile } = useAuth();
  const chainId = params.id as string;

  const [chain, setChain] = useState<PluginChain | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchChain = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/plugin-chains/${chainId}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error('Plugin chain not found');
        throw new Error('Failed to load plugin chain');
      }
      const data = await res.json();
      setChain(data.chain);
    } catch (err: any) {
      setError(err.message || 'Error loading plugin chain.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chainId) {
      fetchChain();
    }
  }, [chainId]);

  const isOwner = user && chain && user.id === chain.owner_id;
  const isAdmin = profile?.role === 'admin';
  const canManage = isOwner || isAdmin;

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this plugin chain?')) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/plugin-chains/${chainId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Delete failed');
      }
      router.push('/plugin-chains');
    } catch (err: any) {
      alert(err.message || 'Error deleting chain.');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0e] flex items-center justify-center text-neutral-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span className="text-xs font-mono">Loading signal chain...</span>
      </div>
    );
  }

  if (error || !chain) {
    return (
      <div className="min-h-screen bg-[#0d0d0e] flex flex-col items-center justify-center p-4 text-center">
        <AlertCircle className="w-10 h-10 text-neutral-500 mb-3" />
        <h2 className="text-base font-semibold text-white">{error || 'Plugin Chain Not Found'}</h2>
        <Link
          href="/plugin-chains"
          className="mt-4 text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Plugin Chains</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0e] text-neutral-100 pb-24">
      <Header />

      {/* Top Breadcrumb & Action Pill Bar */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        <div className="flex items-center justify-between gap-4 py-2">
          <Link
            href="/plugin-chains"
            className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 transition-colors font-mono"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Plugin Chains</span>
          </Link>

          <div className="flex items-center gap-2">
            <a
              href={`/api/plugin-chains/${chain.id}/export`}
              download={`${chain.name.replace(/[^\w\-]+/g, '_')}-chain.json`}
              className="bg-white hover:bg-neutral-200 text-black font-semibold text-xs px-4 py-2 rounded-full transition-all flex items-center gap-1.5 shadow-sm hover:scale-[1.02] active:scale-[0.98]"
              title="Download versioned JSON schema"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </a>

            {canManage && (
              <>
                <button
                  onClick={() => setEditOpen(true)}
                  className="text-xs text-neutral-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] px-3 py-2 rounded-full transition-all flex items-center gap-1.5 font-mono"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-xs text-neutral-400 hover:text-red-400 bg-red-950/20 hover:bg-red-950/40 border border-red-900/40 px-3 py-2 rounded-full transition-all flex items-center gap-1.5 font-mono"
                >
                  {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>Delete</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Rare UI Hero Canvas */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-3">
        <div className="relative overflow-hidden rounded-[32px] border border-white/[0.08] bg-[#121215]/80 backdrop-blur-xl p-8 sm:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] space-y-4">
          <div className="absolute -right-20 -top-20 opacity-20 blur-2xl pointer-events-none">
            <FluidOrb size={320} color="#352835" />
          </div>

          <div className="relative z-10 space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-neutral-300">
                <Sliders className="w-3.5 h-3.5 text-neutral-400" />
                <span>SIGNAL ROUTING BLUEPRINT</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-neutral-200">
                DAW: {chain.daw}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              {chain.name}
            </h1>

            {chain.description && (
              <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl leading-relaxed whitespace-pre-line">
                {chain.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-neutral-400 pt-2">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-neutral-500" />
                <span>Created by <strong className="text-neutral-200">{chain.owner_name || 'Member'}</strong></span>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                <span>{new Date(chain.created_at).toLocaleDateString()}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-neutral-500" />
                <span>{chain.items?.length || 0} plugins configured</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Plugin Slots */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-300 flex items-center gap-2 font-mono">
              <Sliders className="w-4 h-4 text-neutral-400" />
              <span>Ordered Signal Processing Chain ({chain.items?.length || 0} slots)</span>
            </h2>
          </div>

          {!chain.items || chain.items.length === 0 ? (
            <div className="rare-card p-12 text-center text-xs text-neutral-500">
              No plugins configured in this chain.
            </div>
          ) : (
            <div className="space-y-3">
              {chain.items.map((plugin: PluginChainItem, idx: number) => (
                <div
                  key={plugin.id || idx}
                  className="rare-card p-5 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-white/[0.06] border border-white/[0.1] text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
                        {plugin.position || idx + 1}
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-white">
                          {plugin.plugin_name}
                        </span>
                        {plugin.vendor && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.04] text-neutral-300 border border-white/[0.06]">
                            {plugin.vendor}
                          </span>
                        )}
                        {plugin.category && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.02] text-neutral-400 border border-white/[0.04] flex items-center gap-1">
                            <Tag className="w-2.5 h-2.5 text-neutral-500" />
                            <span>{plugin.category}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider self-start sm:self-auto">
                      Slot {plugin.position || idx + 1}
                    </span>
                  </div>

                  {plugin.notes && (
                    <div className="mt-2 pl-10 text-xs text-neutral-300 bg-white/[0.02] border border-white/[0.04] rounded-xl p-3 font-mono">
                      <span className="text-[10px] text-neutral-400 uppercase block mb-1 font-sans font-medium">
                        Settings & Processing Notes:
                      </span>
                      {plugin.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <CreatePluginChainModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        chainToEdit={chain}
        onSuccess={fetchChain}
      />
    </div>
  );
}
