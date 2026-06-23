import mongoose, { Schema, Types } from 'mongoose';

export interface ISociety {
  name: string;
  address: string;
  city: string;
  totalUnits: number;
  currency: string;
  defaultMaintenance: number; // monthly maintenance per unit
  approvalThreshold: number; // expenses above this need owner/committee approval
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const societySchema = new Schema<ISociety>(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    totalUnits: { type: Number, default: 0 },
    currency: { type: String, default: '₹' },
    defaultMaintenance: { type: Number, default: 2500 },
    approvalThreshold: { type: Number, default: 10000 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model<ISociety>('Society', societySchema);
