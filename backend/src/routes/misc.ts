import { Router } from 'express';
import { ask, suggestions } from '../controllers/assistantController.js';
import { committeeReport, predictions } from '../controllers/reportController.js';
import { getDashboard } from '../controllers/dashboardController.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const assistantRouter = Router();
assistantRouter.use(protect);
assistantRouter.post('/', asyncHandler(ask));
assistantRouter.get('/suggestions', asyncHandler(suggestions));

export const reportRouter = Router();
reportRouter.use(protect);
reportRouter.get('/', asyncHandler(committeeReport));
reportRouter.get('/predictions', asyncHandler(predictions));

export const dashboardRouter = Router();
dashboardRouter.get('/', protect, asyncHandler(getDashboard));
