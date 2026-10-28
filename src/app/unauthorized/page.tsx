import Link from 'next/link';
import { ShieldAlert, ExternalLink, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Access Required | The Mixing Vault',
};

export default function UnauthorizedPage() {
  const inviteUrl = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || 'https://discord.gg';

  return (
    <main className="min-h-[85vh] flex items-center justify-center px-4 py-16 bg-[#0a0a0a]">
      <div className="max-w-md w-full bg-[#121212] border border-neutral-800 rounded-lg p-6 sm:p-8 text-center shadow-xl">
        <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto mb-4 text-white">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <h1 className="text-xl font-semibold text-white">
          Community Access Required
        </h1>

        <p className="mt-2 text-neutral-400 text-xs leading-relaxed">
          The Mixing Vault is exclusive to members of the <strong className="text-white">Tyler Kerpsack All Access</strong> Discord server.
        </p>

        <p className="mt-1.5 text-neutral-500 text-xs leading-relaxed">
          We could not find your Discord account in our server. Please join the Discord first, then log in again.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <a
            href={inviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-white hover:bg-neutral-200 text-black font-semibold py-2 px-4 rounded transition-colors text-xs shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Join All Access Discord
          </a>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 py-2 px-4 rounded transition-colors text-xs border border-neutral-800"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
