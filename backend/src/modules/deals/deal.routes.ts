import { Router } from 'express';
import * as dealController from './deal.controller';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requireTenant } from '../../middlewares/tenant.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import {
  createDealSchema,
  updateDealSchema,
  updateDealStageSchema,
} from './deal.schema';

const router = Router();

router.use(requireAuth);
router.use(requireTenant);

router.get('/', dealController.listDeals);
router.post('/', validateRequest(createDealSchema), dealController.createDeal);
router.get('/:id', dealController.getDealById);
router.patch('/:id', validateRequest(updateDealSchema), dealController.updateDeal);
router.patch('/:id/stage', validateRequest(updateDealStageSchema), dealController.updateDealStage);
router.delete('/:id', dealController.deleteDeal);

export const dealRoutes = router;
