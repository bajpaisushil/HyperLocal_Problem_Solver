import mongoose, { Schema, Types } from 'mongoose';
import {
  INVOICE_TYPES,
  INVOICE_STATUSES,
  type InvoiceType,
  type InvoiceStatus,
} from '../config/constants.js';

interface PaymentEntry {
  amount: number;
  method: 'upi' | 'card' | 'netbanking' | 'cash' | 'cheque';
  reference?: string;
  at: Date;
  by?: Types.ObjectId;
}

export interface IInvoice {
  society: Types.ObjectId;
  unit: Types.ObjectId;
  type: InvoiceType;
  period: string; // "2026-06"
  amount: number;
  paidAmount: number;
  dueDate: Date;
  status: InvoiceStatus;
  payments: PaymentEntry[];
  note?: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<PaymentEntry>(
  {
    amount: { type: Number, required: true },
    method: { type: String, enum: ['upi', 'card', 'netbanking', 'cash', 'cheque'], default: 'upi' },
    reference: { type: String, default: '' },
    at: { type: Date, default: Date.now },
    by: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
);

const invoiceSchema = new Schema<IInvoice>(
  {
    society: { type: Schema.Types.ObjectId, ref: 'Society', required: true, index: true },
    unit: { type: Schema.Types.ObjectId, ref: 'Unit', required: true, index: true },
    type: { type: String, enum: INVOICE_TYPES, default: 'maintenance' },
    period: { type: String, required: true },
    amount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: INVOICE_STATUSES, default: 'pending' },
    payments: [paymentSchema],
    note: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

invoiceSchema.virtual('balance').get(function (this: IInvoice) {
  return Math.max(this.amount - this.paidAmount, 0);
});

/** Derive an invoice's status from its amounts + due date. */
export function invoiceStatusFor(inv: Pick<IInvoice, 'amount' | 'paidAmount' | 'dueDate'>): InvoiceStatus {
  if (inv.paidAmount >= inv.amount) return 'paid';
  if (inv.paidAmount > 0) return 'partial';
  if (inv.dueDate < new Date()) return 'overdue';
  return 'pending';
}

export default mongoose.model<IInvoice>('Invoice', invoiceSchema);
