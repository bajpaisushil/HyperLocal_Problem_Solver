import type { Request, Response } from 'express';
import Society from '../models/Society.js';
import Unit from '../models/Unit.js';
import User from '../models/User.js';
import { requireSociety } from './_helpers.js';
import { badRequest, notFound } from '../utils/HttpError.js';

export async function getMySociety(req: Request, res: Response) {
  const society = requireSociety(req);
  const [soc, units, residents] = await Promise.all([
    Society.findById(society).lean(),
    Unit.countDocuments({ society }),
    User.countDocuments({ society }),
  ]);
  if (!soc) throw notFound('Society not found');
  res.json({ ...soc, unitCount: units, residentCount: residents });
}

export async function listUnits(req: Request, res: Response) {
  const society = requireSociety(req);
  const units = await Unit.find({ society })
    .sort({ block: 1, number: 1 })
    .populate('owner', 'name phone')
    .populate('tenant', 'name phone');
  res.json(units);
}

export async function createUnit(req: Request, res: Response) {
  const society = requireSociety(req);
  const { number, block, type, areaSqft, monthlyMaintenance } = req.body;
  if (!number) throw badRequest('Unit number is required');
  const unit = await Unit.create({
    society,
    number,
    block: block || 'A',
    type: type || '2BHK',
    areaSqft: areaSqft || 1000,
    monthlyMaintenance: monthlyMaintenance || 2500,
    occupancy: 'vacant',
  });
  await Society.findByIdAndUpdate(society, { $inc: { totalUnits: 1 } });
  res.status(201).json(unit);
}

export async function listResidents(req: Request, res: Response) {
  const society = requireSociety(req);
  const residents = await User.find({ society })
    .select('name email phone role points badges primaryUnit')
    .populate('primaryUnit', 'number block')
    .sort({ name: 1 });
  res.json(residents);
}
