import { Router } from 'express';
import { register, login, me, leaderboard } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.get('/me', protect, asyncHandler(me));
router.get('/leaderboard', protect, asyncHandler(leaderboard));
export default router;
