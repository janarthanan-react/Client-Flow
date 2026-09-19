import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { sendSuccess } from '../../utils/apiResponse';
import { emitToOrg } from '../../lib/socket';

export const listActivities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, leadId, customerId, dealId, limit = '50' } = req.query as any;

    const where: any = {
      organizationId: req.orgId,
    };

    if (type) where.type = type;
    if (leadId) where.leadId = leadId;
    if (customerId) where.customerId = customerId;
    if (dealId) where.dealId = dealId;

    const activities = await prisma.activity.findMany({
      where,
      include: {
        performedByUser: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
        lead: {
          select: { id: true, firstName: true, lastName: true, company: true },
        },
        customer: {
          select: { id: true, name: true, company: true },
        },
        deal: {
          select: { id: true, title: true, amount: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit, 10),
    });

    return sendSuccess({
      res,
      data: activities,
    });
  } catch (error) {
    next(error);
  }
};

export const createActivity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;

    const activity = await prisma.activity.create({
      data: {
        ...data,
        organizationId: req.orgId!,
        performedByUserId: req.user!.id,
      },
      include: {
        performedByUser: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
        lead: {
          select: { id: true, firstName: true, lastName: true },
        },
        customer: {
          select: { id: true, name: true },
        },
        deal: {
          select: { id: true, title: true },
        },
      },
    });

    emitToOrg(req.orgId!, 'activity.created', activity);

    return sendSuccess({
      res,
      statusCode: 201,
      message: 'Activity recorded successfully',
      data: activity,
    });
  } catch (error) {
    next(error);
  }
};
