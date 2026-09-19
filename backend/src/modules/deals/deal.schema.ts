import { z } from 'zod';

export const createDealSchema = z.object({
  body: z.object({
    customerId: z.string().min(1, 'Customer ID is required'),
    title: z.string().min(1, 'Deal title is required'),
    amount: z.number().min(0, 'Amount must be non-negative'),
    stage: z.enum(['PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']).optional(),
    probability: z.number().min(0).max(100).optional(),
    expectedCloseDate: z.string().datetime().optional().nullable(),
    assignedToUserId: z.string().optional().nullable(),
  }),
});

export const updateDealSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Deal ID is required'),
  }),
  body: z.object({
    customerId: z.string().optional(),
    title: z.string().min(1).optional(),
    amount: z.number().min(0).optional(),
    stage: z.enum(['PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']).optional(),
    probability: z.number().min(0).max(100).optional(),
    expectedCloseDate: z.string().datetime().optional().nullable(),
    assignedToUserId: z.string().optional().nullable(),
  }),
});

export const updateDealStageSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Deal ID is required'),
  }),
  body: z.object({
    stage: z.enum(['PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']),
  }),
});
