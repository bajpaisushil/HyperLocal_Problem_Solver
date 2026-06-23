'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

const PRIMARY = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/complaints', label: 'Complaints' },
  { href: '/finance', label: 'Finance' },
  { href: '/vendors', label: 'Vendors' },
  { href: '/community', label: 'Community' },
  { href: '/assistant', label: 'Assistant', badge: 'AI' },
];
const MORE = [
  { href: '/visitors', label: 'Visitors' },
  { href: '/reports', label: 'Reports' },
  { href: '/directory', label: 'Directory', committee: true },
];

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [more, setMore] = useState(false);
  const isCommittee = user?.role === 'committee' || user?.role === 'superadmin';

  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const Item = ({ href, label, badge }: { href: string; label: string; badge?: string }) => (
    <Link
      href={href}
      onClick={() => setOpen(false)}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
        active(href) ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
      }`}
    >
      {label}
      {badge && <span className="rounded bg-brand-600 px-1 text-[10px] font-bold text-white">{badge}</span>}
    </Link>
  );

  const moreItems = MORE.filter((m) => !m.committee || isCommittee);

  return (
    <header className="sticky top-0 z-[1000] border-b border-ink-100 bg-white/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-lg font-bold text-white shadow-soft">N</span>
          <span className="text-lg font-extrabold tracking-tight text-ink-900">
            Nagar<span className="text-brand-600">Fix</span>
          </span>
        </Link>

        {user && (
          <div className="hidden items-center gap-0.5 lg:flex">
            {PRIMARY.map((l) => (
              <Item key={l.href} {...l} />
            ))}
            <div className="relative" onMouseLeave={() => setMore(false)}>
              <button
                onClick={() => setMore((v) => !v)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50"
              >
                More ▾
              </button>
              {more && (
                <div className="absolute right-0 mt-1 w-40 rounded-xl border border-ink-100 bg-white p-1 shadow-lift">
                  {moreItems.map((m) => (
                    <Link
                      key={m.href}
                      href={m.href}
                      onClick={() => setMore(false)}
                      className={`block rounded-lg px-3 py-2 text-sm ${active(m.href) ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-50'}`}
                    >
                      {m.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <>
              <Link href="/complaints/new" className="btn-primary !py-2">+ Report</Link>
              <Link href="/me" className="flex items-center gap-2 text-sm">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-ink-100 font-semibold text-ink-700">
                  {user.name?.[0]?.toUpperCase()}
                </span>
                <span className="font-semibold text-brand-700">{user.points} pts</span>
              </Link>
              <button onClick={logout} className="text-sm text-ink-500 hover:text-ink-800">Logout</button>
            </>
          ) : (
            !loading && (
              <>
                <Link href="/login" className="btn-ghost">Sign in</Link>
                <Link href="/register" className="btn-primary">Get started</Link>
              </>
            )
          )}
        </div>

        <button className="rounded-lg p-2 text-ink-600 lg:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M3 12h18M3 6h18M3 18h18" />}
          </svg>
        </button>
      </nav>

      {open && (
        <div className="border-t border-ink-100 bg-white px-4 py-3 lg:hidden">
          <div className="flex flex-col gap-1">
            {user ? (
              <>
                {[...PRIMARY, ...moreItems].map((l) => (
                  <Item key={l.href} {...l} />
                ))}
                <Link href="/complaints/new" onClick={() => setOpen(false)} className="btn-primary mt-2">+ Report complaint</Link>
                <button onClick={logout} className="btn-ghost mt-1">Logout ({user.points} pts)</button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className="btn-ghost">Sign in</Link>
                <Link href="/register" onClick={() => setOpen(false)} className="btn-primary mt-1">Get started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
