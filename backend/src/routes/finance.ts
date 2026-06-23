import { Router } from 'express';
import {
  listInvoices,
  myDues,
  createInvoice,
  payInvoice,
  listExpenses,
  createExpense,
  getFinanceSummary,
} from '../controllers/financeController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
const committee = restrictTo('committee', 'superadmin');

router.use(protect);
router.get('/summary', asyncHandler(getFinanceSummary)); // transparency: any resident
router.get('/my-dues', asyncHandler(myDues));
router.get('/invoices', committee, asyncHandler(listInvoices));
router.post('/invoices', committee, asyncHandler(createInvoice));
router.post('/invoices/:id/pay', asyncHandler(payInvoice));
router.get('/expenses', asyncHandler(listExpenses)); // transparency: any resident
router.post('/expenses', committee, upload.single('invoiceImage'), asyncHandler(createExpense));
export default router;
