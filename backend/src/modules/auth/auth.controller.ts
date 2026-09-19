import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import { config } from '../../config';
import { sendSuccess } from '../../utils/apiResponse';
import { BadRequestError, UnauthorizedError, ConflictError, NotFoundError } from '../../utils/errors';
import { enqueueEmail } from '../../queues/email.queue';
import { emailTemplates } from '../../lib/email';
import { createAuditLog } from '../../middlewares/audit.middleware';

// Helpers
const generateSlug = (name: string) => {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') +
    '-' +
    Math.random().toString(36).substring(2, 6)
  );
};

const signTokens = (userId: string, email: string, organizationId?: string) => {
  const accessToken = jwt.sign({ userId, email, organizationId }, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn as any,
  });

  const refreshToken = jwt.sign({ userId, email }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn as any,
  });

  return { accessToken, refreshToken };
};

const hashToken = (token: string) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const setRefreshTokenCookie = (res: Response, token: string) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName, email, password, organizationName } = req.body;

    // Check existing email
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictError('A user with this email address already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create Organization, User, and Membership transactionally
    const slug = generateSlug(organizationName);

    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: organizationName,
          slug,
          plan: 'FREE',
        },
      });

      const user = await tx.user.create({
        data: {
          firstName,
          lastName,
          email,
          passwordHash,
          verificationToken,
          emailVerified: false,
        },
      });

      const membership = await tx.organizationMember.create({
        data: {
          userId: user.id,
          organizationId: org.id,
          role: 'OWNER',
        },
      });

      return { user, org, membership };
    });

    const { accessToken, refreshToken } = signTokens(result.user.id, result.user.email, result.org.id);

    // Save refresh token
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
      data: {
        userId: result.user.id,
        tokenHash,
        expiresAt,
      },
    });

    setRefreshTokenCookie(res, refreshToken);

    // Background jobs: send emails
    const verifyUrl = `${config.frontendUrl}/verify-email?token=${verificationToken}`;
    enqueueEmail({
      to: result.user.email,
      ...emailTemplates.welcome(`${result.user.firstName} ${result.user.lastName}`, result.org.name),
    });
    enqueueEmail({
      to: result.user.email,
      ...emailTemplates.verifyEmail(result.user.firstName, verifyUrl),
    });

    // Audit log
    await createAuditLog({
      req,
      organizationId: result.org.id,
      userId: result.user.id,
      action: 'REGISTER_ORGANIZATION',
      entity: 'ORGANIZATION',
      entityId: result.org.id,
      details: { organizationName: result.org.name },
    });

    return sendSuccess({
      res,
      statusCode: 201,
      message: 'Registration successful',
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          emailVerified: result.user.emailVerified,
        },
        organization: {
          id: result.org.id,
          name: result.org.name,
          slug: result.org.slug,
          role: result.membership.role,
          plan: result.org.plan,
        },
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const primaryMembership = user.memberships[0];
    const orgId = primaryMembership ? primaryMembership.organizationId : undefined;

    const { accessToken, refreshToken } = signTokens(user.id, user.email, orgId);

    // Save refresh token
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    setRefreshTokenCookie(res, refreshToken);

    if (orgId) {
      await createAuditLog({
        req,
        organizationId: orgId,
        userId: user.id,
        action: 'USER_LOGIN',
        entity: 'USER',
        entityId: user.id,
      });
    }

    return sendSuccess({
      res,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatarUrl: user.avatarUrl,
          emailVerified: user.emailVerified,
        },
        currentOrganization: primaryMembership
          ? {
              id: primaryMembership.organization.id,
              name: primaryMembership.organization.name,
              slug: primaryMembership.organization.slug,
              role: primaryMembership.role,
              plan: primaryMembership.organization.plan,
            }
          : null,
        organizations: user.memberships.map((m) => ({
          id: m.organization.id,
          name: m.organization.name,
          slug: m.organization.slug,
          role: m.role,
          plan: m.organization.plan,
        })),
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token) {
      throw new UnauthorizedError('Refresh token required');
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, config.jwt.refreshSecret);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const tokenHash = hashToken(token);
    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!storedToken || storedToken.revoked || new Date() > storedToken.expiresAt) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Refresh Token Rotation: Revoke old token
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    // Check user & memberships
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        memberships: {
          include: { organization: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    const primaryOrgId = user.memberships[0]?.organizationId;
    const tokens = signTokens(user.id, user.email, primaryOrgId);

    // Save new refresh token
    const newHash = hashToken(tokens.refreshToken);
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: newHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    setRefreshTokenCookie(res, tokens.refreshToken);

    return sendSuccess({
      res,
      message: 'Token refreshed successfully',
      data: {
        accessToken: tokens.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (token) {
      const tokenHash = hashToken(token);
      await prisma.refreshToken
        .updateMany({
          where: { tokenHash },
          data: { revoked: true },
        })
        .catch(() => {});
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: config.isProduction ? 'none' : 'lax',
      path: '/',
    });

    return sendSuccess({
      res,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        memberships: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const currentOrgId = req.headers['x-organization-id'] as string;
    let currentMembership = user.memberships.find((m) => m.organizationId === currentOrgId);
    if (!currentMembership && user.memberships.length > 0) {
      currentMembership = user.memberships[0];
    }

    return sendSuccess({
      res,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatarUrl: user.avatarUrl,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
        },
        currentOrganization: currentMembership
          ? {
              id: currentMembership.organization.id,
              name: currentMembership.organization.name,
              slug: currentMembership.organization.slug,
              logoUrl: currentMembership.organization.logoUrl,
              plan: currentMembership.organization.plan,
              role: currentMembership.role,
            }
          : null,
        organizations: user.memberships.map((m) => ({
          id: m.organization.id,
          name: m.organization.name,
          slug: m.organization.slug,
          logoUrl: m.organization.logoUrl,
          plan: m.organization.plan,
          role: m.role,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    // Always respond with success to prevent user enumeration attacks
    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExpires },
      });

      const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;
      enqueueEmail({
        to: user.email,
        ...emailTemplates.resetPassword(user.firstName, resetUrl),
      });
    }

    return sendSuccess({
      res,
      message: 'If an account exists with that email, a password reset link has been sent',
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestError('Invalid or expired password reset token');
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    // Invalidate all active refresh tokens for security
    await prisma.refreshToken.updateMany({
      where: { userId: user.id },
      data: { revoked: true },
    });

    return sendSuccess({
      res,
      message: 'Password has been reset successfully. Please log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;

    const user = await prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      throw new BadRequestError('Invalid email verification token');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
      },
    });

    return sendSuccess({
      res,
      message: 'Email verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestError('Current password is incorrect');
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return sendSuccess({
      res,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const googleAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { credential } = req.body;

    // Verify token with Google
    let googleUser: any;
    try {
      const googleRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
      );
      if (!googleRes.ok) {
        throw new Error('Google token verification failed');
      }
      googleUser = await googleRes.json();
    } catch {
      throw new UnauthorizedError('Invalid or expired Google authentication token');
    }

    if (!googleUser || !googleUser.email) {
      throw new UnauthorizedError('Unable to retrieve email from Google profile');
    }

    // If GOOGLE_CLIENT_ID is configured, verify audience/azp
    if (
      config.google.clientId &&
      googleUser.aud !== config.google.clientId &&
      googleUser.azp !== config.google.clientId
    ) {
      throw new UnauthorizedError('Google token audience does not match configured client ID');
    }

    const email = googleUser.email.toLowerCase();
    const firstName = googleUser.given_name || googleUser.name?.split(' ')[0] || 'Google';
    const lastName =
      googleUser.family_name || googleUser.name?.split(' ').slice(1).join(' ') || 'User';
    const avatarUrl = googleUser.picture || null;

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          include: {
            organization: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    let authenticatedUser: any = null;
    let currentOrg: any = null;
    let organizations: any[] = [];

    if (user) {
      // Existing user: update verification & avatar if needed
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          ...(avatarUrl && !user.avatarUrl ? { avatarUrl } : {}),
        },
        include: {
          memberships: {
            include: {
              organization: true,
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      authenticatedUser = updatedUser;
      organizations = updatedUser.memberships.map((m) => m.organization);

      if (organizations.length === 0) {
        const orgName = `${firstName}'s Workspace`;
        const slug = generateSlug(orgName);
        const newOrg = await prisma.organization.create({
          data: {
            name: orgName,
            slug,
            plan: 'FREE',
          },
        });
        await prisma.organizationMember.create({
          data: {
            userId: updatedUser.id,
            organizationId: newOrg.id,
            role: 'OWNER',
          },
        });
        currentOrg = newOrg;
        organizations = [newOrg];
      } else {
        currentOrg = organizations[0];
      }
    } else {
      // New user: create user + default organization
      const orgName = `${firstName}'s Workspace`;
      const slug = generateSlug(orgName);
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(randomPassword, salt);

      const result = await prisma.$transaction(async (tx) => {
        const org = await tx.organization.create({
          data: {
            name: orgName,
            slug,
            plan: 'FREE',
          },
        });

        const newUser = await tx.user.create({
          data: {
            firstName,
            lastName,
            email,
            passwordHash,
            avatarUrl,
            emailVerified: true,
          },
        });

        await tx.organizationMember.create({
          data: {
            userId: newUser.id,
            organizationId: org.id,
            role: 'OWNER',
          },
        });

        return { user: newUser, org };
      });

      authenticatedUser = result.user;
      currentOrg = result.org;
      organizations = [result.org];
    }

    // Sign tokens
    const { accessToken, refreshToken } = signTokens(
      authenticatedUser.id,
      authenticatedUser.email,
      currentOrg.id
    );

    // Save refresh token
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        userId: authenticatedUser.id,
        tokenHash,
        expiresAt,
      },
    });

    setRefreshTokenCookie(res, refreshToken);

    await createAuditLog({
      req,
      userId: authenticatedUser.id,
      organizationId: currentOrg.id,
      action: 'USER_LOGIN',
      entity: 'USER',
      entityId: authenticatedUser.id,
      details: { method: 'GOOGLE_SSO', email: authenticatedUser.email },
    });

    return sendSuccess({
      res,
      message: 'Google authentication successful',
      data: {
        user: {
          id: authenticatedUser.id,
          email: authenticatedUser.email,
          firstName: authenticatedUser.firstName,
          lastName: authenticatedUser.lastName,
          avatarUrl: authenticatedUser.avatarUrl,
          emailVerified: authenticatedUser.emailVerified,
        },
        currentOrganization: currentOrg,
        organizations,
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};
