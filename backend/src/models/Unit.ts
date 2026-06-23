import mongoose, { Schema, Types } from 'mongoose';

export const UNIT_TYPES = ['Studio', '1BHK', '2BHK', '3BHK', '4BHK', 'Penthouse', 'Shop'] as const;
export type UnitType = (typeof UNIT_TYPES)[number];

export const OCCUPANCY = ['owner-occupied', 'rented', 'vacant'] as const;
export type Occupancy = (typeof OCCUPANCY)[number];

export interface IUnit {
  society: Types.ObjectId;
  block: string;
  number: string; // e.g. "A-101"
  type: UnitType;
  areaSqft: number;
  owner?: Types.ObjectId;
  tenant?: Types.ObjectId;
  occupancy: Occupancy;
  monthlyMaintenance: number;
  createdAt: Date;
  updatedAt: Date;
}

const unitSchema = new Schema<IUnit>(
  {
    society: { type: Schema.Types.ObjectId, ref: 'Society', required: true, index: true },
    block: { type: String, default: 'A' },
    number: { type: String, required: true },
    type: { type: String, enum: UNIT_TYPES, default: '2BHK' },
    areaSqft: { type: Number, default: 1000 },
    owner: { type: Schema.Types.ObjectId, ref: 'User' },
    tenant: { type: Schema.Types.ObjectId, ref: 'User' },
    occupancy: { type: String, enum: OCCUPANCY, default: 'owner-occupied' },
    monthlyMaintenance: { type: Number, default: 2500 },
  },
  { timestamps: true }
);

unitSchema.index({ society: 1, number: 1 }, { unique: true });

export default mongoose.model<IUnit>('Unit', unitSchema);
