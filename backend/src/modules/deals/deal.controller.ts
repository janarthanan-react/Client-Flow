import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { sendSuccess } from '../../utils/apiResponse';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import { createAuditLog } from '../../middlewares/audit.middleware';
import { emitToOrg } from '../../lib/socket';

export const listDeals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { stage, customerId, assignedToUserId, search } = req.query as any;

    const where: any = {
      organizationId: req.orgId,
    };

    if (stage) {
      where.stage = stage;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (assignedToUserId) {
      where.assignedToUserId = assignedToUserId === 'unassigned' ? null : assignedToUserId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { customer: { name: { contains: search } } },
        { customer: { company: { contains: search } } },
      ];
    }

    const deals = await prisma.deal.findMany({
      where,
      include: {
        customer: {
          select: { id: true, name: true, company: true, email: true },
        },
        assignedToUser: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Compute stage aggregates for Kanban header stats
    const stageSummary: Record<string, { count: number; totalAmount: number }> = {
      PROSPECTING: { count: 0, totalAmount: 0 },
      QUALIFICATION: { count: 0, totalAmount: 0 },
      PROPOSAL: { count: 0, totalAmount: 0 },
      NEGOTIATION: { count: 0, totalAmount: 0 },
      CLOSED_WON: { count: 0, totalAmount: 0 },
      CLOSED_LOST: { count: 0, totalAmount: 0 },
    };

    deals.forEach((deal) => {
      if (stageSummary[deal.stage]) {
        stageSummary[deal.stage].count += 1;
        stageSummary[deal.stage].totalAmount += deal.amount;
      }
    });

    return sendSuccess({
      res,
      data: deals,
      meta: {
        stageSummary,
        totalDeals: deals.length,
        totalPipelineValue: deals
          .filter((d) => d.stage !== 'CLOSED_LOST')
          .reduce((acc, d) => acc + d.amount, 0),
        wonRevenue: deals
          .filter((d) => d.stage === 'CLOSED_WON')
          .reduce((acc, d) => acc + d.amount, 0),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getDealById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const deal = await prisma.deal.findFirst({
      where: { id, organizationId: req.orgId },
      include: {
        customer: true,
        assignedToUser: {
          select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
        },
        activities: {
          include: {
            performedByUser: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!deal) {
      throw new NotFoundError('Deal not found');
    }

    return sendSuccess({
      res,
      data: deal,
    });
  } catch (error) {
    next(error);
  }
};

export const createDeal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;

    // Verify customer exists within organization
    const customer = await prisma.customer.findFirst({
      where: { id: data.customerId, organizationId: req.orgId },
    });

    if (!customer) {
      throw new BadRequestError('Invalid customer ID: Customer does not belong to this organization');
    }

    const deal = await prisma.deal.create({
      data: {
        ...data,
        expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : null,
        organizationId: req.orgId!,
      },
      include: {
        customer: { select: { id: true, name: true, company: true } },
        assignedToUser: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await prisma.activity.create({
      data: {
        organizationId: req.orgId!,
        performedByUserId: req.user!.id,
        customerId: data.customerId,
        dealId: deal.id,
        type: 'STATUS_CHANGE',
        title: 'Deal Created',
        description: `Created deal "${deal.title}" with value $${deal.amount.toLocaleString()} in stage ${deal.stage}`,
      },
    });

    await createAuditLog({
      req,
      organizationId: req.orgId!,
      action: 'CREATE_DEAL',
      entity: 'DEAL',
      entityId: deal.id,
      details: { title: deal.title, amount: deal.amount, stage: deal.stage },
    });

    emitToOrg(req.orgId!, 'deal.updated', deal);

    return sendSuccess({
      res,
      statusCode: 201,
      message: 'Deal created successfully',
      data: deal,
    });
  } catch (error) {
    next(error);
  }
};

export const updateDeal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const existing = await prisma.deal.findFirst({
      where: { id, organizationId: req.orgId },
    });

    if (!existing) {
      throw new NotFoundError('Deal not found');
    }

    const updated = await prisma.deal.update({
      where: { id },
      data: {
        ...data,
        expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : undefined,
      },
      include: {
        customer: { select: { id: true, name: true, company: true } },
        assignedToUser: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await createAuditLog({
      req,
      organizationId: req.orgId!,
      action: 'UPDATE_DEAL',
      entity: 'DEAL',
      entityId: id,
      details: data,
    });

    emitToOrg(req.orgId!, 'deal.updated', updated);

    return sendSuccess({
      res,
      message: 'Deal updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const updateDealStage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { stage } = req.body;

    const existing = await prisma.deal.findFirst({
      where: { id, organizationId: req.orgId },
      include: { customer: true },
    });

    if (!existing) {
      throw new NotFoundError('Deal not found');
    }

    // Auto-update probability based on standard sales pipeline stages
    const defaultProbabilities: Record<string, number> = {
      PROSPECTING: 20,
      QUALIFICATION: 40,
      PROPOSAL: 60,
      NEGOTIATION: 80,
      CLOSED_WON: 100,
      CLOSED_LOST: 0,
    };

    const probability = defaultProbabilities[stage] ?? existing.probability;

    const updated = await prisma.deal.update({
      where: { id },
      data: { stage, probability },
      include: {
        customer: { select: { id: true, name: true, company: true } },
        assignedToUser: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Record activity
    await prisma.activity.create({
      data: {
        organizationId: req.orgId!,
        performedByUserId: req.user!.id,
        customerId: existing.customerId,
        dealId: id,
        type: 'STATUS_CHANGE',
        title: 'Deal Stage Changed',
        description: `Deal "${existing.title}" moved from ${existing.stage} to ${stage}`,
      },
    });

    await createAuditLog({
      req,
      organizationId: req.orgId!,
      action: 'UPDATE_DEAL_STAGE',
      entity: 'DEAL',
      entityId: id,
      details: { fromStage: existing.stage, toStage: stage },
    });

    // Real-time broadcast
    emitToOrg(req.orgId!, 'deal.stageChanged', updated);
    emitToOrg(req.orgId!, 'deal.updated', updated);

    return sendSuccess({
      res,
      message: `Deal moved to ${stage}`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDeal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const existing = await prisma.deal.findFirst({
      where: { id, organizationId: req.orgId },
    });

    if (!existing) {
      throw new NotFoundError('Deal not found');
    }

    await prisma.deal.delete({
      where: { id },
    });

    await createAuditLog({
      req,
      organizationId: req.orgId!,
      action: 'DELETE_DEAL',
      entity: 'DEAL',
      entityId: id,
      details: { title: existing.title },
    });

    emitToOrg(req.orgId!, 'deal.deleted', { id });

    return sendSuccess({
      res,
      message: 'Deal deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
