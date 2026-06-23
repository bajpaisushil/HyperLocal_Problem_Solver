'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { COMPLAINT_CATEGORIES, STATUS_META } from '@/lib/constants';
import ComplaintCard from '@/components/ComplaintCard';
import { PageHeader, Skeleton, EmptyState } from '@/components/ui';
import type { Complaint } from '@/lib/types';

const SORTS = [['recent', 'Newest'], ['deadline', 'SLA deadline'], ['upvotes', 'Most upvoted']];

export default function ComplaintsPage() {
  const { user } = useRequireAuth();
  const [items, setItems] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [f, setF] = useState({ category: '', status: '', sort: 'recent', q: '', overdue: false });

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const p = new URLSearchParams();
    if (f.category) p.set('category', f.category);
    if (f.status) p.set('status', f.status);
    if (f.sort) p.set('sort', f.sort);
    if (f.q) p.set('q', f.q);
    if (f.overdue) p.set('overdue', 'true');
    try {
      setItems(await api<Complaint[]>(`/api/complaints?${p}`));
    } finally {
      setLoading(false);
    }
  }, [user, f]);

  useEffect(() => {
    const t = setTimeout(load, f.q ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, f.q]);

  const set = (patch: Partial<typeof f>) => setF((s) => ({ ...s, ...patch }));

  return (
    <div className="py-6">
      <PageHeader
        title="Complaints"
        subtitle={loading ? 'Loading…' : `${items.length} complaints`}
        action={<Link href="/complaints/new" className="btn-primary">+ Report</Link>}
      />

      <div className="mt-5 space-y-3">
        <input className="input max-w-md" placeholder="🔍 Search…" value={f.q} onChange={(e) => set({ q: e.target.value })} />
        <div className="flex flex-wrap gap-2">
          <button onClick={() => set({ category: '' })} className={`chip ${!f.category ? 'chip-active' : ''}`}>All</button>
          {COMPLAINT_CATEGORIES.map((c) => (
            <button key={c.value} onClick={() => set({ category: f.category === c.value ? '' : c.value })} className={`chip ${f.category === c.value ? 'chip-active' : ''}`}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => set({ status: '' })} className={`chip ${!f.status ? 'chip-active' : ''}`}>Any status</button>
          {Object.entries(STATUS_META).map(([v, m]) => (
            <button key={v} onClick={() => set({ status: f.status === v ? '' : v })} className={`chip ${f.status === v ? 'chip-active' : ''}`}>{m.label}</button>
          ))}
          <span className="mx-1 h-5 w-px bg-ink-200" />
          <button onClick={() => set({ overdue: !f.overdue })} className={`chip ${f.overdue ? '!border-rose-400 !bg-rose-50 !text-rose-700' : ''}`}>⏱ Overdue</button>
          <select value={f.sort} onChange={(e) => set({ sort: e.target.value })} className="input max-w-[150px] !py-1.5">
            {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      <div className="mt-6">
        {loading ? <Skeleton count={4} /> : items.length === 0 ? (
          <EmptyState title="No complaints match your filters" hint="Try clearing filters or report a new one." />
        ) : (
          <div className="grid gap-3">{items.map((c) => <ComplaintCard key={c._id} complaint={c} />)}</div>
        )}
      </div>
    </div>
  );
}
