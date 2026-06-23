import type { Request, Response } from 'express';
import User from '../models/User.js';
import Society from '../models/Society.js';
import Unit from '../models/Unit.js';
import { signToken } from '../middleware/auth.js';
import { requireSociety } from './_helpers.js';
import { badRequest } from '../utils/HttpError.js';

export async function register(req: Request, res: Response) {
  const { name, email, password, phone, role, societyName, societyId } = req.body;
  if (!name || !email || !password) throw badRequest('name, email and password are required');

  if (await User.findOne({ email: String(email).toLowerCase() })) {
    return res.status(409).json({ message: 'Email already registered' });
  }

  const isCommittee = role === 'committee';
  let society = null;

  if (isCommittee) {
    society = await Society.create({ name: societyName || `${name}'s Society`, city: req.body.city || '' });
  } else if (societyId) {
    society = await Society.findById(societyId);
  } else {
    // Demo convenience: drop new residents into the most recent (seeded) society.
    society = await Society.findOne().sort({ createdAt: -1 });
  }

  const user = await User.create({
    name,
    email,
    password,
    phone,
    role: isCommittee ? 'committee' : 'resident',
    society: society?._id,
    badges: ['newcomer'],
  });

  if (society) {
    if (isCommittee) {
      await Society.findByIdAndUpdate(society._id, { createdBy: user._id });
    } else {
      // Attach the resident to an available unit so they have something to see.
      const unit = await Unit.findOne({ society: society._id }).sort({ number: 1 });
      if (unit) {
        user.primaryUnit = unit._id;
        user.units = [unit._id];
        await user.save();
      }
    }
  }

  res.status(201).json({ token: signToken(String(user._id)), user: user.toSafeJSON() });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) throw badRequest('email and password are required');

  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  res.json({ token: signToken(String(user._id)), user: user.toSafeJSON() });
}

export async function me(req: Request, res: Response) {
  const user = req.user!;
  const populated = await user.populate([
    { path: 'society', select: 'name city currency' },
    { path: 'primaryUnit', select: 'number block type' },
  ]);
  res.json({ user: { ...user.toSafeJSON(), societyInfo: populated.society, unitInfo: populated.primaryUnit } });
}

export async function leaderboard(req: Request, res: Response) {
  const society = requireSociety(req);
  const users = await User.find({ society }).sort({ points: -1 }).limit(10).lean();
  res.json(
    users.map((u) => ({ id: u._id, name: u.name, points: u.points, badges: u.badges, role: u.role }))
  );
}
