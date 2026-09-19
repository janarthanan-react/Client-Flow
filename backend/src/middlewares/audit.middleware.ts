import { Request } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

export interface AuditLogParams {
  req?: Request;
  organizationId: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, any>;
}

export async function createAuditLog({
  req,
  organizationId,
  userId,
  action,
  entity,
  entityId,
  details,
}: AuditLogParams) {
  try {
    const ipAddress = req?.ip || req?.socket.remoteAddress || 'unknown';
    const userAgent = req?.headers['user-agent'] || 'unknown';
    const effectiveUserId = userId || req?.user?.id;

    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: effectiveUserId,
        action,
        entity,
        entityId,
        details: details ? JSON.stringify(details) : null,
        ipAddress,
        userAgent,
      },
    });
  } catch (err: any) {
    logger.warn(`Failed to write audit log: ${err.message}`);
  }
}
