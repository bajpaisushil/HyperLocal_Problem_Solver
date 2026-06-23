import mongoose, { Schema, Types } from 'mongoose';
import { EXPENSE_CATEGORIES, type ExpenseCategory } from '../config/constants.js';

export interface IExpense {
  society: Types.ObjectId;
  category: ExpenseCategory;
  vendor?: Types.ObjectId;
  amount: number;
  date: Date;
  description: string;
  invoiceImage?: string;
  // Invoice OCR (stubbed — populated by aiService.extractInvoice)
  ocrText?: string;
  ocrAmount?: number;
  ocrVendor?: string;
  complaint?: Types.ObjectId;
  status: 'pending' | 'approved' | 'paid';
  approvedBy?: Types.ObjectId;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>(
  {
    society: { type: Schema.Types.ObjectId, ref: 'Society', required: true, index: true },
    category: { type: String, enum: EXPENSE_CATEGORIES, default: 'other' },
    vendor: { type: Schema.Types.ObjectId, ref: 'Vendor' },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    description: { type: String, default: '' },
    invoiceImage: { type: String, default: '' },
    ocrText: { type: String, default: '' },
    ocrAmount: { type: Number },
    ocrVendor: { type: String, default: '' },
    complaint: { type: Schema.Types.ObjectId, ref: 'Complaint' },
    status: { type: String, enum: ['pending', 'approved', 'paid'], default: 'approved' },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model<IExpense>('Expense', expenseSchema);
