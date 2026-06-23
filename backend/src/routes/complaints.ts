import { Router } from 'express';
import {
  createComplaint,
  listComplaints,
  getComplaint,
  myComplaints,
  toggleUpvote,
  assignVendor,
  updateStatus,
  submitResolution,
  confirmResolution,
  disputeResolution,
  deleteComplaint,
  getInsights,
} from '../controllers/complaintController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
const committee = restrictTo('committee', 'superadmin');

router.use(protect);
router.get('/insights', asyncHandler(getInsights));
router.get('/mine', asyncHandler(myComplaints));
router.get('/', asyncHandler(listComplaints));
router.post('/', upload.array('images', 5), asyncHandler(createComplaint));
router.get('/:id', asyncHandler(getComplaint));
router.delete('/:id', asyncHandler(deleteComplaint));
router.post('/:id/upvote', asyncHandler(toggleUpvote));
router.post('/:id/confirm-resolution', asyncHandler(confirmResolution));
router.post('/:id/dispute-resolution', asyncHandler(disputeResolution));
router.post('/:id/assign-vendor', committee, asyncHandler(assignVendor));
router.patch('/:id/status', committee, asyncHandler(updateStatus));
router.post('/:id/resolve', committee, upload.single('proof'), asyncHandler(submitResolution));
export default router;
