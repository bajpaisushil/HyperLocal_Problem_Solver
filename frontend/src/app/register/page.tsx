'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<'resident' | 'committee'>('resident');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', societyName: '', city: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register({ ...form, role });
      router.push('/dashboard');
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md py-8">
      <div className="card p-7">
        <h1 className="text-2xl font-bold text-ink-900">Join NagarFix</h1>
        <p className="mt-1 text-sm text-ink-500">Create an account to get started.</p>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {([['resident', '🙋 Resident'], ['committee', '🏛️ Committee']] as const).map(([val, label]) => (
            <button key={val} type="button" onClick={() => setRole(val)} className={`chip justify-center py-2.5 ${role === val ? 'chip-active' : ''}`}>
              {label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink-400">
          {role === 'committee'
            ? 'Committee members create a society and manage complaints, vendors & finances.'
            : 'Residents join an existing society to report issues, pay dues and engage.'}
        </p>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <label className="label">Full name</label>
            <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Asha Rao" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Email</label>
              <input type="email" required className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91…" />
            </div>
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" required minLength={6} className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 6 characters" />
          </div>
          {role === 'committee' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Society name</label>
                <input required className="input" value={form.societyName} onChange={(e) => setForm({ ...form, societyName: e.target.value })} placeholder="Green Meadows" />
              </div>
              <div>
                <label className="label">City</label>
                <input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Bengaluru" />
              </div>
            </div>
          )}
          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          <button disabled={busy} className="btn-primary w-full py-3">{busy ? 'Creating…' : 'Create account'}</button>
        </form>
        <p className="mt-4 text-center text-sm text-ink-500">
          Have an account? <Link href="/login" className="font-semibold text-brand-700">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
