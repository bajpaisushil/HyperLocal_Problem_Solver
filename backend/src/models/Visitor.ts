import mongoose, { Schema, Types } from 'mongoose';
import {
  VISITOR_PURPOSES,
  VISITOR_STATUSES,
  type VisitorPurpose,
  type VisitorStatus,
} from '../config/constants.js';

export interface IVisitor {
  society: Types.ObjectId;
  unit?: Types.ObjectId;
  name: string;
  phone?: string;
  purpose: VisitorPurpose;
  vehicle?: string;
  status: VisitorStatus;
  expectedAt?: Date;
  inTime?: Date;
  outTime?: Date;
  createdBy?: Types.ObjectId; // resident pre-approving, or guard logging
  createdAt: Date;
  updatedAt: Date;
}

const visitorSchema = new Schema<IVisitor>(
  {
    society: { type: Schema.Types.ObjectId, ref: 'Society', required: true, index: true },
    unit: { type: Schema.Types.ObjectId, ref: 'Unit' },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    purpose: { type: String, enum: VISITOR_PURPOSES, default: 'guest' },
    vehicle: { type: String, default: '' },
    status: { type: String, enum: VISITOR_STATUSES, default: 'checked-in' },
    expectedAt: { type: Date },
    inTime: { type: Date },
    outTime: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model<IVisitor>('Visitor', visitorSchema);
