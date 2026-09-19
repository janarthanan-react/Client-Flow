import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../../lib/prisma';
import { sendSuccess } from '../../utils/apiResponse';
import { BadRequestError, ForbiddenError, NotFoundError, ConflictError } from '../../utils/errors';
import { enqueueEmail } from '../../queues/email.queue';
import { emailTemplates } from '../../lib/email';
import { createAuditLog } from '../../middlewares/audit.middleware';
import { emitToOrg } from '../../lib/socket';
import { config } from '../../config';

export const getCurrentOrg = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: req.orgId },
      include: {
        _count: {
          select: {
            members: true,
            leads: true,
            customers: true,
            deals: true,
          },
        },
      },
    });

    if (!org) {
      throw new NotFoundError('Organization not found');
    }

    return sendSuccess({
      res,
      data: {
        ...org,
        currentUserRole: req.orgRole,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateCurrentOrg = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, logoUrl } = req.body;

    const updated = await prisma.organization.update({
      where: { id: req.orgId },
      data: {
        ...(name && { name }),
        ...(logoUrl !== undefined && { logoUrl }),
      },
    });

    await createAuditLog({
      req,
      organizationId: req.orgId!,
      action: 'UPDATE_ORGANIZATION',
      entity: 'ORGANIZATION',
      entityId: req.orgId,
      details: { name, logoUrl },
    });

    return sendSuccess({
      res,
      message: 'Organization updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const getMembers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const members = await prisma.organizationMember.findMany({
      where: { organizationId: req.orgId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            emailVerified: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const invitations = await prisma.invitation.findMany({
      where: {
        organizationId: req.orgId,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess({
      res,
      data: {
        members: members.map((m) => ({
          id: m.id,
          userId: m.userId,
          role: m.role,
          joinedAt: m.createdAt,
          user: m.user,
        })),
        pendingInvitations: invitations,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const inviteMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, role } = req.body;

    // Check if user is already a member
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const existingMember = await prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: existingUser.id,
            organizationId: req.orgId!,
          },
        },
      });

      if (existingMember) {
        throw new ConflictError('User is already a member of this organization');
      }
    }

    // Check organization details
    const org = await prisma.organization.findUnique({ where: { id: req.orgId } });
    if (!org) {
      throw new NotFoundError('Organization not found');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await prisma.invitation.create({
      data: {
        email,
        role,
        token,
        organizationId: req.orgId!,
        expiresAt,
      },
    });

    const inviteUrl = `${config.frontendUrl}/register?invite=${token}`;
    const inviterName = `${req.user?.firstName || 'A team member'} ${req.user?.lastName || ''}`.trim();

    enqueueEmail({
      to: email,
      ...emailTemplates.invitation(org.name, inviterName, inviteUrl, role),
    });

    emitToOrg(req.orgId!, 'team.invitation', { email, role });

    await createAuditLog({
      req,
      organizationId: req.orgId!,
      action: 'INVITE_MEMBER',
      entity: 'INVITATION',
      entityId: invitation.id,
      details: { email, role },
    });

    return sendSuccess({
      res,
      statusCode: 201,
      message: `Invitation sent to ${email}`,
      data: invitation,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMemberRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { memberId } = req.params;
    const { role } = req.body;

    const member = await prisma.organizationMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.organizationId !== req.orgId) {
      throw new NotFoundError('Member not found in this organization');
    }

    if (member.role === 'OWNER') {
      throw new ForbiddenError('Cannot change the role of the organization OWNER');
    }

    const updated = await prisma.organizationMember.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    await createAuditLog({
      req,
      organizationId: req.orgId!,
      action: 'UPDATE_MEMBER_ROLE',
      entity: 'ORGANIZATION_MEMBER',
      entityId: memberId,
      details: { role, targetUserId: member.userId },
    });

    return sendSuccess({
      res,
      message: 'Member role updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { memberId } = req.params;

    const member = await prisma.organizationMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.organizationId !== req.orgId) {
      throw new NotFoundError('Member not found in this organization');
    }

    if (member.role === 'OWNER') {
      throw new ForbiddenError('Cannot remove the organization OWNER');
    }

    await prisma.organizationMember.delete({
      where: { id: memberId },
    });

    await createAuditLog({
      req,
      organizationId: req.orgId!,
      action: 'REMOVE_MEMBER',
      entity: 'ORGANIZATION_MEMBER',
      entityId: memberId,
      details: { targetUserId: member.userId },
    });

    return sendSuccess({
      res,
      message: 'Member removed successfully from organization',
    });
  } catch (error) {
    next(error);
  }
};
