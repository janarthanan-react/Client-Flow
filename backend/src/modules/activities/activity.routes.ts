import { Router } from 'express';
import * as activityController from './activity.controller';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requireTenant } from '../../middlewares/tenant.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import { createActivitySchema } from './activity.schema';

const router = Router();

router.use(requireAuth);
router.use(requireTenant);

router.get('/', activityController.listActivities);
router.post('/', validateRequest(createActivitySchema), activityController.createActivity);

export const activityRoutes = router;
