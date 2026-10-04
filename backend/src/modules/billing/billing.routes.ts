import { Router } from 'express';
import authMiddleware from '../../middleware/auth.middleware.js';
import {
  createSettlement,
  getBillingHistory,
} from './billing.controller.js';

const router = Router();

router.post(
  '/settle',
  authMiddleware,
  createSettlement
);

router.get(
  '/history',
  authMiddleware,
  getBillingHistory
);

export default router;
