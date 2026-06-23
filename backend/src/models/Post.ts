import mongoose, { Schema, Types } from 'mongoose';
import { POST_TYPES, type PostType } from '../config/constants.js';

interface Comment {
  by: Types.ObjectId;
  text: string;
  at: Date;
}

export interface IPost {
  society: Types.ObjectId;
  type: PostType;
  title: string;
  body: string;
  author: Types.ObjectId;
  pinned: boolean;
  // events
  eventDate?: Date;
  location?: string;
  rsvps: Types.ObjectId[];
  // marketplace
  price?: number;
  contact?: string;
  // engagement
  likes: Types.ObjectId[];
  comments: Comment[];
  // polls
  pollOptions: { label: string; votes: Types.ObjectId[] }[];
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<Comment>(
  {
    by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const postSchema = new Schema<IPost>(
  {
    society: { type: Schema.Types.ObjectId, ref: 'Society', required: true, index: true },
    type: { type: String, enum: POST_TYPES, default: 'announcement' },
    title: { type: String, required: true, trim: true },
    body: { type: String, default: '' },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    pinned: { type: Boolean, default: false },
    eventDate: { type: Date },
    location: { type: String, default: '' },
    rsvps: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    price: { type: Number },
    contact: { type: String, default: '' },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    comments: [commentSchema],
    pollOptions: [
      {
        _id: false,
        label: { type: String, required: true },
        votes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      },
    ],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

postSchema.virtual('likeCount').get(function (this: IPost) {
  return this.likes?.length || 0;
});

export default mongoose.model<IPost>('Post', postSchema);
