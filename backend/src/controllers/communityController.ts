import type { Request, Response } from 'express';
import Post from '../models/Post.js';
import { requireSociety, awardPoints, sameId, POINTS } from './_helpers.js';
import { badRequest, notFound } from '../utils/HttpError.js';

const authorPop = { path: 'author', select: 'name role' };

export async function listPosts(req: Request, res: Response) {
  const society = requireSociety(req);
  const { type } = req.query as Record<string, string>;
  const filter: Record<string, unknown> = { society };
  if (type) filter.type = type;
  const posts = await Post.find(filter).sort({ pinned: -1, createdAt: -1 }).limit(100).populate(authorPop);
  res.json(posts);
}

export async function createPost(req: Request, res: Response) {
  const society = requireSociety(req);
  const { type, title, body, eventDate, location, price, contact, pollOptions, pinned } = req.body;
  if (!title) throw badRequest('title is required');

  const post = await Post.create({
    society,
    type: type || 'announcement',
    title,
    body: body || '',
    author: req.user!._id,
    eventDate: eventDate ? new Date(eventDate) : undefined,
    location,
    price: price != null ? Number(price) : undefined,
    contact,
    // Only committee can pin.
    pinned: (pinned === true || pinned === 'true') && req.user!.role === 'committee',
    pollOptions: Array.isArray(pollOptions)
      ? pollOptions.map((label: string) => ({ label, votes: [] }))
      : [],
  });
  await awardPoints(req.user!._id, POINTS.POST);
  res.status(201).json(await post.populate(authorPop));
}

export async function toggleLike(req: Request, res: Response) {
  const post = await Post.findById(req.params.id);
  if (!post) throw notFound('Post not found');
  const uid = String(req.user!._id);
  const idx = post.likes.findIndex((u) => sameId(u, uid));
  if (idx >= 0) post.likes.splice(idx, 1);
  else post.likes.push(req.user!._id);
  await post.save();
  res.json({ likeCount: post.likes.length, liked: idx < 0 });
}

export async function toggleRsvp(req: Request, res: Response) {
  const post = await Post.findById(req.params.id);
  if (!post) throw notFound('Post not found');
  const uid = String(req.user!._id);
  const idx = post.rsvps.findIndex((u) => sameId(u, uid));
  if (idx >= 0) post.rsvps.splice(idx, 1);
  else post.rsvps.push(req.user!._id);
  await post.save();
  res.json({ rsvpCount: post.rsvps.length, going: idx < 0 });
}

export async function addComment(req: Request, res: Response) {
  const post = await Post.findById(req.params.id);
  if (!post) throw notFound('Post not found');
  if (!req.body.text) throw badRequest('text is required');
  post.comments.push({ by: req.user!._id, text: req.body.text, at: new Date() });
  await post.save();
  res.json(await post.populate([authorPop, { path: 'comments.by', select: 'name' }]));
}

export async function votePoll(req: Request, res: Response) {
  const post = await Post.findById(req.params.id);
  if (!post) throw notFound('Post not found');
  const optionIndex = Number(req.body.optionIndex);
  if (!post.pollOptions[optionIndex]) throw badRequest('Invalid poll option');
  const uid = String(req.user!._id);
  // one vote per user across options
  post.pollOptions.forEach((opt) => {
    opt.votes = opt.votes.filter((v) => !sameId(v, uid));
  });
  post.pollOptions[optionIndex].votes.push(req.user!._id);
  await post.save();
  res.json(post.pollOptions.map((o) => ({ label: o.label, votes: o.votes.length })));
}
