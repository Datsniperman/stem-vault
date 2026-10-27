import Link from 'next/link';
import { ShieldAlert, ExternalLink, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Access Required | The Mixing Vault',
};

export default function UnauthorizedPage() {
  const inviteUrl = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || 'https://discord.gg';

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-surface border border-border/80 rounded-sm p-8 text-center shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber to-red-500" />
        
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6 text-red-400">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h1 className="font-display text-2xl text-warm-white tracking-wide">
          Discord Access Required
        </h1>

        <p className="mt-3 text-dim text-sm leading-relaxed font-body">
          The Mixing Vault is exclusive to members of the <span className="text-amber font-medium">Tyler Kerpsack All Access</span> community.
        </p>

        <p className="mt-2 text-dim text-xs leading-relaxed font-body">
          We could not find your Discord account in the server. Please join our Discord community first, then sign in again.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <a
            href={inviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium py-2.5 px-4 rounded-sm transition-colors text-sm shadow-md"
          >
            <ExternalLink className="w-4 h-4" />
            Join All Access Discord
          </a>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 bg-surface-raised hover:bg-border/60 text-dim hover:text-warm-white py-2.5 px-4 rounded-sm transition-colors text-sm border border-border"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
