'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { COMPLAINT_CATEGORIES, CATEGORY_MAP } from '@/lib/constants';
import { PageHeader, Skeleton, EmptyState, Stars } from '@/components/ui';
import type { Vendor } from '@/lib/types';

export default function VendorsPage() {
  const { user } = useRequireAuth();
  const isCommittee = user?.role === 'committee' || user?.role === 'superadmin';
  const [vendors, setVendors] = useState<Vendor[] | null>(null);
  const [trade, setTrade] = useState('');
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(() => {
    const p = trade ? `?trade=${trade}` : '';
    api<Vendor[]>(`/api/vendors${p}`).then(setVendors).catch(() => {});
  }, [trade]);
  useEffect(() => { if (user) load(); }, [user, load]);

  if (!user) return null;

  return (
    <div className="py-6">
      <PageHeader
        title="Vendor marketplace"
        subtitle="Verified service providers with ratings & SLA performance"
        action={isCommittee && <button onClick={() => setShowForm((v) => !v)} className="btn-primary">+ Add vendor</button>}
      />

      {showForm && isCommittee && <VendorForm onCreated={() => { setShowForm(false); load(); }} />}

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => setTrade('')} className={`chip ${!trade ? 'chip-active' : ''}`}>All trades</button>
        {COMPLAINT_CATEGORIES.filter((c) => c.value !== 'other').map((c) => (
          <button key={c.value} onClick={() => setTrade(trade === c.value ? '' : c.value)} className={`chip ${trade === c.value ? 'chip-active' : ''}`}>{c.icon} {c.label}</button>
        ))}
      </div>

      <div className="mt-5">
        {!vendors ? <Skeleton count={4} className="h-24" /> : vendors.length === 0 ? (
          <EmptyState icon="🔧" title="No vendors yet" hint={isCommittee ? 'Add your first vendor above.' : undefined} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {vendors.map((v) => (
              <div key={v._id} className="card p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-ink-900">{v.name} {v.verified && <span title="Verified" className="text-brand-600">✔︎</span>}</p>
                    <p className="text-sm text-ink-500">{CATEGORY_MAP[v.trade]?.icon} {CATEGORY_MAP[v.trade]?.label || v.trade}{v.phone ? ` · ${v.phone}` : ''}</p>
                  </div>
                  <div className="text-right">
                    <Stars value={v.ratingAvg} />
                    <p className="text-xs text-ink-400">{v.ratingAvg.toFixed(1)} ({v.ratingCount})</p>
                  </div>
                </div>
                <div className="mt-3 flex gap-4 text-sm text-ink-600">
                  <span>🧰 {v.jobsCompleted} jobs</span>
                  {v.slaScore != null && <span className={v.slaScore >= 80 ? 'text-brand-600' : 'text-amber-600'}>⏱ {v.slaScore}% on-time</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function VendorForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', trade: 'plumbing', phone: '', verified: true });
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/api/vendors', { method: 'POST', body: form });
      onCreated();
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="card mt-4 grid gap-3 p-5 sm:grid-cols-2">
      <div><label className="label">Name</label><input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
      <div><label className="label">Trade</label>
        <select className="input" value={form.trade} onChange={(e) => setForm({ ...form, trade: e.target.value })}>
          {COMPLAINT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
      <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
      <label className="flex items-end gap-2 pb-2 text-sm text-ink-700">
        <input type="checkbox" checked={form.verified} onChange={(e) => setForm({ ...form, verified: e.target.checked })} className="h-4 w-4" /> Verified
      </label>
      <div className="sm:col-span-2"><button disabled={busy} className="btn-primary">{busy ? 'Adding…' : 'Add vendor'}</button></div>
    </form>
  );
}
