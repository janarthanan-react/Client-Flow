import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { sendSuccess } from '../../utils/apiResponse';
import { NotFoundError } from '../../utils/errors';

export const listNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { unreadOnly } = req.query;

    const where: any = {
      organizationId: req.orgId,
      userId: req.user!.id,
    };

    if (unreadOnly === 'true') {
      where.read = false;
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.notification.count({
        where: {
          organizationId: req.orgId,
          userId: req.user!.id,
          read: false,
        },
      }),
    ]);

    return sendSuccess({
      res,
      data: notifications,
      meta: { unreadCount },
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findFirst({
      where: { id, userId: req.user!.id, organizationId: req.orgId },
    });

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    return sendSuccess({
      res,
      message: 'Notification marked as read',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await prisma.notification.updateMany({
      where: {
        userId: req.user!.id,
        organizationId: req.orgId,
        read: false,
      },
      data: { read: true },
    });

    return sendSuccess({
      res,
      message: 'All notifications marked as read',
      data: { count: result.count },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findFirst({
      where: { id, userId: req.user!.id, organizationId: req.orgId },
    });

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    await prisma.notification.delete({
      where: { id },
    });

    return sendSuccess({
      res,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
