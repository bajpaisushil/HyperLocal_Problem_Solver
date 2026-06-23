'use client';

import { useEffect, useState, useCallback } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { api } from '@/lib/api';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { StatCard, InvoiceBadge, Skeleton, EmptyState, PageHeader } from '@/components/ui';
import { money, shortDate } from '@/lib/format';
import { formatCategory } from '@/lib/constants';
import type { FinanceSummary, Invoice, Expense } from '@/lib/types';

const PIE_COLORS = ['#0d9488', '#2563eb', '#d97706', '#7c3aed', '#e11d48', '#0891b2', '#65a30d', '#db2777'];

export default function FinancePage() {
  const { user } = useRequireAuth();
  const isCommittee = user?.role === 'committee' || user?.role === 'superadmin';
  const currency = user?.societyInfo?.currency || '₹';
  const [tab, setTab] = useState<'dues' | 'transparency' | 'expenses'>('dues');

  const [dues, setDues] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [busy, setBusy] = useState('');

  const loadDues = useCallback(() => { api<Invoice[]>('/api/finance/my-dues').then(setDues).catch(() => {}); }, []);
  useEffect(() => {
    if (!user) return;
    loadDues();
    api<FinanceSummary>('/api/finance/summary').then(setSummary).catch(() => {});
    api<Expense[]>('/api/finance/expenses').then(setExpenses).catch(() => {});
  }, [user, loadDues]);

  const pay = async (inv: Invoice) => {
    setBusy(inv._id);
    try {
      await api(`/api/finance/invoices/${inv._id}/pay`, { method: 'POST', body: {} });
      loadDues();
    } finally {
      setBusy('');
    }
  };

  if (!user) return null;
  const outstandingMine = dues.reduce((s, d) => s + Math.max(d.amount - d.paidAmount, 0), 0);
  const expenseData = summary ? Object.entries(summary.expensesByCategory).map(([k, v]) => ({ name: formatCategory(k), value: v })) : [];

  const TABS: [typeof tab, string][] = [['dues', 'My dues'], ['transparency', 'Balance sheet'], ['expenses', 'Expenses']];

  return (
    <div className="py-6">
      <PageHeader title="Finances" subtitle="Transparent dues, spending and balance sheet" />

      <div className="mt-4 flex gap-2">
        {TABS.map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)} className={`chip ${tab === v ? 'chip-active' : ''}`}>{l}</button>
        ))}
      </div>

      {tab === 'dues' && (
        <div className="mt-5">
          <StatCard label="Your outstanding dues" value={money(outstandingMine, currency)} accent={outstandingMine ? 'rose' : 'brand'} />
          <div className="mt-4 grid gap-3">
            {dues.length === 0 ? <EmptyState icon="🎉" title="No dues — you're all settled!" /> : dues.map((d) => {
              const bal = Math.max(d.amount - d.paidAmount, 0);
              return (
                <div key={d._id} className="card flex items-center justify-between p-4">
                  <div>
                    <p className="font-semibold text-ink-900 capitalize">{formatCategory(d.type)} · {d.period}</p>
                    <p className="text-sm text-ink-500">Due {shortDate(d.dueDate)} · {money(d.amount, currency)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <InvoiceBadge status={d.status} />
                    {bal > 0 ? (
                      <button disabled={busy === d._id} onClick={() => pay(d)} className="btn-primary !py-2">{busy === d._id ? '…' : `Pay ${money(bal, currency)}`}</button>
                    ) : <span className="text-sm font-semibold text-brand-600">Paid</span>}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-center text-xs text-ink-400">Payment gateway is stubbed for the demo — “Pay” marks the invoice settled.</p>
        </div>
      )}

      {tab === 'transparency' && (
        summary ? (
          <div className="mt-5 space-y-5">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label="Collected" value={money(summary.income, currency)} sub={`${summary.collectionRate}% collection`} accent="brand" />
              <StatCard label="Outstanding" value={money(summary.outstanding, currency)} accent="amber" />
              <StatCard label="Expenses" value={money(summary.expenseTotal, currency)} />
              <StatCard label="Net" value={money(summary.net, currency)} accent={summary.net >= 0 ? 'brand' : 'rose'} />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="card p-5">
                <h3 className="mb-3 font-semibold text-ink-800">Income vs expense (6 months)</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={summary.trend} margin={{ left: -10, right: 8, top: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eceef2" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#828fa7' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#828fa7' }} />
                    <Tooltip formatter={(v: number) => money(v, currency)} />
                    <Legend />
                    <Bar dataKey="income" fill="#0d9488" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" fill="#e11d48" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="card p-5">
                <h3 className="mb-3 font-semibold text-ink-800">Spending by category</h3>
                {expenseData.length ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={expenseData} dataKey="value" nameKey="name" outerRadius={90} label={(e) => e.name}>
                        {expenseData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => money(v, currency)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="py-10 text-center text-ink-400">No expenses yet.</p>}
              </div>
            </div>
          </div>
        ) : <div className="mt-5"><Skeleton count={2} className="h-40" /></div>
      )}

      {tab === 'expenses' && (
        <div className="mt-5">
          {isCommittee && <ExpenseForm currency={currency} onCreated={() => api<Expense[]>('/api/finance/expenses').then(setExpenses)} />}
          <div className="mt-4 grid gap-2">
            {expenses.length === 0 ? <EmptyState title="No expenses recorded" /> : expenses.map((e) => (
              <div key={e._id} className="card flex items-center justify-between p-4">
                <div>
                  <p className="font-semibold text-ink-900">{e.description || formatCategory(e.category)}</p>
                  <p className="text-sm text-ink-500 capitalize">{formatCategory(e.category)} · {shortDate(e.date)}{(e.vendor as { name?: string })?.name ? ` · ${(e.vendor as { name?: string }).name}` : ''}</p>
                </div>
                <p className="font-bold text-rose-600">{money(e.amount, currency)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ExpenseForm({ currency, onCreated }: { currency: string; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ category: 'maintenance', amount: '', description: '' });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [ocr, setOcr] = useState<string>('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setOcr('');
    try {
      const fd = new FormData();
      fd.append('category', form.category);
      fd.append('amount', form.amount);
      fd.append('description', form.description);
      if (file) fd.append('invoiceImage', file);
      const res = await api<{ ocr?: { ocrAmount?: number } }>('/api/finance/expenses', { method: 'POST', body: fd });
      if (res.ocr?.ocrAmount) setOcr(`OCR detected amount ≈ ${money(res.ocr.ocrAmount, currency)} (stub)`);
      setForm({ category: 'maintenance', amount: '', description: '' });
      setFile(null);
      onCreated();
    } finally {
      setBusy(false);
    }
  };

  if (!open) return <button onClick={() => setOpen(true)} className="btn-ghost">+ Record expense</button>;
  return (
    <form onSubmit={submit} className="card grid gap-3 p-5 sm:grid-cols-2">
      <div>
        <label className="label">Category</label>
        <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          {['maintenance', 'security', 'housekeeping', 'utilities', 'repairs', 'admin', 'amenities', 'other'].map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Amount ({currency})</label>
        <input required type="number" className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Description</label>
        <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. Diesel for generator" />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Invoice image (OCR stub)</label>
        <input type="file" accept="image/*" className="text-sm" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      </div>
      {ocr && <p className="sm:col-span-2 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700">{ocr}</p>}
      <div className="flex gap-2 sm:col-span-2">
        <button disabled={busy} className="btn-primary">{busy ? 'Saving…' : 'Save expense'}</button>
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost">Cancel</button>
      </div>
    </form>
  );
}
