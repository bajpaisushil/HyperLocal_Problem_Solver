// ── Roles ──────────────────────────────────────────────
export const ROLES = ['resident', 'committee', 'superadmin'] as const;
export type Role = (typeof ROLES)[number];

// ── Complaints ─────────────────────────────────────────
export const COMPLAINT_CATEGORIES = [
  'plumbing',
  'electrical',
  'lift',
  'security',
  'housekeeping',
  'water-supply',
  'common-area',
  'parking',
  'carpentry',
  'pest-control',
  'other',
] as const;
export type ComplaintCategory = (typeof COMPLAINT_CATEGORIES)[number];

export const COMPLAINT_STATUSES = [
  'open',
  'assigned',
  'in-progress',
  'resolved-pending',
  'resolved',
  'disputed',
  'rejected',
] as const;
export type ComplaintStatus = (typeof COMPLAINT_STATUSES)[number];

export const OPEN_COMPLAINT_STATUSES: ComplaintStatus[] = [
  'open',
  'assigned',
  'in-progress',
  'resolved-pending',
  'disputed',
];

export const SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;
export type Severity = (typeof SEVERITIES)[number];

// ── Finance ────────────────────────────────────────────
export const INVOICE_TYPES = [
  'maintenance',
  'water',
  'electricity',
  'sinking-fund',
  'penalty',
  'rent',
  'other',
] as const;
export type InvoiceType = (typeof INVOICE_TYPES)[number];

export const INVOICE_STATUSES = ['pending', 'partial', 'paid', 'overdue'] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const EXPENSE_CATEGORIES = [
  'maintenance',
  'security',
  'housekeeping',
  'utilities',
  'repairs',
  'admin',
  'amenities',
  'other',
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

// ── Community ──────────────────────────────────────────
export const POST_TYPES = ['announcement', 'event', 'notice', 'marketplace', 'poll'] as const;
export type PostType = (typeof POST_TYPES)[number];

// ── Visitors ───────────────────────────────────────────
export const VISITOR_PURPOSES = [
  'guest',
  'delivery',
  'cab',
  'domestic-help',
  'service',
  'other',
] as const;
export type VisitorPurpose = (typeof VISITOR_PURPOSES)[number];

export const VISITOR_STATUSES = ['expected', 'checked-in', 'checked-out', 'denied'] as const;
export type VisitorStatus = (typeof VISITOR_STATUSES)[number];

// ── SLA engine (hours to resolve, by category) ─────────
export const SLA_HOURS: Record<ComplaintCategory, number> = {
  security: 4,
  lift: 8,
  'water-supply': 12,
  electrical: 12,
  plumbing: 24,
  'pest-control': 48,
  housekeeping: 24,
  'common-area': 72,
  parking: 72,
  carpentry: 48,
  other: 72,
};

export const SEVERITY_MULTIPLIER: Record<Severity, number> = {
  critical: 0.25,
  high: 0.5,
  medium: 1,
  low: 1.5,
};

export function computeDueAt(createdAt: Date, category: ComplaintCategory, severity: Severity): Date {
  const base = SLA_HOURS[category] ?? 72;
  const mult = SEVERITY_MULTIPLIER[severity] ?? 1;
  const hours = Math.max(base * mult, 2);
  return new Date(createdAt.getTime() + hours * 3_600_000);
}
