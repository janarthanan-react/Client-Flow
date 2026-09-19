import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { sendSuccess } from '../../utils/apiResponse';
import { NotFoundError } from '../../utils/errors';
import { createAuditLog } from '../../middlewares/audit.middleware';
import { emitToOrg } from '../../lib/socket';

export const listCustomers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const skip = (page - 1) * limit;

    const {
      search,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query as any;

    const where: any = {
      organizationId: req.orgId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { company: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          _count: {
            select: { deals: true, tasks: true, activities: true },
          },
          deals: {
            select: { amount: true, stage: true },
          },
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.customer.count({ where }),
    ]);

    // Calculate total deal value per customer
    const formattedCustomers = customers.map((c) => {
      const totalRevenue = c.deals.reduce((acc, d) => acc + (d.stage === 'CLOSED_WON' ? d.amount : 0), 0);
      const totalPipeline = c.deals.reduce((acc, d) => acc + (d.stage !== 'CLOSED_LOST' ? d.amount : 0), 0);
      return {
        ...c,
        totalRevenue,
        totalPipeline,
      };
    });

    return sendSuccess({
      res,
      data: formattedCustomers,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findFirst({
      where: { id, organizationId: req.orgId },
      include: {
        convertedFromLead: {
          select: { id: true, firstName: true, lastName: true, source: true },
        },
        deals: {
          include: {
            assignedToUser: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        tasks: {
          include: {
            assignedToUser: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { dueDate: 'asc' },
        },
        activities: {
          include: {
            performedByUser: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    return sendSuccess({
      res,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

export const createCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;

    const customer = await prisma.customer.create({
      data: {
        ...data,
        organizationId: req.orgId!,
      },
    });

    // Record initial activity
    await prisma.activity.create({
      data: {
        organizationId: req.orgId!,
        performedByUserId: req.user!.id,
        customerId: customer.id,
        type: 'NOTE',
        title: 'Customer Added',
        description: `Customer ${customer.name} created in workspace.`,
      },
    });

    await createAuditLog({
      req,
      organizationId: req.orgId!,
      action: 'CREATE_CUSTOMER',
      entity: 'CUSTOMER',
      entityId: customer.id,
      details: { name: customer.name, email: customer.email },
    });

    emitToOrg(req.orgId!, 'customer.created', customer);

    return sendSuccess({
      res,
      statusCode: 201,
      message: 'Customer created successfully',
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const existing = await prisma.customer.findFirst({
      where: { id, organizationId: req.orgId },
    });

    if (!existing) {
      throw new NotFoundError('Customer not found');
    }

    const updated = await prisma.customer.update({
      where: { id },
      data,
    });

    await createAuditLog({
      req,
      organizationId: req.orgId!,
      action: 'UPDATE_CUSTOMER',
      entity: 'CUSTOMER',
      entityId: id,
      details: data,
    });

    emitToOrg(req.orgId!, 'customer.updated', updated);

    return sendSuccess({
      res,
      message: 'Customer updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const existing = await prisma.customer.findFirst({
      where: { id, organizationId: req.orgId },
    });

    if (!existing) {
      throw new NotFoundError('Customer not found');
    }

    await prisma.customer.delete({
      where: { id },
    });

    await createAuditLog({
      req,
      organizationId: req.orgId!,
      action: 'DELETE_CUSTOMER',
      entity: 'CUSTOMER',
      entityId: id,
      details: { name: existing.name },
    });

    emitToOrg(req.orgId!, 'customer.deleted', { id });

    return sendSuccess({
      res,
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const logCustomerActivity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { type, title, description } = req.body;

    const customer = await prisma.customer.findFirst({
      where: { id, organizationId: req.orgId },
    });

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    const activity = await prisma.activity.create({
      data: {
        organizationId: req.orgId!,
        performedByUserId: req.user!.id,
        customerId: id,
        type,
        title,
        description,
      },
      include: {
        performedByUser: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    emitToOrg(req.orgId!, 'activity.created', activity);

    return sendSuccess({
      res,
      statusCode: 201,
      message: 'Activity logged successfully',
      data: activity,
    });
  } catch (error) {
    next(error);
  }
};
