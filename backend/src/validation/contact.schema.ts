import { z } from 'zod';

const optionalText = (max: number) =>
  z
    .union([z.string().trim().max(max), z.literal(''), z.null()])
    .optional()
    .transform((v) => (v === '' || v === undefined ? null : v));

export const contactUpdateSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(100),
  lastName: z.string().trim().min(1, 'Last name is required').max(100),
  email: z
    .union([z.string().trim().email('Invalid email address'), z.literal(''), z.null()])
    .optional()
    .transform((v) => (v === '' || v === undefined ? null : v)),
  phone: optionalText(30),
  company: optionalText(150),
  version: z.number().int().nonnegative('version is required'),
});

export type ContactUpdateInput = z.infer<typeof contactUpdateSchema>;

export const tagNameSchema = z.object({
  tagName: z.string().trim().min(1, 'Tag name is required').max(50),
});

export const bulkTagSchema = z.object({
  contactIds: z.array(z.string().min(1)).min(1, 'Select at least one contact'),
  tagName: z.string().trim().min(1, 'Tag name is required').max(50),
});

export const contactsQuerySchema = z.object({
  q: z.string().trim().optional(),
  tags: z.string().trim().optional(),
  company: z.string().trim().optional(),
  sortBy: z.enum(['name', 'createdAt']).optional().default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type ContactsQueryInput = z.infer<typeof contactsQuerySchema>;
