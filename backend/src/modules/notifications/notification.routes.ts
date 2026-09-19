import { Router } from 'express';
import * as notificationController from './notification.controller';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requireTenant } from '../../middlewares/tenant.middleware';

const router = Router();

router.use(requireAuth);
router.use(requireTenant);

router.get('/', notificationController.listNotifications);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);
router.delete('/:id', notificationController.deleteNotification);

export const notificationRoutes = router;
