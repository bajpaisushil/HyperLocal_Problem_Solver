import { Router } from 'express';
import { listVisitors, createVisitor, updateVisitorStatus } from '../controllers/visitorController.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(protect);
router.get('/', asyncHandler(listVisitors));
router.post('/', asyncHandler(createVisitor));
router.patch('/:id/status', asyncHandler(updateVisitorStatus));
export default router;
