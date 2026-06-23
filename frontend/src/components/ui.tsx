import type { ReactNode } from 'react';
import { STATUS_META, SEVERITY_META, INVOICE_STATUS_META, BADGE_META } from '@/lib/constants';

export function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] || STATUS_META.open;
  return <span className={`badge ${m.classes}`}>{m.label}</span>;
}

export function SeverityBadge({ severity }: { severity: string }) {
  const m = SEVERITY_META[severity] || SEVERITY_META.medium;
  return (
    <span className={`badge ${m.classes}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {m.label}
    </span>
  );
}

export function InvoiceBadge({ status }: { status: string }) {
  const m = INVOICE_STATUS_META[status] || INVOICE_STATUS_META.pending;
  return <span className={`badge ${m.classes}`}>{m.label}</span>;
}

export function OverdueBadge() {
  return (
    <span className="badge bg-rose-600 text-white">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
      SLA breached
    </span>
  );
}

export function AchievementBadge({ name }: { name: string }) {
  const m = BADGE_META[name] || { label: name, icon: '⭐' };
  return (
    <span className="badge bg-amber-50 text-amber-800" title={m.label}>
      {m.icon} {m.label}
    </span>
  );
}

export function StatCard({
  label,
  value,
  sub,
  accent = 'ink',
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: 'ink' | 'brand' | 'amber' | 'rose';
}) {
  const colors = { ink: 'text-ink-900', brand: 'text-brand-600', amber: 'text-amber-600', rose: 'text-rose-600' };
  return (
    <div className="card p-5">
      <p className="text-sm text-ink-400">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${colors[accent]}`}>{value}</p>
      {sub != null && <p className="mt-0.5 text-xs text-ink-400">{sub}</p>}
    </div>
  );
}

export function EmptyState({ icon = '🍃', title, hint }: { icon?: string; title: string; hint?: string }) {
  return (
    <div className="card grid place-items-center p-16 text-center">
      <div className="text-4xl">{icon}</div>
      <p className="mt-2 font-semibold text-ink-700">{title}</p>
      {hint && <p className="text-sm text-ink-400">{hint}</p>}
    </div>
  );
}

export function Skeleton({ count = 3, className = 'h-28' }: { count?: number; className?: string }) {
  return (
    <div className="grid gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`card animate-pulse bg-ink-50 ${className}`} />
      ))}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">{title}</h1>
        {subtitle && <p className="mt-1 text-ink-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Stars({ value }: { value: number }) {
  const full = Math.round(value);
  return (
    <span className="text-amber-500" title={value.toFixed(1)}>
      {'★'.repeat(full)}
      <span className="text-ink-200">{'★'.repeat(5 - full)}</span>
    </span>
  );
}
