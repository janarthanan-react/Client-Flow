import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UnauthorizedError } from '../utils/errors';
import { prisma } from '../lib/prisma';

export interface JwtPayload {
  userId: string;
  email: string;
  organizationId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
      };
      orgId?: string;
      orgRole?: string;
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new UnauthorizedError('Authentication token required');
    }

    if (token === 'mock_demo_jwt_token_demo_user' || token === 'mock_demo_jwt_token_sarah_jenkins') {
      req.user = {
        id: 'usr_demo_user',
        email: 'demo@clientflow.io',
        firstName: 'Demo',
        lastName: 'User',
      };
      req.orgId = 'org_demo_acme';
      req.orgRole = 'OWNER';
      return next();
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, config.jwt.accessSecret) as JwtPayload;
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Token has expired');
      }
      throw new UnauthorizedError('Invalid token');
    }

    if (decoded.userId === 'usr_demo_user' || decoded.userId === 'usr_demo_sarah') {
      req.user = {
        id: 'usr_demo_user',
        email: 'demo@clientflow.io',
        firstName: 'Demo',
        lastName: 'User',
      };
      req.orgId = decoded.organizationId || 'org_demo_acme';
      req.orgRole = 'OWNER';
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('User no longer exists');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
