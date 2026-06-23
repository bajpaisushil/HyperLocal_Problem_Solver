'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { PageHeader, Skeleton, EmptyState, AchievementBadge } from '@/components/ui';
import { money } from '@/lib/format';
import type { Unit, User } from '@/lib/types';

interface Resident extends Pick<User, 'name' | 'email' | 'phone' | 'role' | 'points' | 'badges'> {
  _id: string;
  primaryUnit?: { number: string; block?: string } | null;
}

export default function DirectoryPage() {
  const { user, loading } = useRequireAuth();
  const router = useRouter();
  const [tab, setTab] = useState<'units' | 'residents'>('units');
  const [units, setUnits] = useState<Unit[] | null>(null);
  const [residents, setResidents] = useState<Resident[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const currency = user?.societyInfo?.currency || '₹';

  useEffect(() => {
    if (!loading && user && user.role !== 'committee' && user.role !== 'superadmin') router.replace('/dashboard');
  }, [loading, user, router]);

  const load = useCallback(() => {
    api<Unit[]>('/api/society/units').then(setUnits).catch(() => {});
    api<Resident[]>('/api/society/residents').then(setResidents).catch(() => {});
  }, []);
  useEffect(() => { if (user?.role === 'committee') load(); }, [user, load]);

  if (!user || user.role === 'resident') return null;

  return (
    <div className="py-6">
      <PageHeader title="Directory" subtitle="Units & residents"
        action={tab === 'units' && <button onClick={() => setShowForm((v) => !v)} className="btn-primary">+ Add unit</button>} />

      <div className="mt-4 flex gap-2">
        <button onClick={() => setTab('units')} className={`chip ${tab === 'units' ? 'chip-active' : ''}`}>Units</button>
        <button onClick={() => setTab('residents')} className={`chip ${tab === 'residents' ? 'chip-active' : ''}`}>Residents</button>
      </div>

      {tab === 'units' && showForm && <UnitForm onCreated={() => { setShowForm(false); load(); }} />}

      <div className="mt-5">
        {tab === 'units' ? (
          !units ? <Skeleton count={4} className="h-16" /> : units.length === 0 ? <EmptyState title="No units yet" /> : (
            <div className="grid gap-2 sm:grid-cols-2">
              {units.map((u) => {
                const owner = u.owner as { name?: string } | null;
                const tenant = u.tenant as { name?: string } | null;
                return (
                  <div key={u._id} className="card flex items-center justify-between p-4">
                    <div>
                      <p className="font-bold text-ink-900">{u.number} <span className="font-normal text-ink-400">· {u.type}</span></p>
                      <p className="text-xs text-ink-500 capitalize">{u.occupancy.replace('-', ' ')}{owner?.name ? ` · ${owner.name}` : ''}{tenant?.name ? ` (tenant: ${tenant.name})` : ''}</p>
                    </div>
                    <p className="text-sm font-semibold text-ink-700">{money(u.monthlyMaintenance, currency)}/mo</p>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          !residents ? <Skeleton count={4} className="h-16" /> : (
            <div className="grid gap-2 sm:grid-cols-2">
              {residents.map((r) => (
                <div key={r._id} className="card flex items-center gap-3 p-4">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-100 font-semibold text-brand-700">{r.name?.[0]?.toUpperCase()}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink-900">{r.name} {r.role !== 'resident' && <span className="badge bg-ink-100 text-ink-500 capitalize">{r.role}</span>}</p>
                    <p className="truncate text-xs text-ink-400">{r.primaryUnit?.number || '—'} · {r.points} pts · {r.phone || r.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function UnitForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({ number: '', block: 'A', type: '2BHK', monthlyMaintenance: '2500' });
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/api/society/units', { method: 'POST', body: { ...form, monthlyMaintenance: Number(form.monthlyMaintenance) } });
      onCreated();
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="card mt-4 grid gap-3 p-5 sm:grid-cols-4">
      <input required className="input" placeholder="Number e.g. A-101" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} />
      <input className="input" placeholder="Block" value={form.block} onChange={(e) => setForm({ ...form, block: e.target.value })} />
      <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
        {['Studio', '1BHK', '2BHK', '3BHK', '4BHK', 'Penthouse', 'Shop'].map((t) => <option key={t}>{t}</option>)}
      </select>
      <input type="number" className="input" placeholder="Maintenance" value={form.monthlyMaintenance} onChange={(e) => setForm({ ...form, monthlyMaintenance: e.target.value })} />
      <div className="sm:col-span-4"><button disabled={busy} className="btn-primary">{busy ? 'Adding…' : 'Add unit'}</button></div>
    </form>
  );
}
