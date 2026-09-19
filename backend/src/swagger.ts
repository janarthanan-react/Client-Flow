import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'ClientFlow API Documentation',
    version: '1.0.0',
    description: 'Production-ready REST API for ClientFlow CRM & Lead Management SaaS platform',
    contact: {
      name: 'ClientFlow API Support',
      email: 'api@clientflow.io',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000/api/v1',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide JWT access token in format: Bearer <token>',
      },
      organizationHeader: {
        type: 'apiKey',
        in: 'header',
        name: 'x-organization-id',
        description: 'Optional organization ID context header',
      },
    },
    schemas: {
      Lead: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          company: { type: 'string' },
          status: { type: 'string', enum: ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'UNQUALIFIED'] },
          source: { type: 'string', enum: ['WEBSITE', 'REFERRAL', 'LINKEDIN', 'COLD_OUTREACH', 'INBOUND', 'OTHER'] },
          estimatedValue: { type: 'number' },
          assignedToUserId: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Customer: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          company: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          website: { type: 'string' },
          address: { type: 'string' },
          status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'CHURNED'] },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Deal: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          amount: { type: 'number' },
          stage: { type: 'string', enum: ['PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'] },
          probability: { type: 'integer' },
          expectedCloseDate: { type: 'string', format: 'date-time' },
          customerId: { type: 'string' },
          assignedToUserId: { type: 'string' },
        },
      },
      Task: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          dueDate: { type: 'string', format: 'date-time' },
          priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
          status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] },
          assignedToUserId: { type: 'string' },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
      organizationHeader: [],
    },
  ],
  paths: {
    '/health': {
      get: {
        summary: 'System health check',
        tags: ['Health'],
        responses: {
          '200': { description: 'API and infrastructure operational status' },
        },
      },
    },
    '/auth/register': {
      post: {
        summary: 'Register new user and organization workspace',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['firstName', 'lastName', 'email', 'password', 'confirmPassword', 'organizationName'],
                properties: {
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  email: { type: 'string' },
                  password: { type: 'string' },
                  confirmPassword: { type: 'string' },
                  organizationName: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Registration successful' } },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Authenticate user and obtain JWT tokens',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Login successful' } },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Get current authenticated user profile and organizations',
        tags: ['Auth'],
        responses: { '200': { description: 'User profile' } },
      },
    },
    '/leads': {
      get: {
        summary: 'List leads with search, filter, and pagination',
        tags: ['Leads'],
        responses: { '200': { description: 'List of leads' } },
      },
      post: {
        summary: 'Create a new lead',
        tags: ['Leads'],
        responses: { '201': { description: 'Lead created' } },
      },
    },
    '/customers': {
      get: {
        summary: 'List customers',
        tags: ['Customers'],
        responses: { '200': { description: 'List of customers' } },
      },
      post: {
        summary: 'Create a new customer',
        tags: ['Customers'],
        responses: { '201': { description: 'Customer created' } },
      },
    },
    '/deals': {
      get: {
        summary: 'List deals with pipeline summary metrics',
        tags: ['Deals'],
        responses: { '200': { description: 'Deals list' } },
      },
      post: {
        summary: 'Create a deal',
        tags: ['Deals'],
        responses: { '201': { description: 'Deal created' } },
      },
    },
    '/tasks': {
      get: {
        summary: 'List tasks with status and priority filters',
        tags: ['Tasks'],
        responses: { '200': { description: 'Tasks list' } },
      },
      post: {
        summary: 'Create a task',
        tags: ['Tasks'],
        responses: { '201': { description: 'Task created' } },
      },
    },
    '/analytics/dashboard': {
      get: {
        summary: 'Get CRM dashboard metrics and KPI cards',
        tags: ['Analytics'],
        responses: { '200': { description: 'Dashboard analytics' } },
      },
    },
    '/billing': {
      get: {
        summary: 'Get subscription status and usage limits',
        tags: ['Billing'],
        responses: { '200': { description: 'Billing details' } },
      },
    },
  },
};

export const setupSwagger = (app: Express) => {
  app.use('/api/docs', swaggerUi.serve as any, swaggerUi.setup(swaggerDocument) as any);
};
