import type { Request, Response } from 'express';
import Visitor from '../models/Visitor.js';
import { requireSociety } from './_helpers.js';
import { badRequest, notFound } from '../utils/HttpError.js';

export async function listVisitors(req: Request, res: Response) {
  const society = requireSociety(req);
  const { status } = req.query as Record<string, string>;
  const filter: Record<string, unknown> = { society };
  if (status) filter.status = status;
  const visitors = await Visitor.find(filter)
    .sort({ createdAt: -1 })
    .limit(100)
    .populate('unit', 'number block');
  res.json(visitors);
}

export async function createVisitor(req: Request, res: Response) {
  const society = requireSociety(req);
  const { name, phone, purpose, vehicle, unit, expectedAt } = req.body;
  if (!name) throw badRequest('Visitor name is required');
  const preApproved = Boolean(expectedAt);
  const visitor = await Visitor.create({
    society,
    unit: unit || req.user!.primaryUnit,
    name,
    phone,
    purpose: purpose || 'guest',
    vehicle,
    status: preApproved ? 'expected' : 'checked-in',
    expectedAt: expectedAt ? new Date(expectedAt) : undefined,
    inTime: preApproved ? undefined : new Date(),
    createdBy: req.user!._id,
  });
  res.status(201).json(await visitor.populate('unit', 'number block'));
}

export async function updateVisitorStatus(req: Request, res: Response) {
  const { status } = req.body;
  const visitor = await Visitor.findById(req.params.id);
  if (!visitor) throw notFound('Visitor not found');
  if (status === 'checked-in') visitor.inTime = new Date();
  if (status === 'checked-out') visitor.outTime = new Date();
  if (['expected', 'checked-in', 'checked-out', 'denied'].includes(status)) visitor.status = status;
  await visitor.save();
  res.json(visitor);
}
