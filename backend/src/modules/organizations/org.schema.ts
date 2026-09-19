import { z } from 'zod';

export const updateOrgSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    logoUrl: z.string().url('Invalid logo URL').optional().nullable(),
  }),
});

export const inviteMemberSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').toLowerCase(),
    role: z.enum(['ADMIN', 'SALES', 'MEMBER']),
  }),
});

export const updateMemberRoleSchema = z.object({
  params: z.object({
    memberId: z.string().min(1, 'Member ID is required'),
  }),
  body: z.object({
    role: z.enum(['ADMIN', 'SALES', 'MEMBER']),
  }),
});

export const acceptInviteSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Invitation token is required'),
  }),
});
