import { Router } from 'express';
import * as userController from './user.controller';
import { requireAuth } from '../../middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);
router.patch('/profile', userController.updateProfile);

export const userRoutes = router;
