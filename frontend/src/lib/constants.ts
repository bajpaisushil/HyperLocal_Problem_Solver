export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface CategoryMeta {
  value: string;
  label: string;
  icon: string;
}

export const COMPLAINT_CATEGORIES: CategoryMeta[] = [
  { value: 'plumbing', label: 'Plumbing', icon: '🚰' },
  { value: 'electrical', label: 'Electrical', icon: '⚡' },
  { value: 'lift', label: 'Lift', icon: '🛗' },
  { value: 'security', label: 'Security', icon: '🛡️' },
  { value: 'housekeeping', label: 'Housekeeping', icon: '🧹' },
  { value: 'water-supply', label: 'Water Supply', icon: '💧' },
  { value: 'common-area', label: 'Common Area', icon: '🏛️' },
  { value: 'parking', label: 'Parking', icon: '🅿️' },
  { value: 'carpentry', label: 'Carpentry', icon: '🔨' },
  { value: 'pest-control', label: 'Pest Control', icon: '🐜' },
  { value: 'other', label: 'Other', icon: '📋' },
];
export const CATEGORY_MAP: Record<string, CategoryMeta> = Object.fromEntries(
  COMPLAINT_CATEGORIES.map((c) => [c.value, c])
);

export interface StatusMeta {
  label: string;
  classes: string;
  hex: string;
}
export const STATUS_META: Record<string, StatusMeta> = {
  open: { label: 'Open', classes: 'bg-ink-100 text-ink-700', hex: '#63718c' },
  assigned: { label: 'Assigned', classes: 'bg-blue-100 text-blue-700', hex: '#2563eb' },
  'in-progress': { label: 'In Progress', classes: 'bg-amber-100 text-amber-800', hex: '#d97706' },
  'resolved-pending': { label: 'Fix Pending Review', classes: 'bg-violet-100 text-violet-700', hex: '#7c3aed' },
  resolved: { label: 'Resolved', classes: 'bg-brand-100 text-brand-700', hex: '#0d9488' },
  disputed: { label: 'Disputed', classes: 'bg-rose-100 text-rose-700', hex: '#e11d48' },
  rejected: { label: 'Rejected', classes: 'bg-ink-100 text-ink-500', hex: '#94a3b8' },
};

export const SEVERITY_META: Record<string, StatusMeta> = {
  low: { label: 'Low', classes: 'bg-ink-100 text-ink-600', hex: '#63718c' },
  medium: { label: 'Medium', classes: 'bg-amber-100 text-amber-700', hex: '#d97706' },
  high: { label: 'High', classes: 'bg-orange-100 text-orange-700', hex: '#ea580c' },
  critical: { label: 'Critical', classes: 'bg-rose-100 text-rose-700', hex: '#e11d48' },
};

export const INVOICE_STATUS_META: Record<string, StatusMeta> = {
  pending: { label: 'Pending', classes: 'bg-amber-100 text-amber-800', hex: '#d97706' },
  partial: { label: 'Partial', classes: 'bg-blue-100 text-blue-700', hex: '#2563eb' },
  paid: { label: 'Paid', classes: 'bg-brand-100 text-brand-700', hex: '#0d9488' },
  overdue: { label: 'Overdue', classes: 'bg-rose-100 text-rose-700', hex: '#e11d48' },
};

export const POST_TYPES: CategoryMeta[] = [
  { value: 'announcement', label: 'Announcement', icon: '📢' },
  { value: 'event', label: 'Event', icon: '🎉' },
  { value: 'notice', label: 'Notice', icon: '📌' },
  { value: 'marketplace', label: 'Marketplace', icon: '🛒' },
  { value: 'poll', label: 'Poll', icon: '🗳️' },
];

export const BADGE_META: Record<string, { label: string; icon: string }> = {
  newcomer: { label: 'Newcomer', icon: '🌱' },
  reporter: { label: 'Reporter', icon: '📢' },
  guardian: { label: 'Guardian', icon: '🛡️' },
  hero: { label: 'Community Hero', icon: '🏅' },
};

export const formatCategory = (c?: string) => (c || '').replace(/-/g, ' ');
