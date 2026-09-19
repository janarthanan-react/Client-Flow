import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from './logger';

export interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    email: string;
    organizationId?: string;
  };
}

let io: Server | null = null;

export const initSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: [config.frontendUrl, 'http://localhost:5173', 'http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // Socket authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        // Allow unauthenticated connection or reject
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, config.jwt.accessSecret) as any;
      socket.user = {
        id: decoded.userId,
        email: decoded.email,
        organizationId: decoded.organizationId,
      };

      next();
    } catch (err: any) {
      logger.warn(`Socket authentication failed: ${err.message}`);
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const user = socket.user;
    logger.info(`Socket client connected: ${socket.id} (User: ${user?.email || 'unknown'})`);

    if (user?.organizationId) {
      const orgRoom = `org_${user.organizationId}`;
      socket.join(orgRoom);
      logger.debug(`Socket ${socket.id} joined room: ${orgRoom}`);
    }

    if (user?.id) {
      const userRoom = `user_${user.id}`;
      socket.join(userRoom);
    }

    // Client can also join organization explicitly after selecting org
    socket.on('join:org', (orgId: string) => {
      socket.join(`org_${orgId}`);
      logger.debug(`Socket ${socket.id} joined explicit org room: org_${orgId}`);
    });

    socket.on('disconnect', () => {
      logger.debug(`Socket client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): Server | null => io;

// Real-time emitters scoped to organization
export const emitToOrg = (orgId: string, event: string, data: any) => {
  if (!io) return;
  io.to(`org_${orgId}`).emit(event, data);
  logger.debug(`Emitted event [${event}] to room [org_${orgId}]`);
};

// Real-time emitters scoped to specific user
export const emitToUser = (userId: string, event: string, data: any) => {
  if (!io) return;
  io.to(`user_${userId}`).emit(event, data);
  logger.debug(`Emitted event [${event}] to user [${userId}]`);
};
