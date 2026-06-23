import mongoose, { Schema, Types } from 'mongoose';
import { COMPLAINT_CATEGORIES, type ComplaintCategory } from '../config/constants.js';

interface VendorRating {
  by: Types.ObjectId;
  stars: number;
  comment?: string;
  complaint?: Types.ObjectId;
  at: Date;
}

export interface IVendor {
  society?: Types.ObjectId; // null = available to all societies
  name: string;
  trade: ComplaintCategory;
  phone?: string;
  email?: string;
  verified: boolean;
  active: boolean;
  ratings: VendorRating[];
  ratingAvg: number;
  ratingCount: number;
  jobsAssigned: number;
  jobsCompleted: number;
  onTimeCompletions: number;
  createdAt: Date;
  updatedAt: Date;
}

const ratingSchema = new Schema<VendorRating>(
  {
    by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    stars: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, default: '' },
    complaint: { type: Schema.Types.ObjectId, ref: 'Complaint' },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const vendorSchema = new Schema<IVendor>(
  {
    society: { type: Schema.Types.ObjectId, ref: 'Society', index: true },
    name: { type: String, required: true, trim: true },
    trade: { type: String, enum: COMPLAINT_CATEGORIES, default: 'other' },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    verified: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    ratings: [ratingSchema],
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    jobsAssigned: { type: Number, default: 0 },
    jobsCompleted: { type: Number, default: 0 },
    onTimeCompletions: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

vendorSchema.virtual('slaScore').get(function (this: IVendor) {
  return this.jobsCompleted ? Math.round((this.onTimeCompletions / this.jobsCompleted) * 100) : null;
});

export default mongoose.model<IVendor>('Vendor', vendorSchema);
