import { Router } from 'express';
import { getMySociety, listUnits, createUnit, listResidents } from '../controllers/societyController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(protect);
router.get('/', asyncHandler(getMySociety));
router.get('/units', asyncHandler(listUnits));
router.post('/units', restrictTo('committee', 'superadmin'), asyncHandler(createUnit));
router.get('/residents', restrictTo('committee', 'superadmin'), asyncHandler(listResidents));
export default router;
