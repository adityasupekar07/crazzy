import { Router } from 'express';
import authMiddleware from '../../../middleware/auth.middleware.js';
import { validate } from '../../../middleware/validate.middleware.js';
import {
  billingPreviewSchema,
  createSettlementSchema,
} from '../validators/billing.schema.js';
import {
  getSupportedCycles,
  getCurrentBillingCycle,
  getBillingFarmers,
  getFarmerHistory,
  previewSettlement,
  createSettlement,
  getBillingHistory,
} from '../controllers/billing.controller.js';

const router = Router();

router.get('/cycles', authMiddleware, getSupportedCycles);
router.get('/cycle', authMiddleware, getCurrentBillingCycle);
router.get('/farmers', authMiddleware, getBillingFarmers);
router.get('/farmers/:farmerId/history', authMiddleware, getFarmerHistory);

router.post(
  '/preview',
  authMiddleware,
  validate({ body: billingPreviewSchema }),
  previewSettlement
);

router.post(
  '/settle',
  authMiddleware,
  validate({ body: createSettlementSchema }),
  createSettlement
);

router.get('/history', authMiddleware, getBillingHistory);

export default router;

