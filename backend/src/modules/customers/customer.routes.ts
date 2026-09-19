import { Router } from 'express';
import * as customerController from './customer.controller';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requireTenant } from '../../middlewares/tenant.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import {
  createCustomerSchema,
  updateCustomerSchema,
  logCustomerActivitySchema,
  listCustomersSchema,
} from './customer.schema';

const router = Router();

router.use(requireAuth);
router.use(requireTenant);

router.get('/', validateRequest(listCustomersSchema), customerController.listCustomers);
router.post('/', validateRequest(createCustomerSchema), customerController.createCustomer);
router.get('/:id', customerController.getCustomerById);
router.patch('/:id', validateRequest(updateCustomerSchema), customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);
router.post('/:id/activities', validateRequest(logCustomerActivitySchema), customerController.logCustomerActivity);

export const customerRoutes = router;
