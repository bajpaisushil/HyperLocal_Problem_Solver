'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { POST_TYPES } from '@/lib/constants';
import { PageHeader, Skeleton, EmptyState } from '@/components/ui';
import { timeAgo, shortDate, money } from '@/lib/format';
import type { Post, UserLite } from '@/lib/types';

export default function CommunityPage() {
  const { user } = useRequireAuth();
  const currency = user?.societyInfo?.currency || '₹';
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [type, setType] = useState('');
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(() => {
    const p = type ? `?type=${type}` : '';
    api<Post[]>(`/api/community${p}`).then(setPosts).catch(() => {});
  }, [type]);
  useEffect(() => { if (user) load(); }, [user, load]);

  const like = async (id: string) => { await api(`/api/community/${id}/like`, { method: 'POST' }); load(); };
  const rsvp = async (id: string) => { await api(`/api/community/${id}/rsvp`, { method: 'POST' }); load(); };
  const vote = async (id: string, optionIndex: number) => { await api(`/api/community/${id}/vote`, { method: 'POST', body: { optionIndex } }); load(); };

  if (!user) return null;
  const typeMeta = (t: string) => POST_TYPES.find((p) => p.value === t);

  return (
    <div className="py-6">
      <PageHeader title="Community" subtitle="Announcements, events, marketplace & polls"
        action={<button onClick={() => setShowForm((v) => !v)} className="btn-primary">+ New post</button>} />

      {showForm && <PostForm onCreated={() => { setShowForm(false); load(); }} />}

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => setType('')} className={`chip ${!type ? 'chip-active' : ''}`}>All</button>
        {POST_TYPES.map((p) => <button key={p.value} onClick={() => setType(type === p.value ? '' : p.value)} className={`chip ${type === p.value ? 'chip-active' : ''}`}>{p.icon} {p.label}</button>)}
      </div>

      <div className="mt-5 grid gap-3">
        {!posts ? <Skeleton count={3} className="h-32" /> : posts.length === 0 ? <EmptyState icon="📣" title="No posts yet" /> : posts.map((p) => {
          const author = p.author as (UserLite & { _id: string });
          const liked = p.likes?.includes(user.id);
          const going = p.rsvps?.includes(user.id);
          return (
            <div key={p._id} className="card p-5">
              <div className="flex items-center gap-2">
                <span className="badge bg-ink-50 text-ink-500">{typeMeta(p.type)?.icon} {typeMeta(p.type)?.label}</span>
                {p.pinned && <span className="badge bg-amber-50 text-amber-700">📌 Pinned</span>}
                <span className="ml-auto text-xs text-ink-400">{timeAgo(p.createdAt)}</span>
              </div>
              <h3 className="mt-2 text-lg font-bold text-ink-900">{p.title}</h3>
              {p.body && <p className="mt-1 text-ink-600">{p.body}</p>}

              {p.type === 'event' && p.eventDate && (
                <p className="mt-2 text-sm font-medium text-brand-700">📅 {shortDate(p.eventDate)}{p.location ? ` · ${p.location}` : ''}</p>
              )}
              {p.type === 'marketplace' && p.price != null && (
                <p className="mt-2 text-sm font-medium text-ink-800">💰 {money(p.price, currency)}{p.contact ? ` · ${p.contact}` : ''}</p>
              )}
              {p.type === 'poll' && (
                <div className="mt-3 space-y-2">
                  {p.pollOptions.map((o, i) => {
                    const total = p.pollOptions.reduce((s, x) => s + x.votes.length, 0) || 1;
                    const pct = Math.round((o.votes.length / total) * 100);
                    const mine = o.votes.includes(user.id);
                    return (
                      <button key={i} onClick={() => vote(p._id, i)} className="block w-full overflow-hidden rounded-lg border border-ink-200 text-left">
                        <div className="relative px-3 py-2 text-sm">
                          <div className="absolute inset-y-0 left-0 bg-brand-100" style={{ width: `${pct}%` }} />
                          <span className="relative flex justify-between font-medium text-ink-800">
                            <span>{mine && '✓ '}{o.label}</span><span>{pct}% ({o.votes.length})</span>
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="mt-3 flex items-center gap-4 text-sm">
                <button onClick={() => like(p._id)} className={liked ? 'font-semibold text-brand-700' : 'text-ink-500 hover:text-ink-800'}>
                  ♥ {p.likes?.length || 0}
                </button>
                {p.type === 'event' && (
                  <button onClick={() => rsvp(p._id)} className={going ? 'font-semibold text-brand-700' : 'text-ink-500 hover:text-ink-800'}>
                    🙋 RSVP ({p.rsvps?.length || 0})
                  </button>
                )}
                <span className="text-ink-400">by {author?.name}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PostForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({ type: 'announcement', title: '', body: '', eventDate: '', location: '', price: '', contact: '', pollOptions: '' });
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const body: Record<string, unknown> = { type: form.type, title: form.title, body: form.body };
      if (form.type === 'event') { body.eventDate = form.eventDate; body.location = form.location; }
      if (form.type === 'marketplace') { body.price = form.price; body.contact = form.contact; }
      if (form.type === 'poll') body.pollOptions = form.pollOptions.split(',').map((s) => s.trim()).filter(Boolean);
      await api('/api/community', { method: 'POST', body });
      onCreated();
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="card mt-4 grid gap-3 p-5">
      <div className="flex flex-wrap gap-2">
        {POST_TYPES.map((p) => <button type="button" key={p.value} onClick={() => setForm({ ...form, type: p.value })} className={`chip ${form.type === p.value ? 'chip-active' : ''}`}>{p.icon} {p.label}</button>)}
      </div>
      <input required className="input" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <textarea rows={2} className="input resize-none" placeholder="Details…" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
      {form.type === 'event' && (
        <div className="grid grid-cols-2 gap-3">
          <input type="date" className="input" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} />
          <input className="input" placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        </div>
      )}
      {form.type === 'marketplace' && (
        <div className="grid grid-cols-2 gap-3">
          <input type="number" className="input" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <input className="input" placeholder="Contact" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
        </div>
      )}
      {form.type === 'poll' && <input className="input" placeholder="Options, comma-separated" value={form.pollOptions} onChange={(e) => setForm({ ...form, pollOptions: e.target.value })} />}
      <div><button disabled={busy} className="btn-primary">{busy ? 'Posting…' : 'Post'}</button></div>
    </form>
  );
}
