import { Types } from 'mongoose';
import type { Request } from 'express';
import User from '../models/User.js';
import { badRequest } from '../utils/HttpError.js';

/** The society the authenticated user belongs to (throws if none). */
export function requireSociety(req: Request): Types.ObjectId {
  const society = req.user?.society;
  if (!society) throw badRequest('You are not linked to a society yet.');
  return society as Types.ObjectId;
}

export const POINTS = {
  REPORT: 10,
  UPVOTE: 1,
  CONFIRM: 3,
  RESOLVED_BONUS: 15,
  RATE_VENDOR: 2,
  PAY_DUE: 5,
  POST: 3,
};

export async function awardPoints(userId: Types.ObjectId | string | undefined, amount: number, badge?: string) {
  if (!userId) return;
  const update: Record<string, unknown> = { $inc: { points: amount } };
  if (badge) update.$addToSet = { badges: badge };
  await User.findByIdAndUpdate(userId, update);
}

export function sameId(a: unknown, b: unknown): boolean {
  return String(a) === String(b);
}
