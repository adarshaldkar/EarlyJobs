import { Request, Response } from 'express';

export const STAGES_METADATA = [
  { id: 'Applied', label: 'Applied', color: '#64748B' },
  { id: 'Screening', label: 'Screening', color: '#D97706' },
  { id: 'Interview', label: 'Interview', color: '#2563EB' },
  { id: 'Offer', label: 'Offer', color: '#7C3AED' },
  { id: 'Hired', label: 'Hired', color: '#059669' },
  { id: 'Rejected', label: 'Rejected', color: '#DC2626' }
] as const;

export class MetaController {
  static getStages(_req: Request, res: Response): void {
    res.status(200).json({
      success: true,
      data: STAGES_METADATA
    });
  }
}
