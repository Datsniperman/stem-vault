import type { Metadata } from 'next';
import { Playfair_Display, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  style: ['normal', 'italic'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Stem Vault — Community Worship Multitrack Archive',
    template: '%s | Stem Vault',
  },
  description:
    'A community directory for worship sound engineers to discover and share high-quality multitrack stem sessions.',
  metadataBase: new URL('https://stem-vault-tau.vercel.app'),
  openGraph: {
    title: 'Stem Vault — Community Worship Multitrack Archive',
    description: 'The community worship multitrack stem archive.',
    type: 'website',
    siteName: 'Stem Vault',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stem Vault — Community Worship Multitrack Archive',
    description: 'The community worship multitrack stem archive.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${spaceGrotesk.variable}`}
    >
      <body className="font-body antialiased">
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
