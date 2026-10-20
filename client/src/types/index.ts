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
  rating?: number;
  tags?: string[];
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
  total: number;
  totalCandidates: number;
  activePipeline: number;
  interviewing: number;
  inInterview: number;
  hired: number;
  rejected?: number;
  stageCounts: Record<HiringStage, number>;
  recentCandidates?: Candidate[];
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

export interface Job {
  _id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  status: 'Open' | 'Closed' | 'Draft' | 'On Hold';
  experienceMin?: number;
  experienceMax?: number;
  openingsCount: number;
  applicantCount?: number;
  description: string;
  requirements: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Interview {
  _id: string;
  candidateId?: string;
  candidateName: string;
  candidateEmail: string;
  position: string;
  round: string;
  interviewer: string;
  scheduledAt: string;
  durationMinutes: number;
  meetingLink?: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled';
  feedback?: string;
  rating?: number;
  createdAt: string;
  updatedAt: string;
}

