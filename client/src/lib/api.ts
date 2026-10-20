import axios, { AxiosError } from 'axios';
import {
  ApiResponse,
  Candidate,
  CandidateListResponse,
  DashboardSummary,
  HiringStage,
  StageMeta
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
  experienceYears: number;
  skills?: string[];
  resumeUrl?: string;
  notes?: string;
  stage?: HiringStage;
}

export interface CandidateQueryParams {
  page?: number;
  limit?: number;
  search?: string;
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
