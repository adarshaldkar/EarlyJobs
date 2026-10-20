import axios, { AxiosError } from 'axios';
import {
  ApiResponse,
  Candidate,
  CandidateListResponse,
  DashboardSummary,
  ExtractedLink,
  HiringStage,
  Interview,
  Job,
  ResumeDocumentMeta,
  ResumeParsingResult,
  StageMeta,
  WorkExperience,
  EducationRecord
} from '../types';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export interface CreateCandidateInput {
  name: string;
  email: string;
  phone?: string;
  position: string;
  headline?: string;
  summary?: string;
  location?: string;
  experienceYears: number;
  skills?: string[];
  resumeUrl?: string;
  notes?: string;
  rating?: number;
  tags?: string[];
  stage?: HiringStage;
  links?: ExtractedLink[];
  workExperience?: WorkExperience[];
  education?: EducationRecord[];
  resumeMetadata?: ResumeDocumentMeta;
  parsingStatus?: 'uploaded' | 'needs_review' | 'ready' | 'failed';
}

export interface CandidateQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  position?: string;
  stage?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function fetchCandidates(params?: CandidateQueryParams): Promise<CandidateListResponse> {
  const response = await apiClient.get<ApiResponse<CandidateListResponse>>('/candidates', {
    params
  });
  return response.data.data;
}

export async function fetchCandidate(id: string): Promise<Candidate> {
  const response = await apiClient.get<ApiResponse<Candidate>>(`/candidates/${id}`);
  return response.data.data;
}

export async function createCandidate(payload: CreateCandidateInput): Promise<Candidate> {
  const response = await apiClient.post<ApiResponse<Candidate>>('/candidates', payload);
  return response.data.data;
}

export async function updateCandidate(
  id: string,
  data: Partial<Omit<Candidate, '_id' | 'email' | 'stage' | 'stageHistory' | 'createdAt' | 'updatedAt'>>
): Promise<Candidate> {
  const response = await apiClient.patch<ApiResponse<Candidate>>(`/candidates/${id}`, data);
  return response.data.data;
}

export async function addCandidateNote(
  id: string,
  note: string,
  category?: string
): Promise<Candidate> {
  const response = await apiClient.post<ApiResponse<Candidate>>(`/candidates/${id}/notes`, {
    note,
    category
  });
  return response.data.data;
}

export async function updateCandidateStage(
  id: string,
  currentStage: HiringStage,
  newStage: HiringStage,
  notes?: string
): Promise<Candidate> {
  const response = await apiClient.patch<ApiResponse<Candidate>>(`/candidates/${id}/stage`, {
    currentStage,
    newStage,
    notes
  });
  return response.data.data;
}

export async function deleteCandidate(id: string): Promise<void> {
  await apiClient.delete<ApiResponse<{ deleted: boolean }>>(`/candidates/${id}`);
}

export async function uploadCandidateResume(id: string, file: File): Promise<Candidate> {
  const formData = new FormData();
  formData.append('resume', file);
  const response = await apiClient.post<ApiResponse<Candidate>>(`/candidates/${id}/resume`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data.data;
}

export async function parseCandidateResume(file: File): Promise<ResumeParsingResult> {
  const formData = new FormData();
  formData.append('resume', file);
  const response = await apiClient.post<ApiResponse<ResumeParsingResult>>('/candidates/parse-resume', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data.data;
}

// Jobs API
export async function fetchJobs(params?: { status?: string; search?: string }): Promise<Job[]> {
  const response = await apiClient.get<ApiResponse<Job[]>>('/jobs', { params });
  return response.data.data;
}

export async function fetchJob(id: string): Promise<Job> {
  const response = await apiClient.get<ApiResponse<Job>>(`/jobs/${id}`);
  return response.data.data;
}

export async function createJob(data: Partial<Job>): Promise<Job> {
  const response = await apiClient.post<ApiResponse<Job>>('/jobs', data);
  return response.data.data;
}

export async function updateJob(id: string, data: Partial<Job>): Promise<Job> {
  const response = await apiClient.patch<ApiResponse<Job>>(`/jobs/${id}`, data);
  return response.data.data;
}

export async function deleteJob(id: string): Promise<void> {
  await apiClient.delete<ApiResponse<{ deleted: boolean }>>(`/jobs/${id}`);
}

// Interviews API
export async function fetchInterviews(params?: { status?: string; candidateId?: string }): Promise<Interview[]> {
  const response = await apiClient.get<ApiResponse<Interview[]>>('/interviews', { params });
  return response.data.data;
}

export async function createInterview(data: Partial<Interview>): Promise<Interview> {
  const response = await apiClient.post<ApiResponse<Interview>>('/interviews', data);
  return response.data.data;
}

export async function updateInterview(id: string, data: Partial<Interview>): Promise<Interview> {
  const response = await apiClient.patch<ApiResponse<Interview>>(`/interviews/${id}`, data);
  return response.data.data;
}

export async function deleteInterview(id: string): Promise<void> {
  await apiClient.delete<ApiResponse<{ deleted: boolean }>>(`/interviews/${id}`);
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const response = await apiClient.get<ApiResponse<DashboardSummary>>('/dashboard/summary');
  return response.data.data;
}

export async function fetchStageMeta(): Promise<StageMeta[]> {
  const response = await apiClient.get<ApiResponse<StageMeta[]>>('/meta/stages');
  return response.data.data;
}

/**
 * Extracts a user-friendly error message from Axios errors.
 */
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const serverMessage = error.response?.data?.error?.message;
    if (serverMessage) return serverMessage;
    if (error.response?.status === 409) {
      return 'Conflict: Record was modified elsewhere or already exists.';
    }
    if (error.response?.status === 404) {
      return 'The requested record was not found.';
    }
    return error.message || 'Network request failed';
  }
  return error instanceof Error ? error.message : 'An unexpected error occurred';
}
