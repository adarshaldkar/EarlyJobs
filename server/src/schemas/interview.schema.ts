import { z } from 'zod';

export const createInterviewSchema = z.object({
  candidateId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid candidate ID').optional(),
  candidateName: z.string().trim().min(2),
  candidateEmail: z.string().trim().email(),
  position: z.string().trim().min(2),
  round: z.string().trim().min(2).default('Technical Interview'),
  interviewer: z.string().trim().min(2).default('Engineering Team Lead'),
  scheduledAt: z.coerce.date(),
  durationMinutes: z.number().int().min(15).max(180).default(45),
  meetingLink: z.string().url().optional().default('https://meet.google.com/ej-interview-loop'),
  status: z.enum(['Scheduled', 'Completed', 'Cancelled']).default('Scheduled')
});

export const updateInterviewSchema = z.object({
  round: z.string().trim().min(2).optional(),
  interviewer: z.string().trim().min(2).optional(),
  scheduledAt: z.coerce.date().optional(),
  durationMinutes: z.number().int().min(15).max(180).optional(),
  meetingLink: z.string().url().optional(),
  status: z.enum(['Scheduled', 'Completed', 'Cancelled']).optional(),
  feedback: z.string().trim().max(2000).optional(),
  rating: z.number().min(0).max(5).optional()
});

export type CreateInterviewInput = z.infer<typeof createInterviewSchema>;
export type UpdateInterviewInput = z.infer<typeof updateInterviewSchema>;
