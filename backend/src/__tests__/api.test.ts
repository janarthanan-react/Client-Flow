import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../lib/prisma';

const app = createApp();

describe('ClientFlow API Test Suite', () => {
  let authToken: string;
  let organizationId: string;
  let createdLeadId: string;

  beforeAll(async () => {
    // Login with seeded demo credentials
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'demo@clientflow.io',
        password: 'ClientFlow2025!',
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data.accessToken).toBeDefined();

    authToken = loginRes.body.data.accessToken;
    organizationId = loginRes.body.data.currentOrganization.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('1. Health Check Endpoint', () => {
    it('should return 200 OK with service and database status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('clientflow-api');
      expect(res.body.database).toBe('connected');
    });
  });

  describe('2. Authentication & Security', () => {
    it('should reject invalid credentials with 401', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'demo@clientflow.io',
          password: 'WrongPassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject protected routes without token with 401', async () => {
      const res = await request(app).get('/api/v1/leads');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return current user profile via /auth/me', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe('demo@clientflow.io');
      expect(res.body.data.currentOrganization).toBeDefined();
    });
  });

  describe('3. Multi-Tenant Isolation', () => {
    it('should reject access to an unauthorized organization with 403', async () => {
      const res = await request(app)
        .get('/api/v1/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-organization-id', 'unauthorized-org-cuid-999');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('4. Leads Management API', () => {
    it('should list leads with pagination metadata', async () => {
      const res = await request(app)
        .get('/api/v1/leads?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-organization-id', organizationId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta.total).toBeGreaterThan(0);
    });

    it('should filter leads by status', async () => {
      const res = await request(app)
        .get('/api/v1/leads?status=NEW')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-organization-id', organizationId);

      expect(res.status).toBe(200);
      expect(res.body.data.every((lead: any) => lead.status === 'NEW')).toBe(true);
    });

    it('should create a new lead successfully', async () => {
      const newLead = {
        firstName: 'Jonathan',
        lastName: 'TestLead',
        email: 'jonathan.test@enterprise.co',
        phone: '+1 555-987-6543',
        company: 'Enterprise Test Corp',
        title: 'Head of Procurement',
        status: 'NEW',
        source: 'WEBSITE',
        estimatedValue: 25000,
      };

      const res = await request(app)
        .post('/api/v1/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-organization-id', organizationId)
        .send(newLead);

      expect(res.status).toBe(201);
      expect(res.body.data.email).toBe(newLead.email);
      expect(res.body.data.organizationId).toBe(organizationId);

      createdLeadId = res.body.data.id;
    });

    it('should update lead status', async () => {
      const res = await request(app)
        .patch(`/api/v1/leads/${createdLeadId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-organization-id', organizationId)
        .send({ status: 'QUALIFIED' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('QUALIFIED');
    });
  });

  describe('5. Deals & Sales Pipeline API', () => {
    it('should list deals with pipeline stage metrics', async () => {
      const res = await request(app)
        .get('/api/v1/deals')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-organization-id', organizationId);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta.stageSummary).toBeDefined();
      expect(res.body.meta.totalPipelineValue).toBeGreaterThan(0);
    });
  });

  describe('6. Tasks API', () => {
    it('should list tasks with summary counts', async () => {
      const res = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-organization-id', organizationId);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta.summary).toBeDefined();
    });
  });

  describe('7. Analytics API', () => {
    it('should return dashboard metrics', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-organization-id', organizationId);

      expect(res.status).toBe(200);
      expect(res.body.data.metrics.totalLeads).toBeGreaterThan(0);
      expect(res.body.data.metrics.totalCustomers).toBeGreaterThan(0);
      expect(res.body.data.recentLeads).toBeDefined();
      expect(res.body.data.recentActivities).toBeDefined();
    });
  });
});
