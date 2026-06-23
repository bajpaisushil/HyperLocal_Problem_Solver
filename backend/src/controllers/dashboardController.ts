import type { Request, Response } from 'express';
import Complaint from '../models/Complaint.js';
import Unit from '../models/Unit.js';
import User from '../models/User.js';
import Visitor from '../models/Visitor.js';
import { financeSummary } from '../services/societyData.js';
import { requireSociety } from './_helpers.js';
import { OPEN_COMPLAINT_STATUSES } from '../config/constants.js';

/** GET /api/dashboard — society operations overview. */
export async function getDashboard(req: Request, res: Response) {
  const society = requireSociety(req);
  const openList = OPEN_COMPLAINT_STATUSES;

  const [byStatus, byCategory, totalComplaints, overdue, fin, units, residents, visitorsToday, recent] =
    await Promise.all([
      Complaint.aggregate([{ $match: { society } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Complaint.aggregate([{ $match: { society } }, { $group: { _id: '$category', count: { $sum: 1 } } }]),
      Complaint.countDocuments({ society }),
      Complaint.countDocuments({ society, status: { $in: openList }, dueAt: { $lt: new Date() } }),
      financeSummary(society),
      Unit.countDocuments({ society }),
      User.countDocuments({ society }),
      Visitor.countDocuments({ society, inTime: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
      Complaint.find({ society })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title category status severity createdAt')
        .lean(),
    ]);

  const statusCounts = Object.fromEntries(byStatus.map((s) => [s._id, s.count]));
  const open = openList.reduce((sum, s) => sum + (statusCounts[s] || 0), 0);
  const resolved = statusCounts.resolved || 0;

  res.json({
    totals: {
      complaints: totalComplaints,
      open,
      resolved,
      overdue,
      slaOnTimeRate: open ? Number((((open - overdue) / open) * 100).toFixed(1)) : 100,
      units,
      residents,
      visitorsToday,
    },
    finance: {
      income: fin.income,
      expenses: fin.expenseTotal,
      net: fin.net,
      outstanding: fin.outstanding,
      collectionRate: fin.collectionRate,
    },
    byStatus: statusCounts,
    byCategory: Object.fromEntries(byCategory.map((c) => [c._id, c.count])),
    recent,
  });
}
