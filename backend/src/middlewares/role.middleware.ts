import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../utils/errors';

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.orgRole) {
      return next(new ForbiddenError('Organization role could not be determined'));
    }

    if (!allowedRoles.includes(req.orgRole)) {
      return next(
        new ForbiddenError(
          `Insufficient permissions: Action requires one of [${allowedRoles.join(', ')}], but current role is [${req.orgRole}]`
        )
      );
    }

    next();
  };
};
