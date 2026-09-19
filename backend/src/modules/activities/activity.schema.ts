import { z } from 'zod';

export const createActivitySchema = z.object({
  body: z.object({
    type: z.enum(['NOTE', 'CALL', 'EMAIL', 'MEETING', 'STATUS_CHANGE']),
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional().nullable(),
    leadId: z.string().optional().nullable(),
    customerId: z.string().optional().nullable(),
    dealId: z.string().optional().nullable(),
  }),
});
