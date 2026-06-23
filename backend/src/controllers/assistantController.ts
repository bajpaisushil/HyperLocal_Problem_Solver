import type { Request, Response } from 'express';
import Society from '../models/Society.js';
import { buildAssistantContext } from '../services/societyData.js';
import { runAssistant } from '../services/aiService.js';
import { requireSociety } from './_helpers.js';
import { badRequest } from '../utils/HttpError.js';

/** POST /api/assistant — natural-language Q&A over the society's data. */
export async function ask(req: Request, res: Response) {
  const society = requireSociety(req);
  const query = String(req.body.query || '').trim();
  if (!query) throw badRequest('query is required');

  const soc = await Society.findById(society).lean();
  const ctx = await buildAssistantContext(society, soc?.currency || '₹');
  const result = runAssistant(query, ctx);
  res.json(result);
}

/** A few suggested prompts for the UI. */
export function suggestions(_req: Request, res: Response) {
  res.json([
    'Show pending dues over 5000',
    'Which vendors cost us the most?',
    'List overdue complaints',
    'Open complaints by category',
    'Top rated vendors',
    "Summarize this month",
  ]);
}
