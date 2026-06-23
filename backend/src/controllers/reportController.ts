import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import Society from '../models/Society.js';
import Complaint from '../models/Complaint.js';
import { buildAssistantContext, financeSummary } from '../services/societyData.js';
import { generateCommitteeReport, predictTankerNeed } from '../services/aiService.js';
import { requireSociety } from './_helpers.js';

async function resolutionStats(society: Types.ObjectId) {
  const [resolvedAgg, openAgg] = await Promise.all([
    Complaint.aggregate<{ _id: null; count: number; avgMs: number }>([
      { $match: { society, status: 'resolved' } },
      { $unwind: '$statusHistory' },
      { $match: { 'statusHistory.status': 'resolved' } },
      { $group: { _id: '$_id', createdAt: { $first: '$createdAt' }, resolvedAt: { $min: '$statusHistory.at' } } },
      { $group: { _id: null, count: { $sum: 1 }, avgMs: { $avg: { $subtract: ['$resolvedAt', '$createdAt'] } } } },
    ]),
    Complaint.find({ society, status: { $in: ['open', 'assigned', 'in-progress', 'resolved-pending', 'disputed'] } })
      .select('dueAt')
      .lean(),
  ]);
  const now = Date.now();
  const overdue = openAgg.filter((c) => c.dueAt && new Date(c.dueAt).getTime() < now).length;
  return {
    resolvedCount: resolvedAgg[0]?.count || 0,
    avgResolutionHours: resolvedAgg[0]?.avgMs ? Number((resolvedAgg[0].avgMs / 3_600_000).toFixed(1)) : null,
    slaOnTimeRate: openAgg.length ? Number((((openAgg.length - overdue) / openAgg.length) * 100).toFixed(1)) : 100,
  };
}

/** GET /api/report — auto-generated committee report. */
export async function committeeReport(req: Request, res: Response) {
  const society = requireSociety(req);
  const soc = await Society.findById(society).lean();
  const [ctx, fin, stats] = await Promise.all([
    buildAssistantContext(society, soc?.currency || '₹'),
    financeSummary(society),
    resolutionStats(society),
  ]);

  const now = new Date();
  const period = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const report = generateCommitteeReport({
    ...ctx,
    societyName: soc?.name || 'Society',
    period,
    income: fin.income,
    resolvedCount: stats.resolvedCount,
    avgResolutionHours: stats.avgResolutionHours,
    slaOnTimeRate: stats.slaOnTimeRate,
  });
  res.json(report);
}

/** GET /api/report/predictions — predictive operations (demo with synthetic readings). */
export async function predictions(req: Request, res: Response) {
  requireSociety(req);
  // In production these come from IoT meters / manual readings. Synthetic demo series:
  const consumption = [18500, 19200, 18800, 21000, 22500, 23800, 24500];
  const tanker = predictTankerNeed(consumption);
  res.json({ water: { history: consumption, ...tanker } });
}
