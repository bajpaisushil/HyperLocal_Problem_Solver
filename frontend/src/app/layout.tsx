import './globals.css';
import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import PWARegister from '@/components/PWARegister';

export const metadata: Metadata = {
  title: 'NagarFix — AI-powered society operations',
  description:
    'Run your apartment society on autopilot: AI complaint triage, vendor marketplace, transparent finances, a chat-with-your-data assistant, and committee reports.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'NagarFix', statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  themeColor: '#0d9488',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body>
        <AuthProvider>
          <Navbar />
          <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6">{children}</main>
          <footer className="border-t border-ink-100 py-8 text-center text-sm text-ink-400">
            NagarFix · AI-powered society operations for self-managed communities
          </footer>
          <PWARegister />
        </AuthProvider>
      </body>
    </html>
  );
}
