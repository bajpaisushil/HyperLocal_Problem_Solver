import Link from 'next/link';
import { CATEGORY_MAP } from '@/lib/constants';
import { StatusBadge, SeverityBadge, OverdueBadge } from '@/components/ui';
import { timeAgo, deadlineLabel } from '@/lib/format';
import { mediaUrl } from '@/lib/api';
import type { Complaint, UnitLite, VendorLite } from '@/lib/types';

export default function ComplaintCard({ complaint }: { complaint: Complaint }) {
  const cat = CATEGORY_MAP[complaint.category] || CATEGORY_MAP.other;
  const thumb = complaint.images?.[0];
  const dl = deadlineLabel(complaint.hoursToDeadline);
  const unit = complaint.unit as (UnitLite & { _id: string }) | null;
  const vendor = complaint.assignedVendor as (VendorLite & { _id: string }) | null;

  return (
    <Link href={`/complaints/${complaint._id}`} className="card group flex gap-4 overflow-hidden p-4 transition hover:shadow-lift">
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-ink-100">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl(thumb)} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
        ) : (
          <div className="grid h-full w-full place-items-center text-3xl">{cat.icon}</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-semibold text-ink-900 group-hover:text-brand-700">{complaint.title}</h3>
          {complaint.isOverdue && <OverdueBadge />}
        </div>
        <p className="mt-0.5 line-clamp-2 text-sm text-ink-500">{complaint.description}</p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="chip !py-0.5 !text-xs">{cat.icon} {cat.label}</span>
          <StatusBadge status={complaint.status} />
          <SeverityBadge severity={complaint.severity} />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-400">
          <span>📍 {complaint.isCommonArea ? 'Common area' : unit?.number || 'Unit'}</span>
          {vendor && <span>🔧 {vendor.name}</span>}
          {dl && <span className={complaint.isOverdue ? 'font-semibold text-rose-600' : ''}>⏱ {dl}</span>}
          <span>{timeAgo(complaint.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
