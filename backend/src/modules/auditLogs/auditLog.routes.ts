import { Router } from 'express';
import * as auditLogController from './auditLog.controller';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requireTenant } from '../../middlewares/tenant.middleware';
import { requireRole } from '../../middlewares/role.middleware';

const router = Router();

router.use(requireAuth);
router.use(requireTenant);
router.use(requireRole(['OWNER', 'ADMIN']));

router.get('/', auditLogController.listAuditLogs);

export const auditLogRoutes = router;
