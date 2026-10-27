import Link from 'next/link';
import { ShieldAlert, ExternalLink, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Access Required | The Mixing Vault',
};

export default function UnauthorizedPage() {
  const inviteUrl = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || 'https://discord.gg';

  return (
    <main className="min-h-[85vh] flex items-center justify-center px-4 py-16 bg-surface">
      <div className="max-w-md w-full bg-surface-raised border border-border/80 rounded-3xl p-8 sm:p-10 text-center shadow-m3-3 relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber to-red-500" />

        <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-6 text-red-400">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h1 className="font-display text-2xl sm:text-3xl font-bold text-warm-white tracking-tight">
          Discord Access Required
        </h1>

        <p className="mt-3 text-dim text-sm leading-relaxed font-body">
          The Mixing Vault is exclusive to members of the <span className="text-amber font-semibold">Tyler Kerpsack All Access</span> community.
        </p>

        <p className="mt-2 text-dim text-xs leading-relaxed font-body">
          We could not verify your membership in our Discord server. Join our community first with your Discord account, then return and sign in.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <a
            href={inviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold py-3 px-5 rounded-full transition-all text-xs shadow-m3-1 hover:shadow-m3-2 active:scale-95"
          >
            <ExternalLink className="w-4 h-4" />
            Join All Access Discord Server
          </a>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 bg-surface-high hover:bg-surface text-dim hover:text-warm-white py-3 px-5 rounded-full transition-all text-xs border border-border/80 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home Feed
          </Link>
        </div>
      </div>
    </main>
  );
}
