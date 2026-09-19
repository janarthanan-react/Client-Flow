import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { sendSuccess } from '../../utils/apiResponse';
import { NotFoundError } from '../../utils/errors';
import { createAuditLog } from '../../middlewares/audit.middleware';
import { emitToOrg, emitToUser } from '../../lib/socket';
import { enqueueNotification } from '../../queues/notification.queue';

export const listTasks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, priority, assignedToUserId, leadId, customerId } = req.query as any;

    const where: any = {
      organizationId: req.orgId,
    };

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (assignedToUserId) {
      where.assignedToUserId = assignedToUserId === 'unassigned' ? null : assignedToUserId;
    }

    if (leadId) {
      where.leadId = leadId;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignedToUser: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
        lead: {
          select: { id: true, firstName: true, lastName: true, company: true },
        },
        customer: {
          select: { id: true, name: true, company: true },
        },
      },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { priority: 'desc' }],
    });

    const summary = {
      total: tasks.length,
      todo: tasks.filter((t) => t.status === 'TODO').length,
      inProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
      completed: tasks.filter((t) => t.status === 'COMPLETED').length,
    };

    return sendSuccess({
      res,
      data: tasks,
      meta: { summary },
    });
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findFirst({
      where: { id, organizationId: req.orgId },
      include: {
        assignedToUser: true,
        lead: true,
        customer: true,
      },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    return sendSuccess({
      res,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;

    const task = await prisma.task.create({
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        organizationId: req.orgId!,
      },
      include: {
        assignedToUser: { select: { id: true, firstName: true, lastName: true } },
        lead: { select: { id: true, firstName: true, lastName: true } },
        customer: { select: { id: true, name: true } },
      },
    });

    await createAuditLog({
      req,
      organizationId: req.orgId!,
      action: 'CREATE_TASK',
      entity: 'TASK',
      entityId: task.id,
      details: { title: task.title, priority: task.priority },
    });

    emitToOrg(req.orgId!, 'task.created', task);

    if (task.assignedToUserId) {
      emitToUser(task.assignedToUserId, 'task.assigned', task);
      enqueueNotification({
        organizationId: req.orgId!,
        userId: task.assignedToUserId,
        type: 'TASK_ASSIGNED',
        title: 'New Task Assigned',
        message: `Task: "${task.title}" has been assigned to you.`,
        link: '/tasks',
      });
    }

    return sendSuccess({
      res,
      statusCode: 201,
      message: 'Task created successfully',
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const existing = await prisma.task.findFirst({
      where: { id, organizationId: req.orgId },
    });

    if (!existing) {
      throw new NotFoundError('Task not found');
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
      include: {
        assignedToUser: { select: { id: true, firstName: true, lastName: true } },
        lead: { select: { id: true, firstName: true, lastName: true } },
        customer: { select: { id: true, name: true } },
      },
    });

    await createAuditLog({
      req,
      organizationId: req.orgId!,
      action: 'UPDATE_TASK',
      entity: 'TASK',
      entityId: id,
      details: data,
    });

    emitToOrg(req.orgId!, 'task.updated', updated);

    return sendSuccess({
      res,
      message: 'Task updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const existing = await prisma.task.findFirst({
      where: { id, organizationId: req.orgId },
    });

    if (!existing) {
      throw new NotFoundError('Task not found');
    }

    await prisma.task.delete({
      where: { id },
    });

    await createAuditLog({
      req,
      organizationId: req.orgId!,
      action: 'DELETE_TASK',
      entity: 'TASK',
      entityId: id,
      details: { title: existing.title },
    });

    emitToOrg(req.orgId!, 'task.deleted', { id });

    return sendSuccess({
      res,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
