import {
  COMPLAINT_CATEGORIES,
  type ComplaintCategory,
  type Severity,
} from '../config/constants.js';

/**
 * AI service — stubbed heuristic implementation.
 *
 * Every function is provider-agnostic: inputs/outputs are plain JSON, so a real
 * model (e.g. Anthropic Claude) can be dropped in by replacing the bodies — the
 * controllers never change. The NL assistant + report functions are written so
 * that swapping in Claude tool-use is a localized change.
 */

// ── Complaint triage ───────────────────────────────────
const KEYWORDS: Record<ComplaintCategory, string[]> = {
  plumbing: ['leak', 'pipe', 'tap', 'faucet', 'water', 'drain', 'toilet', 'sink', 'flush', 'sewage'],
  electrical: ['electric', 'power', 'wire', 'short', 'switch', 'socket', 'meter', 'voltage', 'spark', 'outage'],
  lift: ['lift', 'elevator', 'stuck'],
  security: ['security', 'guard', 'theft', 'unsafe', 'intruder', 'gate', 'cctv', 'camera', 'stranger'],
  housekeeping: ['clean', 'garbage', 'trash', 'waste', 'dirty', 'sweep', 'mop', 'dustbin', 'litter'],
  'water-supply': ['no water', 'water supply', 'tanker', 'borewell', 'tank', 'shortage'],
  'common-area': ['lobby', 'corridor', 'staircase', 'clubhouse', 'gym', 'pool', 'garden', 'park', 'common'],
  parking: ['parking', 'car', 'bike', 'vehicle', 'slot', 'towed'],
  carpentry: ['door', 'wood', 'furniture', 'cabinet', 'hinge', 'window', 'lock'],
  'pest-control': ['pest', 'cockroach', 'mosquito', 'rat', 'termite', 'insect', 'bug'],
  other: [],
};

const SEVERITY_SIGNALS: Record<Exclude<Severity, 'low'>, string[]> = {
  critical: ['fire', 'gas', 'shock', 'electrocut', 'collapse', 'injury', 'flood', 'trapped', 'danger', 'sewage'],
  high: ['urgent', 'unsafe', 'no water', 'no power', 'outage', 'stuck', 'overflow', 'short'],
  medium: ['broken', 'leak', 'not working', 'damaged', 'crack'],
};

function countMatches(text: string, words: string[]): number {
  const lower = text.toLowerCase();
  return words.reduce((acc, w) => acc + (lower.includes(w) ? 1 : 0), 0);
}

export interface TriageInput {
  title?: string;
  description?: string;
}

export function categorizeComplaint({ title = '', description = '' }: TriageInput) {
  const text = `${title} ${description}`;
  let best: { category: ComplaintCategory; score: number } = { category: 'other', score: 0 };
  for (const category of COMPLAINT_CATEGORIES) {
    const score = countMatches(text, KEYWORDS[category]);
    if (score > best.score) best = { category, score };
  }
  const confidence = best.score === 0 ? 0.3 : Math.min(0.5 + best.score * 0.15, 0.97);
  return { category: best.category, confidence: Number(confidence.toFixed(2)) };
}

export function estimateSeverity({
  title = '',
  description = '',
  upvotes = 0,
}: TriageInput & { upvotes?: number }): Severity {
  const text = `${title} ${description}`;
  for (const level of ['critical', 'high', 'medium'] as const) {
    if (countMatches(text, SEVERITY_SIGNALS[level]) > 0) {
      if (upvotes >= 8 && level === 'medium') return 'high';
      return level;
    }
  }
  return upvotes >= 12 ? 'high' : upvotes >= 4 ? 'medium' : 'low';
}

export function summarizeComplaint({
  title = '',
  description = '',
  category = 'other',
}: TriageInput & { category?: ComplaintCategory }): string {
  const clean = description.replace(/\s+/g, ' ').trim();
  const snippet = clean.length > 160 ? `${clean.slice(0, 157)}…` : clean;
  const label = category.replace(/-/g, ' ');
  return `${label.charAt(0).toUpperCase()}${label.slice(1)} issue: ${title}. ${snippet}`.trim();
}

export interface DuplicateCandidate {
  _id: unknown;
  title: string;
  description: string;
  category?: ComplaintCategory;
}

export function detectDuplicate(
  { title = '', description = '', category }: TriageInput & { category?: ComplaintCategory },
  candidates: DuplicateCandidate[] = []
) {
  const tokens = new Set(`${title} ${description}`.toLowerCase().split(/\W+/).filter(Boolean));
  let best: { complaintId: unknown; similarity: number } | null = null;
  for (const c of candidates) {
    const cTokens = new Set(`${c.title} ${c.description}`.toLowerCase().split(/\W+/).filter(Boolean));
    const intersection = [...tokens].filter((t) => cTokens.has(t)).length;
    const union = new Set([...tokens, ...cTokens]).size || 1;
    let similarity = intersection / union;
    if (category && c.category === category) similarity += 0.15;
    if (!best || similarity > best.similarity) {
      best = { complaintId: c._id, similarity: Number(Math.min(similarity, 1).toFixed(2)) };
    }
  }
  return best && best.similarity >= 0.4 ? best : null;
}

export function enrichComplaint(input: TriageInput, candidates: DuplicateCandidate[] = []) {
  const { category, confidence } = categorizeComplaint(input);
  const severity = estimateSeverity({ ...input, upvotes: 0 });
  const summary = summarizeComplaint({ ...input, category });
  const duplicate = detectDuplicate({ ...input, category }, candidates);
  return { category, confidence, severity, summary, duplicate };
}

// ── Predictive insights ────────────────────────────────
export interface InsightComplaint {
  category: ComplaintCategory;
  status: string;
  block?: string;
}

export function predictInsights(complaints: InsightComplaint[]) {
  if (complaints.length === 0) {
    return { trendingCategory: null, hotspotBlocks: [], recommendation: 'Not enough data yet.' };
  }
  const byCategory: Record<string, number> = {};
  const byBlock: Record<string, number> = {};
  for (const c of complaints) {
    byCategory[c.category] = (byCategory[c.category] || 0) + 1;
    if (c.block) byBlock[c.block] = (byBlock[c.block] || 0) + 1;
  }
  const trendingCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  const hotspotBlocks = Object.entries(byBlock)
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([block, count]) => ({ block, count }));
  const recommendation = trendingCategory
    ? `"${trendingCategory.replace(/-/g, ' ')}" is the most reported category. ${
        hotspotBlocks.length ? `Block ${hotspotBlocks[0].block} needs the most attention.` : ''
      }`.trim()
    : 'Complaints are evenly distributed.';
  return { trendingCategory, hotspotBlocks, recommendation };
}

// ── Predictive society operations ──────────────────────
/** Forecast water-tanker requirement from recent daily consumption (litres). */
export function predictTankerNeed(dailyConsumptionLitres: number[], tankCapacity = 20000) {
  if (dailyConsumptionLitres.length === 0) {
    return { avgDailyLitres: 0, projectedTankersPerWeek: 0, recommendation: 'No consumption data.' };
  }
  const avg = dailyConsumptionLitres.reduce((a, b) => a + b, 0) / dailyConsumptionLitres.length;
  const recent = dailyConsumptionLitres.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, dailyConsumptionLitres.length);
  const trend = recent > avg * 1.15 ? 'rising' : recent < avg * 0.85 ? 'falling' : 'steady';
  const tankersPerWeek = Math.ceil((avg * 7) / tankCapacity);
  return {
    avgDailyLitres: Math.round(avg),
    trend,
    projectedTankersPerWeek: tankersPerWeek,
    recommendation:
      trend === 'rising'
        ? `Consumption is rising — pre-book ${tankersPerWeek + 1} tankers this week to avoid shortage.`
        : `Steady usage — ${tankersPerWeek} tankers/week should suffice.`,
  };
}

/** Flag units whose utility reading deviates sharply from their own history. */
export function detectAbnormalConsumption(
  readings: { unitLabel: string; current: number; history: number[] }[]
) {
  const flags: { unitLabel: string; current: number; expected: number; deltaPct: number }[] = [];
  for (const r of readings) {
    if (r.history.length === 0) continue;
    const expected = r.history.reduce((a, b) => a + b, 0) / r.history.length;
    const deltaPct = expected ? Math.round(((r.current - expected) / expected) * 100) : 0;
    if (deltaPct >= 50) flags.push({ unitLabel: r.unitLabel, current: r.current, expected: Math.round(expected), deltaPct });
  }
  return flags.sort((a, b) => b.deltaPct - a.deltaPct);
}

// ── Invoice OCR (stub) ─────────────────────────────────
export function extractInvoice(filename: string) {
  // Real impl: send the image to a vision model and parse line items.
  const amountMatch = filename.match(/(\d{3,7})/);
  return {
    ocrText: 'OCR is stubbed in this build — wire a vision model in aiService.extractInvoice().',
    ocrAmount: amountMatch ? Number(amountMatch[1]) : undefined,
    ocrVendor: undefined as string | undefined,
  };
}

// ── Natural-language assistant ─────────────────────────
export interface AssistantContext {
  currency: string;
  complaints: {
    total: number;
    open: number;
    overdue: number;
    byCategory: Record<string, number>;
    list: { title: string; category: string; status: string; overdue: boolean; unitLabel: string }[];
  };
  dues: {
    outstanding: number;
    collectionRate: number;
    pendingCount: number;
    list: { unitLabel: string; type: string; balance: number; period: string; status: string }[];
  };
  vendors: { name: string; trade: string; ratingAvg: number; jobsCompleted: number; totalCost: number }[];
  expenses: { total: number; byCategory: Record<string, number> };
}

export interface AssistantAnswer {
  intent: string;
  answer: string;
  items?: { label: string; value?: string }[];
}

function money(currency: string, n: number) {
  return `${currency}${n.toLocaleString('en-IN')}`;
}

function extractNumber(q: string): number | null {
  const m = q.replace(/,/g, '').match(/(\d{2,})/);
  return m ? Number(m[1]) : null;
}

/**
 * Interpret a committee/resident question over society data and answer it.
 * Keyword-intent routing today; a Claude tool-use loop later (same signature).
 */
export function runAssistant(query: string, ctx: AssistantContext): AssistantAnswer {
  const q = query.toLowerCase();
  // Word-boundary match so e.g. "overdue" doesn't match the keyword "due".
  const has = (...w: string[]) =>
    w.some((x) => new RegExp(`\\b${x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(q));

  // Pending dues over a threshold
  if (has('due', 'dues', 'pending', 'outstanding', 'unpaid')) {
    const threshold = extractNumber(q);
    let dues = ctx.dues.list.filter((d) => d.balance > 0);
    if (threshold) dues = dues.filter((d) => d.balance >= threshold);
    dues.sort((a, b) => b.balance - a.balance);
    const top = dues.slice(0, 10);
    return {
      intent: 'pending_dues',
      answer: threshold
        ? `${dues.length} unit(s) have pending dues over ${money(ctx.currency, threshold)} (total ${money(
            ctx.currency,
            dues.reduce((s, d) => s + d.balance, 0)
          )}).`
        : `Total outstanding is ${money(ctx.currency, ctx.dues.outstanding)} across ${ctx.dues.pendingCount} invoice(s). Collection rate is ${ctx.dues.collectionRate}%.`,
      items: top.map((d) => ({ label: `${d.unitLabel} · ${d.type} (${d.period})`, value: money(ctx.currency, d.balance) })),
    };
  }

  // Vendor cost / which vendor cost most
  if (has('vendor') && has('cost', 'spent', 'expensive', 'most', 'pay', 'paid')) {
    const vendors = [...ctx.vendors].sort((a, b) => b.totalCost - a.totalCost).slice(0, 8);
    return {
      intent: 'vendor_cost',
      answer: vendors.length
        ? `Top vendor by spend is ${vendors[0].name} (${money(ctx.currency, vendors[0].totalCost)}).`
        : 'No vendor spend recorded yet.',
      items: vendors.map((v) => ({ label: `${v.name} · ${v.trade}`, value: money(ctx.currency, v.totalCost) })),
    };
  }

  // Best / top-rated vendors
  if (has('vendor', 'plumber', 'electrician', 'contractor') && has('best', 'top', 'rated', 'rating', 'recommend')) {
    const vendors = [...ctx.vendors].sort((a, b) => b.ratingAvg - a.ratingAvg).slice(0, 8);
    return {
      intent: 'top_vendors',
      answer: 'Highest-rated vendors:',
      items: vendors.map((v) => ({
        label: `${v.name} · ${v.trade}`,
        value: `★ ${v.ratingAvg.toFixed(1)} (${v.jobsCompleted} jobs)`,
      })),
    };
  }

  // Expense / spending summary
  if (has('expense', 'spend', 'spending', 'cost', 'budget') && !has('vendor')) {
    const cats = Object.entries(ctx.expenses.byCategory).sort((a, b) => b[1] - a[1]);
    return {
      intent: 'expense_summary',
      answer: `Total expenses are ${money(ctx.currency, ctx.expenses.total)}.`,
      items: cats.map(([c, n]) => ({ label: c, value: money(ctx.currency, n) })),
    };
  }

  // Collection rate / finance health
  if (has('collection', 'collect', 'balance sheet', 'health', 'finance', 'maintenance increase', 'increase')) {
    return {
      intent: 'collection_rate',
      answer: `Collection rate is ${ctx.dues.collectionRate}%. Outstanding ${money(
        ctx.currency,
        ctx.dues.outstanding
      )}; total expenses ${money(ctx.currency, ctx.expenses.total)}.`,
    };
  }

  // Overdue complaints
  if (has('overdue', 'breach', 'sla', 'late', 'delayed')) {
    const overdue = ctx.complaints.list.filter((c) => c.overdue);
    return {
      intent: 'overdue_complaints',
      answer: `${overdue.length} complaint(s) have breached their SLA.`,
      items: overdue.slice(0, 10).map((c) => ({ label: `${c.title} · ${c.unitLabel}`, value: c.status })),
    };
  }

  // Open complaints / by category
  if (has('complaint', 'issue', 'request', 'open', 'pending complaint')) {
    const cats = Object.entries(ctx.complaints.byCategory).sort((a, b) => b[1] - a[1]);
    return {
      intent: 'open_complaints',
      answer: `${ctx.complaints.open} open complaint(s) of ${ctx.complaints.total} total (${ctx.complaints.overdue} overdue).`,
      items: cats.map(([c, n]) => ({ label: c, value: String(n) })),
    };
  }

  // Monthly summary
  if (has('summary', 'summarize', 'overview', 'how are we', 'this month', 'report')) {
    return {
      intent: 'monthly_summary',
      answer: `${ctx.complaints.open} open complaints (${ctx.complaints.overdue} overdue). Collection ${ctx.dues.collectionRate}%, outstanding ${money(
        ctx.currency,
        ctx.dues.outstanding
      )}. Expenses ${money(ctx.currency, ctx.expenses.total)}.`,
    };
  }

  return {
    intent: 'unknown',
    answer:
      "I can answer questions about dues, complaints, vendors and expenses. Try: “show pending dues over 5000”, “which vendors cost us most”, or “overdue complaints”.",
  };
}

// ── Auto-generated committee report ────────────────────
export interface ReportContext extends AssistantContext {
  societyName: string;
  period: string;
  resolvedCount: number;
  avgResolutionHours: number | null;
  slaOnTimeRate: number;
  income: number;
}

export function generateCommitteeReport(ctx: ReportContext) {
  const c = ctx.currency;
  const topCat = Object.entries(ctx.complaints.byCategory).sort((a, b) => b[1] - a[1])[0];
  const sections = [
    {
      heading: 'Maintenance & Complaints',
      lines: [
        `${ctx.complaints.total} complaints logged; ${ctx.resolvedCount} resolved, ${ctx.complaints.open} open.`,
        `${ctx.complaints.overdue} breached SLA. On-time rate: ${ctx.slaOnTimeRate}%.`,
        ctx.avgResolutionHours != null ? `Average resolution time: ${ctx.avgResolutionHours}h.` : 'No resolutions recorded.',
        topCat ? `Most common: ${topCat[0].replace(/-/g, ' ')} (${topCat[1]}).` : '',
      ].filter(Boolean),
    },
    {
      heading: 'Finances',
      lines: [
        `Income (dues collected): ${money(c, ctx.income)}.`,
        `Expenses: ${money(c, ctx.expenses.total)}.`,
        `Net: ${money(c, ctx.income - ctx.expenses.total)}.`,
        `Outstanding dues: ${money(c, ctx.dues.outstanding)} (${ctx.dues.pendingCount} invoices). Collection rate ${ctx.dues.collectionRate}%.`,
      ],
    },
    {
      heading: 'Vendors',
      lines: [...ctx.vendors]
        .sort((a, b) => b.jobsCompleted - a.jobsCompleted)
        .slice(0, 5)
        .map((v) => `${v.name} (${v.trade}): ${v.jobsCompleted} jobs, ★${v.ratingAvg.toFixed(1)}, spend ${money(c, v.totalCost)}.`),
    },
  ];
  const summary = `In ${ctx.period}, ${ctx.societyName} handled ${ctx.complaints.total} complaints (${ctx.slaOnTimeRate}% on-time) and collected ${ctx.dues.collectionRate}% of dues, spending ${money(
    c,
    ctx.expenses.total
  )}.`;
  return { societyName: ctx.societyName, period: ctx.period, summary, sections };
}
