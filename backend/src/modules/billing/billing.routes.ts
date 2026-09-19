import { Router, raw } from 'express';
import * as billingController from './billing.controller';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requireTenant } from '../../middlewares/tenant.middleware';
import { requireRole } from '../../middlewares/role.middleware';

const router = Router();

// Webhook endpoint (must accept raw body or JSON)
router.post('/webhook', billingController.handleWebhook);

// Protected billing routes
router.get('/', requireAuth, requireTenant, billingController.getBillingDetails);
router.post('/checkout', requireAuth, requireTenant, requireRole(['OWNER', 'ADMIN']), billingController.createCheckoutSession);
router.post('/pay', requireAuth, requireTenant, requireRole(['OWNER', 'ADMIN']), billingController.processPayment);
router.post('/portal', requireAuth, requireTenant, requireRole(['OWNER', 'ADMIN']), billingController.createPortalSession);
router.post('/verify-session', requireAuth, requireTenant, billingController.verifySession);
router.get('/config-status', requireAuth, requireTenant, billingController.getStripeConfigStatus);
router.post('/config', requireAuth, requireTenant, requireRole(['OWNER', 'ADMIN']), billingController.updateStripeConfig);

export const billingRoutes = router;
