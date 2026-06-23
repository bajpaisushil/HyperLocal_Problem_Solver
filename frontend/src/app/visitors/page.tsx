'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { PageHeader, Skeleton, EmptyState } from '@/components/ui';
import { timeAgo } from '@/lib/format';
import type { Visitor, UnitLite } from '@/lib/types';

const PURPOSES = ['guest', 'delivery', 'cab', 'domestic-help', 'service', 'other'];
const PURPOSE_ICON: Record<string, string> = { guest: '🧑', delivery: '📦', cab: '🚕', 'domestic-help': '🧹', service: '🔧', other: '👤' };
const STATUS_CLASS: Record<string, string> = {
  expected: 'bg-amber-100 text-amber-800', 'checked-in': 'bg-brand-100 text-brand-700',
  'checked-out': 'bg-ink-100 text-ink-500', denied: 'bg-rose-100 text-rose-700',
};

export default function VisitorsPage() {
  const { user } = useRequireAuth();
  const [visitors, setVisitors] = useState<Visitor[] | null>(null);
  const [form, setForm] = useState({ name: '', purpose: 'guest', phone: '', vehicle: '' });
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => { api<Visitor[]>('/api/visitors').then(setVisitors).catch(() => {}); }, []);
  useEffect(() => { if (user) load(); }, [user, load]);

  const log = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/api/visitors', { method: 'POST', body: form });
      setForm({ name: '', purpose: 'guest', phone: '', vehicle: '' });
      load();
    } finally {
      setBusy(false);
    }
  };
  const setStatus = async (id: string, status: string) => { await api(`/api/visitors/${id}/status`, { method: 'PATCH', body: { status } }); load(); };

  if (!user) return null;

  return (
    <div className="py-6">
      <PageHeader title="Visitor log" subtitle="Track guests, deliveries & services at the gate" />

      <form onSubmit={log} className="card mt-5 grid gap-3 p-5 sm:grid-cols-4">
        <input required className="input sm:col-span-2" placeholder="Visitor name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <select className="input" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })}>
          {PURPOSES.map((p) => <option key={p} value={p}>{PURPOSE_ICON[p]} {p}</option>)}
        </select>
        <input className="input" placeholder="Vehicle (optional)" value={form.vehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value })} />
        <div className="sm:col-span-4"><button disabled={busy} className="btn-primary">{busy ? 'Logging…' : '＋ Log visitor (check in)'}</button></div>
      </form>

      <div className="mt-5 grid gap-2">
        {!visitors ? <Skeleton count={3} className="h-16" /> : visitors.length === 0 ? <EmptyState icon="🚪" title="No visitors logged" /> : visitors.map((v) => {
          const unit = v.unit as (UnitLite & { _id: string }) | null;
          return (
            <div key={v._id} className="card flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{PURPOSE_ICON[v.purpose] || '👤'}</span>
                <div>
                  <p className="font-semibold text-ink-900">{v.name}</p>
                  <p className="text-xs text-ink-400 capitalize">{v.purpose} · {unit?.number || 'society'} · {timeAgo(v.inTime || v.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`badge capitalize ${STATUS_CLASS[v.status]}`}>{v.status.replace('-', ' ')}</span>
                {v.status === 'expected' && <button onClick={() => setStatus(v._id, 'checked-in')} className="btn-ghost !py-1 !text-xs">Check in</button>}
                {v.status === 'checked-in' && <button onClick={() => setStatus(v._id, 'checked-out')} className="btn-ghost !py-1 !text-xs">Check out</button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
