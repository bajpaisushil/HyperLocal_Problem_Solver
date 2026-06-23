'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(form.email, form.password);
      router.push('/dashboard');
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md py-8">
      <div className="card p-7">
        <h1 className="text-2xl font-bold text-ink-900">Welcome back</h1>
        <p className="mt-1 text-sm text-ink-500">Sign in to manage your society.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="label">Email</label>
            <input type="email" required className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" required className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
          </div>
          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          <button disabled={busy} className="btn-primary w-full py-3">{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <p className="mt-4 text-center text-sm text-ink-500">
          New here? <Link href="/register" className="font-semibold text-brand-700">Create an account</Link>
        </p>
        <div className="mt-6 rounded-xl bg-ink-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Demo accounts (password123)</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {[['Committee', 'committee@demo.com'], ['Resident', 'asha@demo.com']].map(([label, email]) => (
              <button key={email} type="button" onClick={() => setForm({ email, password: 'password123' })} className="chip !py-1 !text-xs">
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
