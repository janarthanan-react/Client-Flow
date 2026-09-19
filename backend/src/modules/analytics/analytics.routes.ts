import { Router } from 'express';
import * as analyticsController from './analytics.controller';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requireTenant } from '../../middlewares/tenant.middleware';

const router = Router();

router.use(requireAuth);
router.use(requireTenant);

router.get('/dashboard', analyticsController.getDashboardAnalytics);
router.get('/revenue', analyticsController.getRevenueAnalytics);
router.get('/leads', analyticsController.getLeadsAnalytics);
router.get('/sources', analyticsController.getSourcesAnalytics);
router.get('/pipeline', analyticsController.getPipelineAnalytics);
router.get('/team', analyticsController.getTeamAnalytics);

export const analyticsRoutes = router;
