import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { sendSuccess } from '../../utils/apiResponse';

export const getDashboardAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.orgId!;

    const [
      totalLeads,
      qualifiedLeads,
      totalCustomers,
      deals,
      recentLeads,
      recentActivities,
      upcomingTasks,
    ] = await Promise.all([
      prisma.lead.count({ where: { organizationId: orgId } }),
      prisma.lead.count({ where: { organizationId: orgId, status: 'QUALIFIED' } }),
      prisma.customer.count({ where: { organizationId: orgId, status: 'ACTIVE' } }),
      prisma.deal.findMany({
        where: { organizationId: orgId },
        select: { amount: true, stage: true },
      }),
      prisma.lead.findMany({
        where: { organizationId: orgId },
        include: {
          assignedToUser: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.activity.findMany({
        where: { organizationId: orgId },
        include: {
          performedByUser: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          lead: { select: { id: true, firstName: true, lastName: true } },
          customer: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
      prisma.task.findMany({
        where: { organizationId: orgId, status: { in: ['TODO', 'IN_PROGRESS'] } },
        include: {
          assignedToUser: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }],
        take: 5,
      }),
    ]);

    const openDeals = deals.filter((d) => d.stage !== 'CLOSED_WON' && d.stage !== 'CLOSED_LOST');
    const closedWonDeals = deals.filter((d) => d.stage === 'CLOSED_WON');

    const totalPipelineValue = openDeals.reduce((sum, d) => sum + d.amount, 0);
    const totalRevenue = closedWonDeals.reduce((sum, d) => sum + d.amount, 0);

    const conversionRate = totalLeads > 0 ? ((qualifiedLeads / totalLeads) * 100).toFixed(1) : '0';
    const winRate =
      deals.length > 0 ? ((closedWonDeals.length / deals.length) * 100).toFixed(1) : '0';

    return sendSuccess({
      res,
      data: {
        metrics: {
          totalLeads,
          qualifiedLeads,
          totalCustomers,
          openDealsCount: openDeals.length,
          totalRevenue,
          totalPipelineValue,
          conversionRate: parseFloat(conversionRate),
          winRate: parseFloat(winRate),
        },
        recentLeads,
        recentActivities,
        upcomingTasks,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getRevenueAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.orgId!;
    const deals = await prisma.deal.findMany({
      where: { organizationId: orgId, stage: 'CLOSED_WON' },
      select: { amount: true, updatedAt: true, createdAt: true },
      orderBy: { updatedAt: 'asc' },
    });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();

    const monthlyRevenueMap: Record<string, { month: string; revenue: number; target: number }> = {};
    months.forEach((m, idx) => {
      monthlyRevenueMap[idx] = { month: m, revenue: 0, target: 15000 + idx * 2500 };
    });

    deals.forEach((d) => {
      const date = new Date(d.updatedAt);
      if (date.getFullYear() === currentYear) {
        const monthIdx = date.getMonth();
        if (monthlyRevenueMap[monthIdx]) {
          monthlyRevenueMap[monthIdx].revenue += d.amount;
        }
      }
    });

    const data = Object.values(monthlyRevenueMap);

    return sendSuccess({
      res,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getLeadsAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.orgId!;
    const leads = await prisma.lead.findMany({
      where: { organizationId: orgId },
      select: { createdAt: true, status: true },
      orderBy: { createdAt: 'asc' },
    });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();

    const leadGrowthMap: Record<string, { month: string; total: number; qualified: number }> = {};
    months.forEach((m, idx) => {
      leadGrowthMap[idx] = { month: m, total: 0, qualified: 0 };
    });

    leads.forEach((l) => {
      const date = new Date(l.createdAt);
      if (date.getFullYear() === currentYear) {
        const monthIdx = date.getMonth();
        if (leadGrowthMap[monthIdx]) {
          leadGrowthMap[monthIdx].total += 1;
          if (l.status === 'QUALIFIED') {
            leadGrowthMap[monthIdx].qualified += 1;
          }
        }
      }
    });

    return sendSuccess({
      res,
      data: Object.values(leadGrowthMap),
    });
  } catch (error) {
    next(error);
  }
};

export const getSourcesAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.orgId!;
    const sources = await prisma.lead.groupBy({
      by: ['source'],
      where: { organizationId: orgId },
      _count: { id: true },
      _sum: { estimatedValue: true },
    });

    const colors: Record<string, string> = {
      WEBSITE: '#6366f1',
      REFERRAL: '#10b981',
      LINKEDIN: '#0ea5e9',
      COLD_OUTREACH: '#f59e0b',
      INBOUND: '#8b5cf6',
      OTHER: '#ec4899',
    };

    const formatted = sources.map((s) => ({
      name: s.source.replace('_', ' '),
      source: s.source,
      count: s._count.id,
      value: s._sum.estimatedValue || 0,
      color: colors[s.source] || '#cbd5e1',
    }));

    return sendSuccess({
      res,
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
};

export const getPipelineAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.orgId!;
    const stages = await prisma.deal.groupBy({
      by: ['stage'],
      where: { organizationId: orgId },
      _count: { id: true },
      _sum: { amount: true },
    });

    const stageColors: Record<string, string> = {
      PROSPECTING: '#94a3b8',
      QUALIFICATION: '#38bdf8',
      PROPOSAL: '#6366f1',
      NEGOTIATION: '#f59e0b',
      CLOSED_WON: '#10b981',
      CLOSED_LOST: '#ef4444',
    };

    const formatted = [
      'PROSPECTING',
      'QUALIFICATION',
      'PROPOSAL',
      'NEGOTIATION',
      'CLOSED_WON',
      'CLOSED_LOST',
    ].map((st) => {
      const match = stages.find((s) => s.stage === st);
      return {
        stage: st,
        name: st.replace('_', ' '),
        count: match?._count.id || 0,
        amount: match?._sum.amount || 0,
        color: stageColors[st],
      };
    });

    return sendSuccess({
      res,
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
};

export const getTeamAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.orgId!;
    const members = await prisma.organizationMember.findMany({
      where: { organizationId: orgId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            assignedLeads: {
              where: { organizationId: orgId },
              select: { id: true, status: true },
            },
            assignedDeals: {
              where: { organizationId: orgId },
              select: { id: true, amount: true, stage: true },
            },
          },
        },
      },
    });

    const teamPerformance = members.map((m) => {
      const leads = m.user.assignedLeads;
      const deals = m.user.assignedDeals;
      const wonDeals = deals.filter((d) => d.stage === 'CLOSED_WON');
      const wonRevenue = wonDeals.reduce((sum, d) => sum + d.amount, 0);
      const winRate = deals.length > 0 ? ((wonDeals.length / deals.length) * 100).toFixed(0) : '0';

      return {
        userId: m.user.id,
        name: `${m.user.firstName} ${m.user.lastName}`,
        email: m.user.email,
        role: m.role,
        avatarUrl: m.user.avatarUrl,
        totalLeads: leads.length,
        totalDeals: deals.length,
        wonDeals: wonDeals.length,
        wonRevenue,
        winRate: parseInt(winRate, 10),
      };
    });

    return sendSuccess({
      res,
      data: teamPerformance,
    });
  } catch (error) {
    next(error);
  }
};
