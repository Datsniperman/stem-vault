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
} from 'lucide-react';
import { PluginChain, PluginChainItem } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { CreatePluginChainModal } from '@/components/CreatePluginChainModal';

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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-neutral-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span className="text-sm">Loading plugin chain...</span>
      </div>
    );
  }

  if (error || !chain) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-10 h-10 text-red-500 mb-2" />
        <h2 className="text-base font-semibold text-white">{error || 'Plugin Chain Not Found'}</h2>
        <Link
          href="/plugin-chains"
          className="mt-4 text-xs text-neutral-400 hover:text-white flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Plugin Chains</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 pb-24">
      {/* Top Bar */}
      <div className="border-b border-neutral-800 bg-[#0d0d0d] px-4 sm:px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <Link
            href="/plugin-chains"
            className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Plugin Chains</span>
          </Link>

          <div className="flex items-center gap-2">
            {/* Export JSON Button */}
            <a
              href={`/api/plugin-chains/${chain.id}/export`}
              download={`${chain.name.replace(/[^\w\-]+/g, '_')}-chain.json`}
              className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-medium text-xs px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 shadow-xs"
              title="Download versioned JSON schema"
            >
              <Download className="w-3.5 h-3.5 text-neutral-400" />
              <span>Export JSON</span>
            </a>

            {canManage && (
              <>
                <button
                  onClick={() => setEditOpen(true)}
                  className="text-xs text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 px-3 py-1.5 rounded transition-colors flex items-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 border border-red-900/60 px-3 py-1.5 rounded transition-colors flex items-center gap-1.5"
                >
                  {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>Delete</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Chain Info Header */}
      <div className="border-b border-neutral-800 bg-neutral-950/40 py-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>PLUGIN CHAIN SPECIFICATION</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <span>{chain.name}</span>
            </h1>
            <span className="text-xs font-mono px-3 py-1 rounded bg-neutral-800 text-neutral-200 border border-neutral-700 self-start sm:self-auto">
              DAW: {chain.daw}
            </span>
          </div>

          {chain.description && (
            <p className="text-xs sm:text-sm text-neutral-300 mt-2 max-w-3xl whitespace-pre-line">
              {chain.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-neutral-400 mt-4">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-neutral-500" />
              <span>Created by <strong className="text-neutral-200">{chain.owner_name || 'Member'}</strong></span>
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-neutral-500" />
              <span>{new Date(chain.created_at).toLocaleDateString()}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-neutral-500" />
              <span>{chain.items?.length || 0} plugins</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Notice Banner */}
        <div className="p-3.5 bg-neutral-900/80 border border-neutral-800 rounded-lg flex items-start gap-3 text-xs text-neutral-400">
          <Info className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-neutral-200 font-medium">DAW plugin support coming later — export/import schema ready.</span>
            <p className="text-neutral-400 mt-0.5">
              This signal chain conforms to the versioned schema documented in <code className="text-neutral-300">PLUGIN-CHAIN-SCHEMA.md</code>. You can export this chain to JSON or import it across user accounts.
            </p>
          </div>
        </div>

        {/* Ordered Plugins List */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-300 mb-3 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-neutral-400" />
            <span>Ordered Signal Chain ({chain.items?.length || 0} slots)</span>
          </h2>

          {!chain.items || chain.items.length === 0 ? (
            <div className="border border-neutral-800 rounded-lg p-8 text-center text-xs text-neutral-500">
              No plugins configured in this chain.
            </div>
          ) : (
            <div className="space-y-3">
              {chain.items.map((plugin: PluginChainItem, idx: number) => (
                <div
                  key={plugin.id || idx}
                  className="bg-[#121212] border border-neutral-800 rounded-lg p-4 flex flex-col gap-2 transition-colors hover:border-neutral-700"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded bg-neutral-800 text-neutral-200 font-mono text-xs font-bold flex items-center justify-center shrink-0 border border-neutral-700">
                        {plugin.position || idx + 1}
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-white">
                          {plugin.plugin_name}
                        </span>
                        {plugin.vendor && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                            {plugin.vendor}
                          </span>
                        )}
                        {plugin.category && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800 flex items-center gap-1">
                            <Tag className="w-2.5 h-2.5 text-neutral-500" />
                            <span>{plugin.category}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider self-start sm:self-auto">
                      Slot {plugin.position || idx + 1}
                    </span>
                  </div>

                  {plugin.notes && (
                    <div className="mt-1 pl-9 text-xs text-neutral-300 bg-neutral-950/60 border border-neutral-900 rounded p-2.5 font-mono">
                      <span className="text-[10px] text-neutral-500 uppercase block mb-0.5 font-sans">Settings & Notes:</span>
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
