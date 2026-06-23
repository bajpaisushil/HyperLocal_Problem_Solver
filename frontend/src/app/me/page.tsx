'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { AchievementBadge, Skeleton } from '@/components/ui';
import ComplaintCard from '@/components/ComplaintCard';
import type { Complaint } from '@/lib/types';

interface LeaderUser { id: string; name: string; points: number; badges: string[]; role: string }

export default function ProfilePage() {
  const { user } = useRequireAuth();
  const [complaints, setComplaints] = useState<Complaint[] | null>(null);
  const [leaders, setLeaders] = useState<LeaderUser[]>([]);

  useEffect(() => {
    if (!user) return;
    api<Complaint[]>('/api/complaints/mine').then(setComplaints).catch(() => {});
    api<LeaderUser[]>('/api/auth/leaderboard').then(setLeaders).catch(() => {});
  }, [user]);

  if (!user) return null;
  const resolved = complaints?.filter((c) => c.status === 'resolved').length || 0;

  return (
    <div className="py-6">
      <div className="card flex flex-wrap items-center gap-5 p-6">
        <div className="grid h-20 w-20 place-items-center rounded-2xl bg-brand-600 text-3xl font-bold text-white">{user.name?.[0]?.toUpperCase()}</div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-ink-900">{user.name}</h1>
          <p className="text-ink-500">{user.email} · <span className="capitalize">{user.role}</span>{user.unitInfo?.number ? ` · ${user.unitInfo.number}` : ''}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">{user.badges?.map((b) => <AchievementBadge key={b} name={b} />)}</div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-ink-50 px-4 py-3"><p className="text-2xl font-bold text-brand-600">{user.points}</p><p className="text-xs text-ink-400">points</p></div>
          <div className="rounded-xl bg-ink-50 px-4 py-3"><p className="text-2xl font-bold text-ink-900">{complaints?.length ?? '–'}</p><p className="text-xs text-ink-400">reported</p></div>
          <div className="rounded-xl bg-ink-50 px-4 py-3"><p className="text-2xl font-bold text-ink-900">{resolved}</p><p className="text-xs text-ink-400">resolved</p></div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <h2 className="text-xl font-bold text-ink-900">Your complaints</h2>
          <div className="mt-3 grid gap-3">
            {!complaints ? <Skeleton count={2} /> : complaints.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="text-ink-500">You haven&apos;t reported anything yet.</p>
                <Link href="/complaints/new" className="btn-primary mt-3">Report your first complaint</Link>
              </div>
            ) : complaints.map((c) => <ComplaintCard key={c._id} complaint={c} />)}
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold text-ink-900">🏆 Society leaderboard</h2>
          <div className="card mt-3 divide-y divide-ink-100 p-2">
            {leaders.map((u, i) => (
              <div key={u.id} className={`flex items-center gap-3 p-2.5 ${u.id === user.id ? 'rounded-lg bg-brand-50' : ''}`}>
                <span className="w-6 text-center font-bold text-ink-400">{['🥇', '🥈', '🥉'][i] || i + 1}</span>
                <span className="flex-1 truncate font-medium text-ink-800">{u.name}</span>
                <span className="font-bold text-brand-600">{u.points}</span>
              </div>
            ))}
            {leaders.length === 0 && <p className="p-4 text-center text-sm text-ink-400">No data yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
