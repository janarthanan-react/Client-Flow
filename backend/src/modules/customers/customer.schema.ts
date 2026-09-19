import { z } from 'zod';

export const createCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    company: z.string().optional().nullable(),
    email: z.string().email('Invalid email address').toLowerCase(),
    phone: z.string().optional().nullable(),
    website: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'CHURNED']).optional(),
  }),
});

export const updateCustomerSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Customer ID is required'),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    company: z.string().optional().nullable(),
    email: z.string().email().optional(),
    phone: z.string().optional().nullable(),
    website: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'CHURNED']).optional(),
  }),
});

export const logCustomerActivitySchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Customer ID is required'),
  }),
  body: z.object({
    type: z.enum(['NOTE', 'CALL', 'EMAIL', 'MEETING']),
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
  }),
});

export const listCustomersSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    status: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});
