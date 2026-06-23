import type { Request, Response } from 'express';
import { Types, isValidObjectId } from 'mongoose';
import Complaint from '../models/Complaint.js';
import Vendor from '../models/Vendor.js';
import Expense from '../models/Expense.js';
import Unit from '../models/Unit.js';
import {
  COMPLAINT_CATEGORIES,
  computeDueAt,
  type ComplaintCategory,
} from '../config/constants.js';
import { enrichComplaint, estimateSeverity, predictInsights } from '../services/aiService.js';
import { requireSociety, awardPoints, sameId, POINTS } from './_helpers.js';
import { badRequest, notFound } from '../utils/HttpError.js';

const populateRefs = [
  { path: 'reporter', select: 'name role' },
  { path: 'unit', select: 'number block' },
  { path: 'assignedVendor', select: 'name trade phone ratingAvg' },
];

export async function createComplaint(req: Request, res: Response) {
  const society = requireSociety(req);
  const { title, description, category, unit, isCommonArea } = req.body;
  if (!title || !description) throw badRequest('title and description are required');

  const files = (req.files as Express.Multer.File[]) || [];
  const images = files.map((f) => `/uploads/${f.filename}`);

  // Duplicate detection within the same society.
  const candidates = await Complaint.find({ society }).select('title description category').limit(20).lean();
  const ai = enrichComplaint(
    { title, description },
    candidates.map((c) => ({ _id: c._id, title: c.title, description: c.description, category: c.category }))
  );
  const finalCategory: ComplaintCategory = COMPLAINT_CATEGORIES.includes(category)
    ? category
    : ai.category;
  const now = new Date();

  const complaint = await Complaint.create({
    society,
    unit: unit && isValidObjectId(unit) ? unit : req.user!.primaryUnit,
    isCommonArea: isCommonArea === true || isCommonArea === 'true',
    title,
    description,
    category: finalCategory,
    aiCategory: ai.category,
    aiConfidence: ai.confidence,
    aiSummary: ai.summary,
    severity: ai.severity,
    images,
    reporter: req.user!._id,
    dueAt: computeDueAt(now, finalCategory, ai.severity),
    duplicateOf: ai.duplicate?.complaintId as Types.ObjectId | undefined,
    statusHistory: [{ status: 'open', by: req.user!._id, note: 'Complaint logged' }],
  });

  const reportCount = await Complaint.countDocuments({ reporter: req.user!._id });
  await awardPoints(req.user!._id, POINTS.REPORT, reportCount >= 5 ? 'reporter' : undefined);

  res.status(201).json({
    complaint: await complaint.populate(populateRefs),
    duplicateWarning: ai.duplicate
      ? { ...ai.duplicate, message: 'A similar complaint may already exist.' }
      : null,
  });
}

export async function listComplaints(req: Request, res: Response) {
  const society = requireSociety(req);
  const { category, status, severity, q, overdue, sort } = req.query as Record<string, string>;
  const filter: Record<string, unknown> = { society };
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (severity) filter.severity = severity;
  if (overdue === 'true') {
    filter.dueAt = { $lt: new Date() };
    filter.status = { $in: ['open', 'assigned', 'in-progress', 'resolved-pending', 'disputed'] };
  }
  if (q) filter.$or = [
    { title: { $regex: q, $options: 'i' } },
    { description: { $regex: q, $options: 'i' } },
  ];

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    recent: { createdAt: -1 },
    oldest: { createdAt: 1 },
    upvotes: { upvotes: -1 },
    deadline: { dueAt: 1 },
  };
  const complaints = await Complaint.find(filter)
    .sort(sortMap[sort] || { createdAt: -1 })
    .limit(200)
    .populate(populateRefs);
  res.json(complaints);
}

export async function getComplaint(req: Request, res: Response) {
  if (!isValidObjectId(req.params.id)) throw badRequest('Invalid complaint id');
  const complaint = await Complaint.findById(req.params.id).populate([
    ...populateRefs,
    { path: 'statusHistory.by', select: 'name role' },
  ]);
  if (!complaint) throw notFound('Complaint not found');
  res.json(complaint);
}

export async function myComplaints(req: Request, res: Response) {
  const complaints = await Complaint.find({ reporter: req.user!._id })
    .sort({ createdAt: -1 })
    .populate(populateRefs);
  res.json(complaints);
}

export async function toggleUpvote(req: Request, res: Response) {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw notFound('Complaint not found');
  const uid = String(req.user!._id);
  const idx = complaint.upvotes.findIndex((u) => sameId(u, uid));
  if (idx >= 0) complaint.upvotes.splice(idx, 1);
  else complaint.upvotes.push(req.user!._id);
  complaint.severity = estimateSeverity({
    title: complaint.title,
    description: complaint.description,
    upvotes: complaint.upvotes.length,
  });
  await complaint.save();
  res.json({ upvoteCount: complaint.upvotes.length, upvoted: idx < 0, severity: complaint.severity });
}

/** Committee assigns a vendor → status becomes "assigned". */
export async function assignVendor(req: Request, res: Response) {
  const { vendorId } = req.body;
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw notFound('Complaint not found');
  const vendor = await Vendor.findById(vendorId);
  if (!vendor) throw notFound('Vendor not found');

  complaint.assignedVendor = vendor._id;
  if (['open'].includes(complaint.status)) complaint.status = 'assigned';
  complaint.statusHistory.push({
    status: complaint.status,
    note: `Assigned to ${vendor.name}`,
    by: req.user!._id,
    at: new Date(),
  });
  await complaint.save();
  await Vendor.findByIdAndUpdate(vendor._id, { $inc: { jobsAssigned: 1 } });
  res.json(await complaint.populate(populateRefs));
}

/** Committee advances status (assigned / in-progress / rejected). */
export async function updateStatus(req: Request, res: Response) {
  const { status, note } = req.body;
  const allowed = ['assigned', 'in-progress', 'rejected'];
  if (!allowed.includes(status)) throw badRequest(`status must be one of ${allowed.join(', ')}`);
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw notFound('Complaint not found');
  complaint.status = status;
  complaint.statusHistory.push({ status, note: note || '', by: req.user!._id, at: new Date() });
  await complaint.save();
  res.json(await complaint.populate(populateRefs));
}

/** Committee submits a fix with proof → "resolved-pending" (trust-but-verify). */
export async function submitResolution(req: Request, res: Response) {
  const society = requireSociety(req);
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw notFound('Complaint not found');

  const file = req.file as Express.Multer.File | undefined;
  if (!file) throw badRequest('A proof image of the fix is required');

  complaint.status = 'resolved-pending';
  complaint.resolutionProof = `/uploads/${file.filename}`;
  complaint.resolutionNote = req.body.note || '';
  complaint.resolutionConfirmations = [];
  complaint.resolutionDisputes = [];

  // Optionally log the repair cost as an expense.
  const cost = Number(req.body.cost);
  if (cost > 0) {
    complaint.cost = cost;
    await Expense.create({
      society,
      category: 'repairs',
      vendor: complaint.assignedVendor,
      amount: cost,
      description: `Repair: ${complaint.title}`,
      complaint: complaint._id,
      createdBy: req.user!._id,
    });
  }

  complaint.statusHistory.push({
    status: 'resolved-pending',
    note: 'Fix submitted with proof — awaiting resident confirmation',
    by: req.user!._id,
    at: new Date(),
  });
  await complaint.save();
  res.json(await complaint.populate(populateRefs));
}

async function finalizeResolution(complaintId: Types.ObjectId) {
  const complaint = await Complaint.findById(complaintId);
  if (!complaint) return;
  // Update vendor performance.
  if (complaint.assignedVendor) {
    const onTime = complaint.dueAt ? new Date() <= complaint.dueAt : true;
    await Vendor.findByIdAndUpdate(complaint.assignedVendor, {
      $inc: { jobsCompleted: 1, onTimeCompletions: onTime ? 1 : 0 },
    });
  }
}

export async function confirmResolution(req: Request, res: Response) {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw notFound('Complaint not found');
  if (complaint.status !== 'resolved-pending') throw badRequest('No pending resolution to confirm');

  const uid = String(req.user!._id);
  complaint.resolutionDisputes = complaint.resolutionDisputes.filter((u) => !sameId(u, uid));
  if (!complaint.resolutionConfirmations.some((u) => sameId(u, uid))) {
    complaint.resolutionConfirmations.push(req.user!._id);
    await awardPoints(req.user!._id, POINTS.CONFIRM);
  }
  if (complaint.resolutionConfirmations.length >= 2) {
    complaint.status = 'resolved';
    complaint.statusHistory.push({ status: 'resolved', note: 'Confirmed by residents', by: req.user!._id, at: new Date() });
    await awardPoints(complaint.reporter, POINTS.RESOLVED_BONUS, 'hero');
    await finalizeResolution(complaint._id);
  }
  await complaint.save();
  res.json({ status: complaint.status, confirmations: complaint.resolutionConfirmations.length });
}

export async function disputeResolution(req: Request, res: Response) {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw notFound('Complaint not found');
  if (complaint.status !== 'resolved-pending') throw badRequest('No pending resolution to dispute');

  const uid = String(req.user!._id);
  complaint.resolutionConfirmations = complaint.resolutionConfirmations.filter((u) => !sameId(u, uid));
  if (!complaint.resolutionDisputes.some((u) => sameId(u, uid))) {
    complaint.resolutionDisputes.push(req.user!._id);
    await awardPoints(req.user!._id, POINTS.CONFIRM);
  }
  if (complaint.resolutionDisputes.length >= 2) {
    complaint.status = 'disputed';
    complaint.resolutionProof = '';
    complaint.statusHistory.push({ status: 'disputed', note: 'Residents disputed the fix — reopened', by: req.user!._id, at: new Date() });
  }
  await complaint.save();
  res.json({ status: complaint.status, disputes: complaint.resolutionDisputes.length });
}

export async function deleteComplaint(req: Request, res: Response) {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw notFound('Complaint not found');
  const isOwner = sameId(complaint.reporter, req.user!._id);
  if (!isOwner && req.user!.role !== 'committee' && req.user!.role !== 'superadmin') {
    throw badRequest('Not allowed');
  }
  await complaint.deleteOne();
  res.json({ message: 'Complaint deleted' });
}

export async function getInsights(req: Request, res: Response) {
  const society = requireSociety(req);
  const complaints = await Complaint.find({ society })
    .populate('unit', 'block')
    .select('category status unit dueAt')
    .lean();
  const now = Date.now();
  const open = complaints.filter((c) =>
    ['open', 'assigned', 'in-progress', 'resolved-pending', 'disputed'].includes(c.status)
  );
  const overdue = open.filter((c) => c.dueAt && new Date(c.dueAt).getTime() < now);
  const insights = predictInsights(
    complaints.map((c) => ({
      category: c.category,
      status: c.status,
      block: (c.unit as { block?: string } | null)?.block,
    }))
  );
  res.json({
    ...insights,
    accountability: {
      openComplaints: open.length,
      overdueComplaints: overdue.length,
      onTimeRate: open.length ? Number((((open.length - overdue.length) / open.length) * 100).toFixed(1)) : 100,
    },
  });
}
