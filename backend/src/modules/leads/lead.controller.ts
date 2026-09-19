import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { sendSuccess } from '../../utils/apiResponse';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import { createAuditLog } from '../../middlewares/audit.middleware';
import { emitToOrg, emitToUser } from '../../lib/socket';
import { enqueueNotification } from '../../queues/notification.queue';
import { enqueueEmail } from '../../queues/email.queue';
import { emailTemplates } from '../../lib/email';
import { config } from '../../config';

export const listLeads = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const skip = (page - 1) * limit;

    const {
      search,
      status,
      source,
      assignedToUserId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      startDate,
      endDate,
    } = req.query as any;

    const where: any = {
      organizationId: req.orgId,
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { company: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (source) {
      where.source = source;
    }

    if (assignedToUserId) {
      where.assignedToUserId = assignedToUserId === 'unassigned' ? null : assignedToUserId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          assignedToUser: {
            select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
          },
          _count: {
            select: { tasks: true, activities: true },
          },
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.lead.count({ where }),
    ]);

    return sendSuccess({
      res,
      data: leads,
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

export const getLeadById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const lead = await prisma.lead.findFirst({
      where: { id, organizationId: req.orgId },
      include: {
        assignedToUser: {
          select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
        },
        convertedCustomer: {
          select: { id: true, name: true, email: true },
        },
        tasks: {
          include: {
            assignedToUser: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        activities: {
          include: {
            performedByUser: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!lead) {
      throw new NotFoundError('Lead not found');
    }

    return sendSuccess({
      res,
      data: lead,
    });
  } catch (error) {
    next(error);
  }
};

export const createLead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;

    const lead = await prisma.lead.create({
      data: {
        ...data,
        organizationId: req.orgId!,
      },
      include: {
        assignedToUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    // Record activity
    await prisma.activity.create({
      data: {
        organizationId: req.orgId!,
        performedByUserId: req.user!.id,
        leadId: lead.id,
        type: 'STATUS_CHANGE',
        title: 'Lead Created',
        description: `Lead created with status: ${lead.status}`,
      },
    });

    // Audit log
    await createAuditLog({
      req,
      organizationId: req.orgId!,
      action: 'CREATE_LEAD',
      entity: 'LEAD',
      entityId: lead.id,
      details: { leadName: `${lead.firstName} ${lead.lastName}`, company: lead.company },
    });

    // Emit socket event
    emitToOrg(req.orgId!, 'lead.created', lead);

    // Notify assignee if assigned
    if (lead.assignedToUserId && lead.assignedToUser) {
      emitToUser(lead.assignedToUserId, 'lead.assigned', lead);
      enqueueNotification({
        organizationId: req.orgId!,
        userId: lead.assignedToUserId,
        type: 'LEAD_ASSIGNED',
        title: 'New Lead Assigned',
        message: `${req.user?.firstName} assigned lead ${lead.firstName} ${lead.lastName} to you.`,
        link: `/leads/${lead.id}`,
      });
    }

    return sendSuccess({
      res,
      statusCode: 201,
      message: 'Lead created successfully',
      data: lead,
    });
  } catch (error) {
    next(error);
  }
};

export const updateLead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const existing = await prisma.lead.findFirst({
      where: { id, organizationId: req.orgId },
    });

    if (!existing) {
      throw new NotFoundError('Lead not found');
    }

    const updated = await prisma.lead.update({
      where: { id },
      data,
      include: {
        assignedToUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    // If status changed, log activity
    if (data.status && data.status !== existing.status) {
      await prisma.activity.create({
        data: {
          organizationId: req.orgId!,
          performedByUserId: req.user!.id,
          leadId: id,
          type: 'STATUS_CHANGE',
          title: 'Status Updated',
          description: `Status changed from ${existing.status} to ${data.status}`,
        },
      });
    }

    await createAuditLog({
      req,
      organizationId: req.orgId!,
      action: 'UPDATE_LEAD',
      entity: 'LEAD',
      entityId: id,
      details: data,
    });

    emitToOrg(req.orgId!, 'lead.updated', updated);

    return sendSuccess({
      res,
      message: 'Lead updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const existing = await prisma.lead.findFirst({
      where: { id, organizationId: req.orgId },
    });

    if (!existing) {
      throw new NotFoundError('Lead not found');
    }

    await prisma.lead.delete({
      where: { id },
    });

    await createAuditLog({
      req,
      organizationId: req.orgId!,
      action: 'DELETE_LEAD',
      entity: 'LEAD',
      entityId: id,
      details: { name: `${existing.firstName} ${existing.lastName}` },
    });

    emitToOrg(req.orgId!, 'lead.deleted', { id });

    return sendSuccess({
      res,
      message: 'Lead deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const assignLead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { assignedToUserId } = req.body;

    const lead = await prisma.lead.findFirst({
      where: { id, organizationId: req.orgId },
    });

    if (!lead) {
      throw new NotFoundError('Lead not found');
    }

    const assignee = await prisma.user.findUnique({
      where: { id: assignedToUserId },
    });

    if (!assignee) {
      throw new NotFoundError('Assigned user not found');
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: { assignedToUserId },
      include: {
        assignedToUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    // Activity log
    await prisma.activity.create({
      data: {
        organizationId: req.orgId!,
        performedByUserId: req.user!.id,
        leadId: id,
        type: 'STATUS_CHANGE',
        title: 'Lead Assigned',
        description: `Lead assigned to ${assignee.firstName} ${assignee.lastName}`,
      },
    });

    // Real-time socket & Notification
    emitToOrg(req.orgId!, 'lead.assigned', updated);
    emitToUser(assignee.id, 'lead.assigned', updated);

    enqueueNotification({
      organizationId: req.orgId!,
      userId: assignee.id,
      type: 'LEAD_ASSIGNED',
      title: 'New Lead Assigned',
      message: `${req.user?.firstName} assigned lead ${updated.firstName} ${updated.lastName} to you.`,
      link: `/leads/${updated.id}`,
    });

    const leadUrl = `${config.frontendUrl}/leads/${updated.id}`;
    enqueueEmail({
      to: assignee.email,
      ...emailTemplates.leadAssigned(
        assignee.firstName,
        `${updated.firstName} ${updated.lastName}`,
        updated.company || 'N/A',
        leadUrl
      ),
    });

    return sendSuccess({
      res,
      message: 'Lead assigned successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const convertLeadToCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { company, website, address, createDeal, dealTitle, dealAmount } = req.body;

    const lead = await prisma.lead.findFirst({
      where: { id, organizationId: req.orgId },
    });

    if (!lead) {
      throw new NotFoundError('Lead not found');
    }

    if (lead.status === 'QUALIFIED') {
      const existingCustomer = await prisma.customer.findFirst({
        where: { convertedFromLeadId: lead.id },
      });
      if (existingCustomer) {
        return sendSuccess({
          res,
          message: 'Lead already converted to customer',
          data: existingCustomer,
        });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create customer
      const customer = await tx.customer.create({
        data: {
          organizationId: req.orgId!,
          name: `${lead.firstName} ${lead.lastName}`.trim(),
          company: company || lead.company,
          email: lead.email,
          phone: lead.phone,
          website,
          address,
          status: 'ACTIVE',
          convertedFromLeadId: lead.id,
        },
      });

      // Update lead status
      await tx.lead.update({
        where: { id: lead.id },
        data: { status: 'QUALIFIED' },
      });

      // Optional initial deal
      let deal = null;
      if (createDeal) {
        deal = await tx.deal.create({
          data: {
            organizationId: req.orgId!,
            customerId: customer.id,
            title: dealTitle || `${customer.name} - Initial Deal`,
            amount: dealAmount || lead.estimatedValue || 5000,
            stage: 'PROPOSAL',
            assignedToUserId: lead.assignedToUserId || req.user!.id,
          },
        });
      }

      // Log activity
      await tx.activity.create({
        data: {
          organizationId: req.orgId!,
          performedByUserId: req.user!.id,
          leadId: lead.id,
          customerId: customer.id,
          type: 'STATUS_CHANGE',
          title: 'Lead Converted to Customer',
          description: `Converted lead to customer ${customer.name}${deal ? ` and created deal ${deal.title}` : ''}`,
        },
      });

      return { customer, deal };
    });

    await createAuditLog({
      req,
      organizationId: req.orgId!,
      action: 'CONVERT_LEAD',
      entity: 'LEAD',
      entityId: lead.id,
      details: { customerId: result.customer.id, customerName: result.customer.name },
    });

    emitToOrg(req.orgId!, 'lead.updated', { id: lead.id, status: 'QUALIFIED' });
    emitToOrg(req.orgId!, 'customer.created', result.customer);

    return sendSuccess({
      res,
      statusCode: 201,
      message: 'Lead converted to customer successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const bulkUpdateStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { leadIds, status } = req.body;

    const result = await prisma.lead.updateMany({
      where: {
        id: { in: leadIds },
        organizationId: req.orgId,
      },
      data: { status },
    });

    await createAuditLog({
      req,
      organizationId: req.orgId!,
      action: 'BULK_UPDATE_LEAD_STATUS',
      entity: 'LEAD',
      details: { count: result.count, newStatus: status, leadIds },
    });

    emitToOrg(req.orgId!, 'lead.bulkUpdated', { leadIds, status });

    return sendSuccess({
      res,
      message: `Updated status for ${result.count} leads`,
      data: { updatedCount: result.count },
    });
  } catch (error) {
    next(error);
  }
};
