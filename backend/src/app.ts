import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { errorHandler } from './middlewares/errorHandler.middleware';
import { authRoutes } from './modules/auth/auth.routes';
import { orgRoutes } from './modules/organizations/org.routes';
import { leadRoutes } from './modules/leads/lead.routes';
import { customerRoutes } from './modules/customers/customer.routes';
import { dealRoutes } from './modules/deals/deal.routes';
import { taskRoutes } from './modules/tasks/task.routes';
import { activityRoutes } from './modules/activities/activity.routes';
import { notificationRoutes } from './modules/notifications/notification.routes';
import { analyticsRoutes } from './modules/analytics/analytics.routes';
import { billingRoutes } from './modules/billing/billing.routes';
import { auditLogRoutes } from './modules/auditLogs/auditLog.routes';
import { userRoutes } from './modules/users/user.routes';
import { setupSwagger } from './swagger';
import { prisma } from './lib/prisma';
import { isRedisReady } from './lib/redis';

export const createApp = (): Express => {
  const app = express();

  // Security headers
  app.use(helmet({ contentSecurityPolicy: false }));

  // CORS configuration
  app.use(
    cors({
      origin: [config.frontendUrl, 'http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-organization-id'],
    })
  );

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again after 15 minutes',
      errors: [],
    },
  });
  app.use('/api', limiter as any);

  // Body parsers
  // Webhooks need raw body or JSON
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser() as any);

  // Swagger Documentation
  setupSwagger(app);

  // Health check endpoint
  app.get('/health', async (req: Request, res: Response) => {
    let dbStatus = 'disconnected';
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch {
      dbStatus = 'error';
    }

    return res.status(200).json({
      status: 'ok',
      service: 'clientflow-api',
      environment: config.nodeEnv,
      database: dbStatus,
      redis: isRedisReady() ? 'connected' : 'fallback-mode',
      timestamp: new Date().toISOString(),
    });
  });

  // API v1 Routes
  const apiV1 = express.Router();
  apiV1.use('/auth', authRoutes);
  apiV1.use('/organizations', orgRoutes);
  apiV1.use('/leads', leadRoutes);
  apiV1.use('/customers', customerRoutes);
  apiV1.use('/deals', dealRoutes);
  apiV1.use('/tasks', taskRoutes);
  apiV1.use('/activities', activityRoutes);
  apiV1.use('/notifications', notificationRoutes);
  apiV1.use('/analytics', analyticsRoutes);
  apiV1.use('/billing', billingRoutes);
  apiV1.use('/audit-logs', auditLogRoutes);
  apiV1.use('/users', userRoutes);

  app.use('/api/v1', apiV1);

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
};
