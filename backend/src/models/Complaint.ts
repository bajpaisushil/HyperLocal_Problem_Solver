import mongoose, { Schema, Types } from 'mongoose';
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_STATUSES,
  OPEN_COMPLAINT_STATUSES,
  SEVERITIES,
  type ComplaintCategory,
  type ComplaintStatus,
  type Severity,
} from '../config/constants.js';

interface StatusEvent {
  status: ComplaintStatus;
  note?: string;
  by?: Types.ObjectId;
  at: Date;
}

export interface IComplaint {
  society: Types.ObjectId;
  unit?: Types.ObjectId; // null for common-area issues
  title: string;
  description: string;
  category: ComplaintCategory;
  aiCategory?: ComplaintCategory;
  aiConfidence?: number;
  aiSummary?: string;
  severity: Severity;
  status: ComplaintStatus;
  statusHistory: StatusEvent[];
  dueAt?: Date;
  assignedVendor?: Types.ObjectId;
  images: string[];
  reporter: Types.ObjectId;
  isCommonArea: boolean;
  upvotes: Types.ObjectId[];
  resolutionProof?: string;
  resolutionNote?: string;
  resolutionConfirmations: Types.ObjectId[];
  resolutionDisputes: Types.ObjectId[];
  cost?: number; // expense incurred to fix
  duplicateOf?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const statusEventSchema = new Schema<StatusEvent>(
  {
    status: { type: String, enum: COMPLAINT_STATUSES, required: true },
    note: { type: String, default: '' },
    by: { type: Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const complaintSchema = new Schema<IComplaint>(
  {
    society: { type: Schema.Types.ObjectId, ref: 'Society', required: true, index: true },
    unit: { type: Schema.Types.ObjectId, ref: 'Unit' },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, enum: COMPLAINT_CATEGORIES, default: 'other' },
    aiCategory: { type: String, enum: COMPLAINT_CATEGORIES },
    aiConfidence: { type: Number, min: 0, max: 1 },
    aiSummary: { type: String, default: '' },
    severity: { type: String, enum: SEVERITIES, default: 'medium' },
    status: { type: String, enum: COMPLAINT_STATUSES, default: 'open' },
    statusHistory: [statusEventSchema],
    dueAt: { type: Date },
    assignedVendor: { type: Schema.Types.ObjectId, ref: 'Vendor' },
    images: [{ type: String }],
    reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isCommonArea: { type: Boolean, default: false },
    upvotes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    resolutionProof: { type: String, default: '' },
    resolutionNote: { type: String, default: '' },
    resolutionConfirmations: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    resolutionDisputes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    cost: { type: Number },
    duplicateOf: { type: Schema.Types.ObjectId, ref: 'Complaint' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

complaintSchema.index({ society: 1, status: 1, category: 1 });

complaintSchema.virtual('upvoteCount').get(function (this: IComplaint) {
  return this.upvotes?.length || 0;
});
complaintSchema.virtual('isOpen').get(function (this: IComplaint) {
  return OPEN_COMPLAINT_STATUSES.includes(this.status);
});
complaintSchema.virtual('isOverdue').get(function (this: IComplaint) {
  return Boolean(this.dueAt) && OPEN_COMPLAINT_STATUSES.includes(this.status) && this.dueAt! < new Date();
});
complaintSchema.virtual('hoursToDeadline').get(function (this: IComplaint) {
  if (!this.dueAt) return null;
  return Number(((this.dueAt.getTime() - Date.now()) / 3_600_000).toFixed(1));
});

export default mongoose.model<IComplaint>('Complaint', complaintSchema);
