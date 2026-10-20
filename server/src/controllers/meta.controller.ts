import { Request, Response } from 'express';

export const STAGES_METADATA = [
  { key: 'Applied', id: 'Applied', label: 'Applied', color: '#78716C', badgeBg: 'bg-stone-50', badgeText: 'text-stone-700', badgeBorder: 'border-stone-200' },
  { key: 'Screening', id: 'Screening', label: 'Screening', color: '#0284C7', badgeBg: 'bg-sky-50', badgeText: 'text-sky-700', badgeBorder: 'border-sky-200' },
  { key: 'Interview', id: 'Interview', label: 'Interview', color: '#D97706', badgeBg: 'bg-amber-50', badgeText: 'text-amber-700', badgeBorder: 'border-amber-200' },
  { key: 'Offer', id: 'Offer', label: 'Offer', color: '#7C3AED', badgeBg: 'bg-purple-50', badgeText: 'text-purple-700', badgeBorder: 'border-purple-200' },
  { key: 'Hired', id: 'Hired', label: 'Hired', color: '#059669', badgeBg: 'bg-emerald-50', badgeText: 'text-emerald-700', badgeBorder: 'border-emerald-200' },
  { key: 'Rejected', id: 'Rejected', label: 'Rejected', color: '#E11D48', badgeBg: 'bg-rose-50', badgeText: 'text-rose-700', badgeBorder: 'border-rose-200' }
] as const;

export class MetaController {
  static getStages(_req: Request, res: Response): void {
    res.status(200).json({
      success: true,
      data: STAGES_METADATA
    });
  }
}
