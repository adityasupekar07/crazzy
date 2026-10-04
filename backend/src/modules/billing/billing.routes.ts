import { Router } from 'express';
import authMiddleware from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { createSettlementSchema } from './billing.schema.js';
import {
  createSettlement,
  getBillingHistory,
} from './billing.controller.js';

const router = Router();

router.post(
  '/settle',
  authMiddleware,
  validate({
    body: createSettlementSchema,
  }),
  createSettlement
);

router.get(
  '/history',
  authMiddleware,
  getBillingHistory
);

export default router;
