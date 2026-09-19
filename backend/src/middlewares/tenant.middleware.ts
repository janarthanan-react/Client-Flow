import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { ForbiddenError, NotFoundError, UnauthorizedError } from '../utils/errors';

export const requireTenant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('User authentication required before tenant verification');
    }

    const requestedOrgId = (req.headers['x-organization-id'] as string) || (req.query.orgId as string);

    // Find the membership
    let membership;

    if (requestedOrgId) {
      membership = await prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: req.user.id,
            organizationId: requestedOrgId,
          },
        },
        include: {
          organization: true,
        },
      });

      if (!membership) {
        throw new ForbiddenError('Access denied: You do not have permission to access this organization');
      }
    } else {
      // Default to the first organization the user is a member of
      membership = await prisma.organizationMember.findFirst({
        where: { userId: req.user.id },
        include: {
          organization: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      if (!membership) {
        throw new NotFoundError('No active organization found for this user. Please create or join an organization.');
      }
    }

    req.orgId = membership.organizationId;
    req.orgRole = membership.role;

    next();
  } catch (error) {
    next(error);
  }
};
