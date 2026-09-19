import { Router } from 'express';
import * as leadController from './lead.controller';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requireTenant } from '../../middlewares/tenant.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import {
  createLeadSchema,
  updateLeadSchema,
  assignLeadSchema,
  convertLeadSchema,
  bulkStatusSchema,
  listLeadsSchema,
} from './lead.schema';

const router = Router();

router.use(requireAuth);
router.use(requireTenant);

router.get('/', validateRequest(listLeadsSchema), leadController.listLeads);
router.post('/', validateRequest(createLeadSchema), leadController.createLead);
router.patch('/bulk-status', validateRequest(bulkStatusSchema), leadController.bulkUpdateStatus);
router.get('/:id', leadController.getLeadById);
router.patch('/:id', validateRequest(updateLeadSchema), leadController.updateLead);
router.delete('/:id', leadController.deleteLead);
router.post('/:id/assign', validateRequest(assignLeadSchema), leadController.assignLead);
router.post('/:id/convert', validateRequest(convertLeadSchema), leadController.convertLeadToCustomer);

export const leadRoutes = router;
