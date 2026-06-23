import { Types } from 'mongoose';
import Complaint from '../models/Complaint.js';
import Invoice from '../models/Invoice.js';
import Expense from '../models/Expense.js';
import Vendor from '../models/Vendor.js';
import Unit from '../models/Unit.js';
import { OPEN_COMPLAINT_STATUSES } from '../config/constants.js';
import type { AssistantContext } from './aiService.js';

/** Map of vendorId -> total expense spent on that vendor. */
export async function vendorSpend(societyId: Types.ObjectId): Promise<Record<string, number>> {
  const rows = await Expense.aggregate<{ _id: Types.ObjectId; total: number }>([
    { $match: { society: societyId, vendor: { $ne: null } } },
    { $group: { _id: '$vendor', total: { $sum: '$amount' } } },
  ]);
  return Object.fromEntries(rows.map((r) => [String(r._id), r.total]));
}

export async function financeSummary(societyId: Types.ObjectId) {
  const [billedAgg, expenseAgg, byCatAgg] = await Promise.all([
    Invoice.aggregate<{ _id: null; billed: number; paid: number }>([
      { $match: { society: societyId } },
      { $group: { _id: null, billed: { $sum: '$amount' }, paid: { $sum: '$paidAmount' } } },
    ]),
    Expense.aggregate<{ _id: null; total: number }>([
      { $match: { society: societyId } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Expense.aggregate<{ _id: string; total: number }>([
      { $match: { society: societyId } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
    ]),
  ]);

  const billed = billedAgg[0]?.billed || 0;
  const paid = billedAgg[0]?.paid || 0;
  const expenseTotal = expenseAgg[0]?.total || 0;
  return {
    income: paid,
    billed,
    outstanding: Math.max(billed - paid, 0),
    collectionRate: billed ? Number(((paid / billed) * 100).toFixed(1)) : 100,
    expenseTotal,
    expensesByCategory: Object.fromEntries(byCatAgg.map((r) => [r._id, r.total])),
    net: paid - expenseTotal,
  };
}

/** Assemble the full data context the AI assistant / report reason over. */
export async function buildAssistantContext(
  societyId: Types.ObjectId,
  currency = '₹'
): Promise<AssistantContext> {
  const [complaints, invoices, units, vendors, spend, fin] = await Promise.all([
    Complaint.find({ society: societyId }).populate('unit', 'number block').lean(),
    Invoice.find({ society: societyId }).populate('unit', 'number block').lean(),
    Unit.find({ society: societyId }).lean(),
    Vendor.find({ $or: [{ society: societyId }, { society: null }] }).lean(),
    vendorSpend(societyId),
    financeSummary(societyId),
  ]);

  const unitLabel = (u: unknown): string => {
    const unit = u as { number?: string } | null;
    return unit?.number || 'Common area';
  };

  const now = Date.now();
  const byCategory: Record<string, number> = {};
  let open = 0;
  let overdue = 0;
  const complaintList = complaints.map((c) => {
    byCategory[c.category] = (byCategory[c.category] || 0) + 1;
    const isOpen = OPEN_COMPLAINT_STATUSES.includes(c.status);
    const isOverdue = isOpen && !!c.dueAt && new Date(c.dueAt).getTime() < now;
    if (isOpen) open += 1;
    if (isOverdue) overdue += 1;
    return {
      title: c.title,
      category: c.category,
      status: c.status,
      overdue: isOverdue,
      unitLabel: unitLabel(c.unit),
    };
  });

  const duesList = invoices
    .map((inv) => ({
      unitLabel: unitLabel(inv.unit),
      type: inv.type,
      balance: Math.max(inv.amount - inv.paidAmount, 0),
      period: inv.period,
      status: inv.status,
    }))
    .filter((d) => d.balance > 0);

  return {
    currency,
    complaints: { total: complaints.length, open, overdue, byCategory, list: complaintList },
    dues: {
      outstanding: fin.outstanding,
      collectionRate: fin.collectionRate,
      pendingCount: duesList.length,
      list: duesList,
    },
    vendors: vendors.map((v) => ({
      name: v.name,
      trade: v.trade,
      ratingAvg: v.ratingAvg,
      jobsCompleted: v.jobsCompleted,
      totalCost: spend[String(v._id)] || 0,
    })),
    expenses: { total: fin.expenseTotal, byCategory: fin.expensesByCategory },
  };
}
