import { z } from 'zod';
import { HIRING_STAGES } from '../models/Candidate.js';

const validateHttpUrl = (val: string | undefined): boolean => {
  if (!val || val.trim() === '') return true;
  try {
    const parsed = new URL(val);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export const createCandidateSchema = z.object({
  name: z
    .string({ required_error: 'Candidate name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),
  email: z
    .string({ required_error: 'Candidate email is required' })
    .trim()
    .toLowerCase()
    .email('Invalid email address format'),
  phone: z
    .string()
    .trim()
    .max(20, 'Phone number must not exceed 20 characters')
    .optional(),
  position: z
    .string({ required_error: 'Target position is required' })
    .trim()
    .min(2, 'Position must be at least 2 characters')
    .max(100, 'Position must not exceed 100 characters'),
  experienceYears: z
    .number({ required_error: 'Years of experience is required' })
    .int('Experience must be an integer')
    .min(0, 'Experience cannot be negative')
    .max(50, 'Experience cannot exceed 50 years'),
  skills: z
    .array(
      z
        .string()
        .trim()
        .max(30, 'Skill tag cannot exceed 30 characters')
    )
    .max(20, 'Skills array cannot exceed 20 tags')
    .optional()
    .default([]),
  resumeUrl: z
    .string()
    .trim()
    .refine(validateHttpUrl, {
      message: 'resumeUrl must be a valid http: or https: URL'
    })
    .optional(),
  notes: z
    .string()
    .trim()
    .max(2000, 'Notes cannot exceed 2000 characters')
    .optional(),
  stage: z.enum(HIRING_STAGES).optional().default('Applied')
});

export const updateCandidateSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must not exceed 100 characters')
      .optional(),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Invalid email address format')
      .optional(),
    phone: z
      .string()
      .trim()
      .max(20, 'Phone number must not exceed 20 characters')
      .optional(),
    position: z
      .string()
      .trim()
      .min(2, 'Position must be at least 2 characters')
      .max(100, 'Position must not exceed 100 characters')
      .optional(),
    experienceYears: z
      .number()
      .int('Experience must be an integer')
      .min(0, 'Experience cannot be negative')
      .max(50, 'Experience cannot exceed 50 years')
      .optional(),
    skills: z
      .array(
        z
          .string()
          .trim()
          .max(30, 'Skill tag cannot exceed 30 characters')
      )
      .max(20, 'Skills array cannot exceed 20 tags')
      .optional(),
    resumeUrl: z
      .string()
      .trim()
      .refine(validateHttpUrl, {
        message: 'resumeUrl must be a valid http: or https: URL'
      })
      .optional(),
    notes: z
      .string()
      .trim()
      .max(2000, 'Notes cannot exceed 2000 characters')
      .optional()
  })
  .strict();

export const updateStageSchema = z.object({
  currentStage: z.enum(HIRING_STAGES, {
    required_error: 'currentStage is required for optimistic concurrency verification'
  }),
  newStage: z.enum(HIRING_STAGES, {
    required_error: 'newStage is required'
  }),
  notes: z
    .string()
    .trim()
    .max(2000, 'Notes cannot exceed 2000 characters')
    .optional()
});

export const queryCandidatesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().trim().optional(),
  stage: z
    .enum([...HIRING_STAGES, 'All', ''] as const)
    .optional(),
  sortBy: z
    .enum(['createdAt', 'name', 'experienceYears'] as const)
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc'] as const).default('desc')
});

export type CreateCandidateInput = z.infer<typeof createCandidateSchema>;
export type UpdateCandidateInput = z.infer<typeof updateCandidateSchema>;
export type UpdateStageInput = z.infer<typeof updateStageSchema>;
export type QueryCandidatesInput = z.infer<typeof queryCandidatesSchema>;
