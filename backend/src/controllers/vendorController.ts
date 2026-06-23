import type { Request, Response } from 'express';
import Vendor from '../models/Vendor.js';
import { requireSociety, awardPoints, sameId, POINTS } from './_helpers.js';
import { badRequest, notFound } from '../utils/HttpError.js';

export async function listVendors(req: Request, res: Response) {
  const society = requireSociety(req);
  const { trade } = req.query as Record<string, string>;
  const filter: Record<string, unknown> = { $or: [{ society }, { society: null }], active: true };
  if (trade) filter.trade = trade;
  const vendors = await Vendor.find(filter).sort({ ratingAvg: -1, jobsCompleted: -1 });
  res.json(vendors);
}

export async function createVendor(req: Request, res: Response) {
  const society = requireSociety(req);
  const { name, trade, phone, email, verified } = req.body;
  if (!name) throw badRequest('Vendor name is required');
  const vendor = await Vendor.create({
    society,
    name,
    trade: trade || 'other',
    phone,
    email,
    verified: verified === true || verified === 'true',
  });
  res.status(201).json(vendor);
}

export async function rateVendor(req: Request, res: Response) {
  const { stars, comment, complaintId } = req.body;
  const n = Number(stars);
  if (!(n >= 1 && n <= 5)) throw badRequest('stars must be between 1 and 5');

  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) throw notFound('Vendor not found');

  const uid = String(req.user!._id);
  vendor.ratings = vendor.ratings.filter((r) => !sameId(r.by, uid)); // one rating per user
  vendor.ratings.push({ by: req.user!._id, stars: n, comment: comment || '', complaint: complaintId, at: new Date() });
  vendor.ratingCount = vendor.ratings.length;
  vendor.ratingAvg = Number((vendor.ratings.reduce((s, r) => s + r.stars, 0) / vendor.ratings.length).toFixed(2));
  await vendor.save();
  await awardPoints(req.user!._id, POINTS.RATE_VENDOR);
  res.json(vendor);
}

export async function updateVendor(req: Request, res: Response) {
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) throw notFound('Vendor not found');
  const { verified, active, phone, email, trade } = req.body;
  if (verified !== undefined) vendor.verified = verified === true || verified === 'true';
  if (active !== undefined) vendor.active = active === true || active === 'true';
  if (phone !== undefined) vendor.phone = phone;
  if (email !== undefined) vendor.email = email;
  if (trade !== undefined) vendor.trade = trade;
  await vendor.save();
  res.json(vendor);
}
