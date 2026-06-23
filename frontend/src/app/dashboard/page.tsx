'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { api } from '@/lib/api';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { CATEGORY_MAP, STATUS_META, formatCategory } from '@/lib/constants';
import { StatCard, Skeleton, StatusBadge } from '@/components/ui';
import { money, timeAgo } from '@/lib/format';
import type { Dashboard } from '@/lib/types';

interface Insights {
  trendingCategory: string | null;
  hotspotBlocks: { block: string; count: number }[];
  recommendation: string;
  accountability: { openComplaints: number; overdueComplaints: number; onTimeRate: number };
}

export default function DashboardPage() {
  const { user } = useRequireAuth();
  const [data, setData] = useState<Dashboard | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);

  useEffect(() => {
    if (!user) return;
    api<Dashboard>('/api/dashboard').then(setData).catch(() => {});
    api<Insights>('/api/complaints/insights').then(setInsights).catch(() => {});
  }, [user]);

  if (!user || !data) return <div className="py-6"><Skeleton count={4} className="h-24" /></div>;

  const currency = user.societyInfo?.currency || '₹';
  const { totals, finance } = data;
  const statusData = Object.entries(data.byStatus).map(([k, v]) => ({
    name: STATUS_META[k]?.label || k, value: v, hex: STATUS_META[k]?.hex || '#94a3b8',
  }));
  const catData = Object.entries(data.byCategory).map(([k, v]) => ({ name: CATEGORY_MAP[k]?.label || k, value: v }));

  return (
    <div className="py-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">{user.societyInfo?.name || 'Your society'}</h1>
          <p className="mt-1 text-ink-500">{user.societyInfo?.city} · operations overview</p>
        </div>
        <Link href="/complaints/new" className="btn-primary">+ Report complaint</Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Open complaints" value={totals.open} sub={`${totals.overdue} overdue`} accent={totals.overdue ? 'amber' : 'ink'} />
        <StatCard label="SLA on-time" value={`${totals.slaOnTimeRate}%`} accent={totals.slaOnTimeRate >= 70 ? 'brand' : 'rose'} />
        <StatCard label="Dues collection" value={`${finance.collectionRate}%`} sub={`${money(finance.outstanding, currency)} outstanding`} accent={finance.collectionRate >= 70 ? 'brand' : 'amber'} />
        <StatCard label="Net balance" value={money(finance.net, currency)} sub={`${money(finance.income, currency)} in · ${money(finance.expenses, currency)} out`} accent={finance.net >= 0 ? 'brand' : 'rose'} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Units" value={totals.units} />
        <StatCard label="Residents" value={totals.residents} />
        <StatCard label="Resolved" value={totals.resolved} />
        <StatCard label="Visitors today" value={totals.visitorsToday} />
      </div>

      {insights && (
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <div className="card p-5 lg:col-span-2">
            <p className="text-xs font-bold uppercase tracking-wide text-brand-700">🧠 AI insight</p>
            <p className="mt-2 text-ink-700">{insights.recommendation}</p>
            {insights.trendingCategory && (
              <p className="mt-2 text-sm text-ink-500">
                Trending: <span className="font-semibold capitalize text-ink-800">{formatCategory(insights.trendingCategory)}</span>
                {insights.hotspotBlocks[0] && <> · Hotspot: <span className="font-semibold text-ink-800">Block {insights.hotspotBlocks[0].block}</span></>}
              </p>
            )}
          </div>
          <div className="card flex flex-col justify-center p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-ink-400">Accountability</p>
            <p className="mt-1 text-3xl font-bold text-ink-900">{insights.accountability.onTimeRate}%</p>
            <p className="text-sm text-ink-500">{insights.accountability.overdueComplaints} overdue of {insights.accountability.openComplaints} open</p>
          </div>
        </div>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="mb-3 font-semibold text-ink-800">Complaints by status</h3>
          {statusData.length ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={85} paddingAngle={2}>
                    {statusData.map((d, i) => <Cell key={i} fill={d.hex} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 text-xs">
                {statusData.map((d) => (
                  <span key={d.name} className="flex items-center gap-1.5 text-ink-600">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.hex }} />{d.name} ({d.value})
                  </span>
                ))}
              </div>
            </>
          ) : <p className="py-10 text-center text-ink-400">No complaints yet.</p>}
        </div>

        <div className="card p-5">
          <h3 className="mb-3 font-semibold text-ink-800">Complaints by category</h3>
          {catData.length ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={catData} margin={{ left: -20, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eceef2" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#828fa7' }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#828fa7' }} />
                <Tooltip cursor={{ fill: '#f6f7f9' }} />
                <Bar dataKey="value" fill="#0d9488" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="py-10 text-center text-ink-400">No complaints yet.</p>}
        </div>
      </div>

      <div className="mt-5 card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-ink-800">Recent complaints</h3>
          <Link href="/complaints" className="text-sm font-semibold text-brand-700">View all →</Link>
        </div>
        <div className="divide-y divide-ink-100">
          {data.recent.map((c) => (
            <Link key={c._id} href={`/complaints/${c._id}`} className="flex items-center justify-between py-2.5 hover:opacity-80">
              <span className="flex items-center gap-2">
                <span>{CATEGORY_MAP[c.category]?.icon}</span>
                <span className="font-medium text-ink-800">{c.title}</span>
              </span>
              <span className="flex items-center gap-3">
                <StatusBadge status={c.status} />
                <span className="text-xs text-ink-400">{timeAgo(c.createdAt)}</span>
              </span>
            </Link>
          ))}
          {data.recent.length === 0 && <p className="py-6 text-center text-ink-400">Nothing yet.</p>}
        </div>
      </div>
    </div>
  );
}
