import type { Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import Invoice, { invoiceStatusFor } from '../models/Invoice.js';
import Expense from '../models/Expense.js';
import Unit from '../models/Unit.js';
import { financeSummary } from '../services/societyData.js';
import { extractInvoice } from '../services/aiService.js';
import { requireSociety, awardPoints, POINTS } from './_helpers.js';
import { badRequest, notFound } from '../utils/HttpError.js';

const invoicePopulate = { path: 'unit', select: 'number block' };

/** Committee: list all invoices (optionally filter by status/unit). */
export async function listInvoices(req: Request, res: Response) {
  const society = requireSociety(req);
  const { status, unit } = req.query as Record<string, string>;
  const filter: Record<string, unknown> = { society };
  if (status) filter.status = status;
  if (unit && isValidObjectId(unit)) filter.unit = unit;
  const invoices = await Invoice.find(filter).sort({ dueDate: 1 }).populate(invoicePopulate);
  res.json(invoices);
}

/** Resident: my dues (invoices for my unit(s)). */
export async function myDues(req: Request, res: Response) {
  const unitIds = [req.user!.primaryUnit, ...(req.user!.units || [])].filter(Boolean);
  const invoices = await Invoice.find({ unit: { $in: unitIds } })
    .sort({ dueDate: 1 })
    .populate(invoicePopulate);
  res.json(invoices);
}

export async function createInvoice(req: Request, res: Response) {
  const society = requireSociety(req);
  const { unit, type, period, amount, dueDate, note, all } = req.body;

  // Bulk-create for every unit (e.g. monthly maintenance run).
  if (all === true || all === 'true') {
    const units = await Unit.find({ society });
    const docs = units.map((u) => ({
      society,
      unit: u._id,
      type: type || 'maintenance',
      period,
      amount: Number(amount) || u.monthlyMaintenance,
      dueDate: new Date(dueDate),
      status: invoiceStatusFor({ amount: Number(amount) || u.monthlyMaintenance, paidAmount: 0, dueDate: new Date(dueDate) }),
      note,
      createdBy: req.user!._id,
    }));
    const created = await Invoice.insertMany(docs);
    return res.status(201).json({ created: created.length });
  }

  if (!unit || !amount || !dueDate || !period) throw badRequest('unit, period, amount and dueDate are required');
  const invoice = await Invoice.create({
    society,
    unit,
    type: type || 'maintenance',
    period,
    amount: Number(amount),
    dueDate: new Date(dueDate),
    status: invoiceStatusFor({ amount: Number(amount), paidAmount: 0, dueDate: new Date(dueDate) }),
    note,
    createdBy: req.user!._id,
  });
  res.status(201).json(await invoice.populate(invoicePopulate));
}

/** Pay (or part-pay) an invoice. Payment gateway is stubbed. */
export async function payInvoice(req: Request, res: Response) {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) throw notFound('Invoice not found');

  const amount = Number(req.body.amount) || invoice.amount - invoice.paidAmount;
  if (amount <= 0) throw badRequest('Nothing to pay');
  invoice.paidAmount = Math.min(invoice.paidAmount + amount, invoice.amount);
  invoice.payments.push({
    amount,
    method: req.body.method || 'upi',
    reference: req.body.reference || `STUB-${Date.now()}`,
    at: new Date(),
    by: req.user!._id,
  });
  invoice.status = invoiceStatusFor(invoice);
  await invoice.save();
  await awardPoints(req.user!._id, POINTS.PAY_DUE);
  res.json(await invoice.populate(invoicePopulate));
}

// ── Expenses ───────────────────────────────────────────
export async function listExpenses(req: Request, res: Response) {
  const society = requireSociety(req);
  const expenses = await Expense.find({ society })
    .sort({ date: -1 })
    .populate('vendor', 'name trade')
    .limit(200);
  res.json(expenses);
}

export async function createExpense(req: Request, res: Response) {
  const society = requireSociety(req);
  const { category, vendor, amount, date, description } = req.body;
  if (!amount) throw badRequest('amount is required');

  const file = req.file as Express.Multer.File | undefined;
  let ocr: ReturnType<typeof extractInvoice> | null = null;
  if (file) ocr = extractInvoice(file.originalname);

  const expense = await Expense.create({
    society,
    category: category || 'other',
    vendor: vendor && isValidObjectId(vendor) ? vendor : undefined,
    amount: Number(amount),
    date: date ? new Date(date) : new Date(),
    description: description || '',
    invoiceImage: file ? `/uploads/${file.filename}` : '',
    ocrText: ocr?.ocrText,
    ocrAmount: ocr?.ocrAmount,
    ocrVendor: ocr?.ocrVendor,
    createdBy: req.user!._id,
  });
  res.status(201).json({ expense, ocr });
}

/** Balance sheet / spending dashboard data. */
export async function getFinanceSummary(req: Request, res: Response) {
  const society = requireSociety(req);
  const summary = await financeSummary(society);

  // 6-month income vs expense trend.
  const since = new Date();
  since.setMonth(since.getMonth() - 5, 1);
  const [incomeTrend, expenseTrend] = await Promise.all([
    Invoice.aggregate([
      { $match: { society, 'payments.at': { $gte: since } } },
      { $unwind: '$payments' },
      { $match: { 'payments.at': { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$payments.at' } }, total: { $sum: '$payments.amount' } } },
    ]),
    Expense.aggregate([
      { $match: { society, date: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$date' } }, total: { $sum: '$amount' } } },
    ]),
  ]);

  const incomeMap = Object.fromEntries(incomeTrend.map((r) => [r._id, r.total]));
  const expenseMap = Object.fromEntries(expenseTrend.map((r) => [r._id, r.total]));
  const months: { month: string; income: number; expense: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    months.push({ month: key, income: incomeMap[key] || 0, expense: expenseMap[key] || 0 });
  }

  res.json({ ...summary, trend: months });
}
