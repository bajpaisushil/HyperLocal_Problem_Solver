import { Router } from 'express';
import {
  listPosts,
  createPost,
  toggleLike,
  toggleRsvp,
  addComment,
  votePoll,
} from '../controllers/communityController.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(protect);
router.get('/', asyncHandler(listPosts));
router.post('/', asyncHandler(createPost));
router.post('/:id/like', asyncHandler(toggleLike));
router.post('/:id/rsvp', asyncHandler(toggleRsvp));
router.post('/:id/comment', asyncHandler(addComment));
router.post('/:id/vote', asyncHandler(votePoll));
export default router;
