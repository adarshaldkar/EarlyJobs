export const HIRING_STAGES = [
  'Applied',
  'Screening',
  'Interview',
  'Offer',
  'Hired',
  'Rejected'
] as const;

export type HiringStage = (typeof HIRING_STAGES)[number];
export type CandidateStageFilter = HiringStage | 'All';

export interface StageHistoryEntry {
  from: HiringStage | null;
  to: HiringStage;
  changedAt: string;
  notes?: string;
}

export interface Candidate {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  position: string;
  experienceYears: number;
  skills: string[];
  resumeUrl?: string;
  notes?: string;
  stage: HiringStage;
  stageHistory: StageHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface CandidateCreateInput {
  name: string;
  email: string;
  phone?: string;
  position: string;
  experienceYears: number;
  skills: string[];
  resumeUrl?: string;
}

export interface CandidateQuery {
  page: number;
  limit: number;
  search?: string;
  stage?: HiringStage;
  sortBy: 'createdAt' | 'name' | 'experienceYears';
  sortOrder: 'asc' | 'desc';
}

export interface CandidateListResult {
  items: Candidate[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
