export type Role = 'resident' | 'committee' | 'superadmin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  society?: string;
  units: string[];
  primaryUnit?: string;
  points: number;
  badges: string[];
  societyInfo?: { _id: string; name: string; city?: string; currency?: string };
  unitInfo?: { _id: string; number: string; block?: string; type?: string };
}

export type Ref<T> = string | (T & { _id: string });

export interface UnitLite {
  _id: string;
  number: string;
  block?: string;
}
export interface UserLite {
  _id: string;
  name: string;
  role?: Role;
}
export interface VendorLite {
  _id: string;
  name: string;
  trade: string;
  phone?: string;
  ratingAvg?: number;
}

export interface StatusEvent {
  status: string;
  note?: string;
  by?: Ref<UserLite>;
  at: string;
}

export interface Complaint {
  _id: string;
  society: string;
  unit?: Ref<UnitLite> | null;
  isCommonArea: boolean;
  title: string;
  description: string;
  category: string;
  aiCategory?: string;
  aiConfidence?: number;
  aiSummary?: string;
  severity: string;
  status: string;
  statusHistory: StatusEvent[];
  dueAt?: string;
  assignedVendor?: Ref<VendorLite> | null;
  images: string[];
  reporter: Ref<UserLite>;
  upvotes: string[];
  resolutionProof?: string;
  resolutionNote?: string;
  resolutionConfirmations: string[];
  resolutionDisputes: string[];
  cost?: number;
  createdAt: string;
  updatedAt: string;
  upvoteCount?: number;
  isOpen?: boolean;
  isOverdue?: boolean;
  hoursToDeadline?: number | null;
}

export interface Vendor {
  _id: string;
  name: string;
  trade: string;
  phone?: string;
  email?: string;
  verified: boolean;
  active: boolean;
  ratingAvg: number;
  ratingCount: number;
  jobsAssigned: number;
  jobsCompleted: number;
  onTimeCompletions: number;
  slaScore?: number | null;
  ratings: { by: string; stars: number; comment?: string; at: string }[];
}

export interface Invoice {
  _id: string;
  unit: Ref<UnitLite>;
  type: string;
  period: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  status: string;
  balance?: number;
  payments: { amount: number; method: string; reference?: string; at: string }[];
  note?: string;
}

export interface Expense {
  _id: string;
  category: string;
  vendor?: Ref<VendorLite> | null;
  amount: number;
  date: string;
  description: string;
  invoiceImage?: string;
  ocrText?: string;
  ocrAmount?: number;
}

export interface Unit {
  _id: string;
  number: string;
  block: string;
  type: string;
  areaSqft: number;
  occupancy: string;
  monthlyMaintenance: number;
  owner?: Ref<{ _id: string; name: string; phone?: string }> | null;
  tenant?: Ref<{ _id: string; name: string; phone?: string }> | null;
}

export interface Post {
  _id: string;
  type: string;
  title: string;
  body: string;
  author: Ref<UserLite>;
  pinned: boolean;
  eventDate?: string;
  location?: string;
  rsvps: string[];
  price?: number;
  contact?: string;
  likes: string[];
  likeCount?: number;
  comments: { by: Ref<UserLite>; text: string; at: string }[];
  pollOptions: { label: string; votes: string[] }[];
  createdAt: string;
}

export interface Visitor {
  _id: string;
  unit?: Ref<UnitLite> | null;
  name: string;
  phone?: string;
  purpose: string;
  vehicle?: string;
  status: string;
  expectedAt?: string;
  inTime?: string;
  outTime?: string;
  createdAt: string;
}

export interface Dashboard {
  totals: {
    complaints: number;
    open: number;
    resolved: number;
    overdue: number;
    slaOnTimeRate: number;
    units: number;
    residents: number;
    visitorsToday: number;
  };
  finance: { income: number; expenses: number; net: number; outstanding: number; collectionRate: number };
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  recent: Pick<Complaint, '_id' | 'title' | 'category' | 'status' | 'severity' | 'createdAt'>[];
}

export interface FinanceSummary {
  income: number;
  billed: number;
  outstanding: number;
  collectionRate: number;
  expenseTotal: number;
  expensesByCategory: Record<string, number>;
  net: number;
  trend: { month: string; income: number; expense: number }[];
}

export interface AssistantAnswer {
  intent: string;
  answer: string;
  items?: { label: string; value?: string }[];
}

export interface CommitteeReport {
  societyName: string;
  period: string;
  summary: string;
  sections: { heading: string; lines: string[] }[];
}
