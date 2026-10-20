export const HIRING_STAGES = [
  'Applied',
  'Screening',
  'Interview',
  'Offer',
  'Hired',
  'Rejected'
] as const;

export type HiringStage = (typeof HIRING_STAGES)[number];

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

export interface CandidatePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore?: boolean;
}

export interface CandidateListResponse {
  items: Candidate[];
  pagination: CandidatePagination;
}

export interface DashboardSummary {
  totalCandidates: number;
  activePipeline: number;
  inInterview: number;
  hired: number;
  stageCounts: Record<HiringStage, number>;
}

export interface StageMeta {
  key: HiringStage;
  label: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
