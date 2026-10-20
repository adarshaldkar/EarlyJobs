import { apiClient, ApiSuccess } from '../../lib/api';
import {
  Candidate,
  CandidateCreateInput,
  CandidateListResult,
  CandidateQuery,
  HiringStage
} from './types';

export async function getCandidates(
  query: CandidateQuery
): Promise<CandidateListResult> {
  const response = await apiClient.get<ApiSuccess<CandidateListResult>>(
    '/candidates',
    { params: query }
  );
  return response.data.data;
}

export async function createCandidate(
  input: CandidateCreateInput
): Promise<Candidate> {
  const response = await apiClient.post<ApiSuccess<Candidate>>(
    '/candidates',
    input
  );
  return response.data.data;
}

export async function updateCandidateStage(
  id: string,
  currentStage: HiringStage,
  newStage: HiringStage
): Promise<Candidate> {
  const response = await apiClient.patch<ApiSuccess<Candidate>>(
    '/candidates/' + id + '/stage',
    { currentStage, newStage }
  );
  return response.data.data;
}
