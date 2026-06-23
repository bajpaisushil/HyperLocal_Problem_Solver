'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { api, mediaUrl } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { CATEGORY_MAP, STATUS_META } from '@/lib/constants';
import { StatusBadge, SeverityBadge, OverdueBadge, Stars } from '@/components/ui';
import { timeAgo, deadlineLabel, money } from '@/lib/format';
import type { Complaint, Vendor, UnitLite, VendorLite, UserLite } from '@/lib/types';

export default function ComplaintDetail() {
  const { id } = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [c, setC] = useState<Complaint | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    try {
      setC(await api<Complaint>(`/api/complaints/${id}`));
    } catch (e) {
      setErr((e as Error).message);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (user?.role === 'committee') api<Vendor[]>('/api/vendors').then(setVendors).catch(() => {});
  }, [user]);

  const act = async (key: string, fn: () => Promise<unknown>) => {
    if (!user) return router.push('/login');
    setBusy(key);
    setErr('');
    try {
      await fn();
      await load();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy('');
    }
  };

  if (err && !c) return <p className="py-10 text-rose-600">{err}</p>;
  if (!c) return <div className="card mt-8 h-96 animate-pulse bg-ink-50" />;

  const cat = CATEGORY_MAP[c.category] || CATEGORY_MAP.other;
  const isCommittee = user?.role === 'committee' || user?.role === 'superadmin';
  const reporter = c.reporter as (UserLite & { _id: string });
  const unit = c.unit as (UnitLite & { _id: string }) | null;
  const vendor = c.assignedVendor as (VendorLite & { _id: string }) | null;
  const upvoted = !!user && c.upvotes?.includes(user.id);
  const dl = deadlineLabel(c.hoursToDeadline);

  return (
    <div className="py-6">
      {(!!search.get('dup') || !!(c as { duplicateOf?: unknown }).duplicateOf) && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          ⚠️ A similar complaint may already exist — the committee can verify and merge duplicates.
        </div>
      )}
      <button onClick={() => router.back()} className="mb-3 text-sm text-ink-500 hover:text-ink-800">← Back</button>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          <div className="card overflow-hidden">
            {c.images?.length ? (
              <div className="flex gap-1 overflow-x-auto bg-ink-900/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {c.images.map((src, i) => <img key={i} src={mediaUrl(src)} alt="" className="h-64 w-auto object-cover" />)}
              </div>
            ) : (
              <div className="grid h-40 place-items-center bg-ink-50 text-6xl">{cat.icon}</div>
            )}
            <div className="p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="chip !py-0.5 !text-xs">{cat.icon} {cat.label}</span>
                <StatusBadge status={c.status} />
                <SeverityBadge severity={c.severity} />
                {c.isOverdue && <OverdueBadge />}
              </div>
              <h1 className="mt-3 text-2xl font-bold text-ink-900">{c.title}</h1>
              <p className="mt-2 whitespace-pre-line text-ink-600">{c.description}</p>
              {c.aiSummary && (
                <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/60 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-brand-700">🧠 AI summary · {Math.round((c.aiConfidence || 0) * 100)}% confidence</p>
                  <p className="mt-1 text-sm text-ink-700">{c.aiSummary}</p>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-500">
                <span>📍 {c.isCommonArea ? 'Common area' : unit?.number || 'Unit'}</span>
                <span>🙋 {reporter?.name}</span>
                {vendor && <span>🔧 {vendor.name}</span>}
                <span>🕒 {timeAgo(c.createdAt)}</span>
              </div>
            </div>
          </div>

          {c.status === 'resolved-pending' && (
            <div className="card border-violet-200 p-6">
              <h2 className="font-bold text-ink-900">🤝 A fix was submitted — verify it</h2>
              <p className="mt-1 text-sm text-ink-500">2 confirmations close it; 2 disputes reopen it.</p>
              {c.resolutionProof && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mediaUrl(c.resolutionProof)} alt="Proof" className="mt-3 max-h-72 rounded-xl object-cover" />
              )}
              {c.resolutionNote && <p className="mt-2 text-sm italic text-ink-600">“{c.resolutionNote}”</p>}
              <div className="mt-4 flex gap-3">
                <button disabled={!!busy} onClick={() => act('confirm', () => api(`/api/complaints/${id}/confirm-resolution`, { method: 'POST' }))} className="btn-primary">
                  ✓ Confirm fixed ({c.resolutionConfirmations?.length || 0})
                </button>
                <button disabled={!!busy} onClick={() => act('dispute', () => api(`/api/complaints/${id}/dispute-resolution`, { method: 'POST' }))} className="btn-danger">
                  ✗ Not fixed ({c.resolutionDisputes?.length || 0})
                </button>
              </div>
            </div>
          )}

          <div className="card p-6">
            <h2 className="font-bold text-ink-900">Status timeline</h2>
            <ol className="mt-4 space-y-4">
              {c.statusHistory?.map((ev, i) => {
                const m = STATUS_META[ev.status] || STATUS_META.open;
                const by = ev.by as (UserLite & { _id: string }) | undefined;
                return (
                  <li key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className="h-3 w-3 rounded-full" style={{ background: m.hex }} />
                      {i < c.statusHistory.length - 1 && <span className="my-1 w-px flex-1 bg-ink-200" />}
                    </div>
                    <div className="-mt-1 pb-1">
                      <p className="text-sm font-semibold text-ink-800">{m.label}</p>
                      {ev.note && <p className="text-sm text-ink-500">{ev.note}</p>}
                      <p className="text-xs text-ink-400">{by?.name ? `${by.name} · ` : ''}{timeAgo(ev.at)}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        <div className="space-y-5">
          {c.isCommonArea && (
            <div className="card p-5">
              <p className="text-center text-3xl font-bold text-ink-900">{c.upvoteCount ?? c.upvotes?.length ?? 0}</p>
              <p className="text-center text-xs text-ink-400">residents affected</p>
              <button disabled={!!busy} onClick={() => act('upvote', () => api(`/api/complaints/${id}/upvote`, { method: 'POST' }))} className={`mt-3 w-full ${upvoted ? 'btn-primary' : 'btn-ghost'}`}>
                ▲ {upvoted ? 'Upvoted' : 'Me too / Upvote'}
              </button>
            </div>
          )}

          {dl && (
            <div className={`card p-4 text-center text-sm font-semibold ${c.isOverdue ? 'text-rose-700' : 'text-ink-600'}`}>
              ⏱ SLA: {dl}
            </div>
          )}

          {vendor && (c.status === 'resolved' || c.status === 'resolved-pending') && (
            <VendorRating vendorId={vendor._id} vendorName={vendor.name} complaintId={c._id} onRated={load} />
          )}

          {isCommittee && <CommitteePanel complaint={c} vendors={vendors} busy={busy} act={act} id={id} />}

          {(user?.id === reporter?._id || isCommittee) && (
            <button disabled={!!busy} onClick={() => act('delete', async () => { await api(`/api/complaints/${id}`, { method: 'DELETE' }); router.push('/complaints'); })} className="btn w-full text-sm text-rose-600 hover:bg-rose-50">
              Delete complaint
            </button>
          )}
          {err && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</p>}
        </div>
      </div>
    </div>
  );
}

function CommitteePanel({ complaint, vendors, busy, act, id }: { complaint: Complaint; vendors: Vendor[]; busy: string; act: (k: string, f: () => Promise<unknown>) => void; id: string }) {
  const [vendorId, setVendorId] = useState('');
  const [note, setNote] = useState('');
  const [cost, setCost] = useState('');
  const [proof, setProof] = useState<File | null>(null);
  const closed = complaint.status === 'resolved' || complaint.status === 'rejected';
  const matching = vendors.filter((v) => v.trade === complaint.category);
  const vendorOptions = matching.length ? matching : vendors;

  return (
    <div className="card border-brand-200 p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-brand-700">🏛️ Committee controls</p>

      <div className="mt-3">
        <label className="label">Assign vendor</label>
        <div className="flex gap-2">
          <select value={vendorId} onChange={(e) => setVendorId(e.target.value)} className="input !py-2 text-sm">
            <option value="">Choose vendor…</option>
            {vendorOptions.map((v) => <option key={v._id} value={v._id}>{v.name} · {v.trade} (★{v.ratingAvg.toFixed(1)})</option>)}
          </select>
          <button disabled={!vendorId || !!busy} onClick={() => act('assign', () => api(`/api/complaints/${id}/assign-vendor`, { method: 'POST', body: { vendorId } }))} className="btn-ghost shrink-0">Assign</button>
        </div>
      </div>

      <textarea rows={2} className="input mt-3 resize-none" placeholder="Status note (optional)…" value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="mt-2 grid grid-cols-3 gap-2">
        {(['assigned', 'in-progress', 'rejected'] as const).map((s) => (
          <button key={s} disabled={!!busy || closed} onClick={() => act(`s-${s}`, () => api(`/api/complaints/${id}/status`, { method: 'PATCH', body: { status: s, note } }))} className="btn-ghost !px-2 !text-xs capitalize">
            {s.replace('-', ' ')}
          </button>
        ))}
      </div>

      {!closed && (
        <div className="mt-4 rounded-xl bg-brand-50/60 p-3">
          <p className="text-xs font-semibold text-brand-800">Submit fix (proof required)</p>
          <input type="file" accept="image/*" className="mt-2 w-full text-xs" onChange={(e) => setProof(e.target.files?.[0] || null)} />
          <input type="number" className="input mt-2 !py-2 text-sm" placeholder="Repair cost (optional)" value={cost} onChange={(e) => setCost(e.target.value)} />
          <button
            disabled={!!busy || !proof}
            onClick={() => act('resolve', () => {
              const fd = new FormData();
              if (proof) fd.append('proof', proof);
              fd.append('note', note);
              if (cost) fd.append('cost', cost);
              return api(`/api/complaints/${id}/resolve`, { method: 'POST', body: fd });
            })}
            className="btn-primary mt-2 w-full !py-2 text-xs"
          >
            🛠️ Submit fix for resident review
          </button>
        </div>
      )}
    </div>
  );
}

function VendorRating({ vendorId, vendorName, complaintId, onRated }: { vendorId: string; vendorName: string; complaintId: string; onRated: () => void }) {
  const [stars, setStars] = useState(0);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const rate = async (n: number) => {
    setStars(n);
    setBusy(true);
    try {
      await api(`/api/vendors/${vendorId}/rate`, { method: 'POST', body: { stars: n, complaintId } });
      setDone(true);
      onRated();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card p-5">
      <p className="text-sm font-semibold text-ink-800">Rate {vendorName}</p>
      {done ? (
        <p className="mt-2 text-sm text-brand-700">Thanks for rating! <Stars value={stars} /></p>
      ) : (
        <div className="mt-2 flex gap-1 text-2xl">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} disabled={busy} onClick={() => rate(n)} className={n <= stars ? 'text-amber-500' : 'text-ink-200 hover:text-amber-400'}>★</button>
          ))}
        </div>
      )}
    </div>
  );
}
