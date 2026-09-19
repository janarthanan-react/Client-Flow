import { Router } from 'express';
import * as taskController from './task.controller';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requireTenant } from '../../middlewares/tenant.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import { createTaskSchema, updateTaskSchema } from './task.schema';

const router = Router();

router.use(requireAuth);
router.use(requireTenant);

router.get('/', taskController.listTasks);
router.post('/', validateRequest(createTaskSchema), taskController.createTask);
router.get('/:id', taskController.getTaskById);
router.patch('/:id', validateRequest(updateTaskSchema), taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

export const taskRoutes = router;
