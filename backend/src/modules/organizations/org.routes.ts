import { Router } from 'express';
import * as orgController from './org.controller';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requireTenant } from '../../middlewares/tenant.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import {
  updateOrgSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
} from './org.schema';

const router = Router();

// All organization routes require authentication and tenant context
router.use(requireAuth);
router.use(requireTenant);

router.get('/', orgController.getCurrentOrg);
router.patch('/', requireRole(['OWNER', 'ADMIN']), validateRequest(updateOrgSchema), orgController.updateCurrentOrg);

// Members
router.get('/members', orgController.getMembers);
router.post('/members/invite', requireRole(['OWNER', 'ADMIN']), validateRequest(inviteMemberSchema), orgController.inviteMember);
router.patch('/members/:memberId/role', requireRole(['OWNER', 'ADMIN']), validateRequest(updateMemberRoleSchema), orgController.updateMemberRole);
router.delete('/members/:memberId', requireRole(['OWNER', 'ADMIN']), orgController.removeMember);

export const orgRoutes = router;
