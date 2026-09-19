import { z } from 'zod';

export const createLeadSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address').toLowerCase(),
    phone: z.string().optional().nullable(),
    company: z.string().optional().nullable(),
    title: z.string().optional().nullable(),
    status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'UNQUALIFIED']).optional(),
    source: z.enum(['WEBSITE', 'REFERRAL', 'LINKEDIN', 'COLD_OUTREACH', 'INBOUND', 'OTHER']).optional(),
    estimatedValue: z.number().min(0, 'Estimated value must be non-negative').optional(),
    assignedToUserId: z.string().optional().nullable(),
  }),
});

export const updateLeadSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Lead ID is required'),
  }),
  body: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional().nullable(),
    company: z.string().optional().nullable(),
    title: z.string().optional().nullable(),
    status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'UNQUALIFIED']).optional(),
    source: z.enum(['WEBSITE', 'REFERRAL', 'LINKEDIN', 'COLD_OUTREACH', 'INBOUND', 'OTHER']).optional(),
    estimatedValue: z.number().min(0).optional(),
    assignedToUserId: z.string().optional().nullable(),
  }),
});

export const assignLeadSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Lead ID is required'),
  }),
  body: z.object({
    assignedToUserId: z.string().min(1, 'Assigned user ID is required'),
  }),
});

export const convertLeadSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Lead ID is required'),
  }),
  body: z.object({
    company: z.string().optional(),
    website: z.string().optional(),
    address: z.string().optional(),
    createDeal: z.boolean().optional(),
    dealTitle: z.string().optional(),
    dealAmount: z.number().optional(),
  }),
});

export const bulkStatusSchema = z.object({
  body: z.object({
    leadIds: z.array(z.string().min(1)).min(1, 'At least one lead ID is required'),
    status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'UNQUALIFIED']),
  }),
});

export const listLeadsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    status: z.string().optional(),
    source: z.string().optional(),
    assignedToUserId: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});
