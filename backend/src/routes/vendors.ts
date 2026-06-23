import { Router } from 'express';
import { listVendors, createVendor, rateVendor, updateVendor } from '../controllers/vendorController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
const committee = restrictTo('committee', 'superadmin');

router.use(protect);
router.get('/', asyncHandler(listVendors));
router.post('/', committee, asyncHandler(createVendor));
router.post('/:id/rate', asyncHandler(rateVendor));
router.patch('/:id', committee, asyncHandler(updateVendor));
export default router;
