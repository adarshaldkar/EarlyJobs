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

export interface ExtractedLink {
  label: string;
  url: string;
  type: 'linkedin' | 'github' | 'portfolio' | 'website' | 'leetcode' | 'codeforces' | 'other';
  sourcePage: number;
  source: 'pdf_annotation' | 'visible_url' | 'text_label_only';
  status?: 'valid' | 'needs_input' | 'unverified';
}

export interface WorkExperience {
  company: string;
  title: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  responsibilities: string[];
  technologies: string[];
  sourcePage?: number;
}

export interface EducationRecord {
  institution: string;
  degree: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  grade?: string;
  sourcePage?: number;
}

export interface ResumeDocumentMeta {
  storageKey: string;
  originalFilename: string;
  mimeType: 'application/pdf';
  sizeBytes: number;
  sha256: string;
  url: string;
  pageCount: number;
}

export interface FieldEvidence {
  field: string;
  value: any;
  confidence: number;
  sourcePage: number;
  sourceText?: string;
  status: 'high' | 'needs_review' | 'low';
}

export interface ResumeParsingResult {
  status: 'ready' | 'needs_review' | 'failed';
  confidence: number;
  warnings: string[];
  extractedAt: string;
  document: ResumeDocumentMeta;
  extracted: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    position: string;
    headline?: string;
    summary?: string;
    experienceYears: number;
    skills: string[];
    skillCategories?: {
      programmingLanguages: string[];
      frameworks: string[];
      databases: string[];
      tools: string[];
      otherSkills: string[];
    };
    links: ExtractedLink[];
    workExperience: WorkExperience[];
    education: EducationRecord[];
    projects?: any[];
    certifications?: any[];
  };
  fieldEvidence: FieldEvidence[];
}

export type ActivityType =
  | 'stage_changed'
  | 'note_added'
  | 'interview_scheduled'
  | 'resume_uploaded'
  | 'profile_updated';

export interface ActivityLog {
  type: ActivityType;
  title: string;
  description?: string;
  fromStage?: string | null;
  toStage?: string | null;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface Candidate {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  position: string;
  jobId?: string;
  headline?: string;
  summary?: string;
  location?: string;
  experienceYears: number;
  skills: string[];
  resumeUrl?: string;
  notes?: string;
  rating?: number;
  tags?: string[];
  links?: ExtractedLink[];
  workExperience?: WorkExperience[];
  education?: EducationRecord[];
  resumeMetadata?: ResumeDocumentMeta;
  parsingStatus?: 'uploaded' | 'needs_review' | 'ready' | 'failed';
  stage: HiringStage;
  stageHistory: StageHistoryEntry[];
  activities?: ActivityLog[];
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

