import mongoose, { Schema, Types, type HydratedDocument, type Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES, type Role } from '../config/constants.js';

export interface IUser {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: Role;
  society?: Types.ObjectId;
  units: Types.ObjectId[]; // units this user owns (multi-property owners)
  primaryUnit?: Types.ObjectId;
  points: number;
  badges: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  society?: string;
  units: string[];
  primaryUnit?: string;
  points: number;
  badges: string[];
}

interface IUserMethods {
  comparePassword(candidate: string): Promise<boolean>;
  toSafeJSON(): SafeUser;
}

export type UserDoc = HydratedDocument<IUser, IUserMethods>;
type UserModel = Model<IUser, Record<string, never>, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    phone: { type: String, trim: true },
    role: { type: String, enum: ROLES, default: 'resident' },
    society: { type: Schema.Types.ObjectId, ref: 'Society' },
    units: [{ type: Schema.Types.ObjectId, ref: 'Unit' }],
    primaryUnit: { type: Schema.Types.ObjectId, ref: 'Unit' },
    points: { type: Number, default: 0 },
    badges: [{ type: String }],
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeJSON = function toSafeJSON(): SafeUser {
  return {
    id: String(this._id),
    name: this.name,
    email: this.email,
    phone: this.phone,
    role: this.role,
    society: this.society ? String(this.society) : undefined,
    units: (this.units || []).map(String),
    primaryUnit: this.primaryUnit ? String(this.primaryUnit) : undefined,
    points: this.points,
    badges: this.badges,
  };
};

export default mongoose.model<IUser, UserModel>('User', userSchema);
