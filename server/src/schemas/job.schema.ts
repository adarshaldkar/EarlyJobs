import { z } from 'zod';

export const createJobSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Job title must be at least 2 characters')
    .max(100, 'Job title cannot exceed 100 characters'),
  department: z.string().trim().min(2).max(50).default('Engineering'),
  location: z.string().trim().min(2).max(100).default('Bengaluru (Hybrid)'),
  type: z.enum(['Full-time', 'Contract', 'Part-time', 'Internship']).default('Full-time'),
  status: z.enum(['Open', 'Closed', 'Draft']).default('Open'),
  experienceMin: z.number().min(0).default(1),
  experienceMax: z.number().min(0).default(5),
  openingsCount: z.number().int().min(1).default(1),
  description: z.string().trim().default(''),
  requirements: z.array(z.string().trim()).optional().default([])
});

export const updateJobSchema = createJobSchema.partial();

export const queryJobsSchema = z.object({
  department: z.string().trim().optional(),
  status: z.enum(['Open', 'Closed', 'Draft', 'All', '']).optional(),
  search: z.string().trim().optional()
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type QueryJobsInput = z.infer<typeof queryJobsSchema>;
