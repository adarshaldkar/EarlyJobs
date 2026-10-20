import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createCandidate,
  getCandidates,
  updateCandidateStage
} from './candidateApi';
import { CandidateCreateInput, CandidateQuery, HiringStage } from './types';

export const candidateKeys = {
  all: ['candidates'] as const,
  list: (query: CandidateQuery) => ['candidates', 'list', query] as const
};

export function useCandidates(query: CandidateQuery) {
  return useQuery({
    queryKey: candidateKeys.list(query),
    queryFn: () => getCandidates(query)
  });
}

export function useCreateCandidate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CandidateCreateInput) => createCandidate(input),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: candidateKeys.all });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });
}

export function useUpdateCandidateStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      id: string;
      currentStage: HiringStage;
      newStage: HiringStage;
    }) =>
      updateCandidateStage(input.id, input.currentStage, input.newStage),
    onSettled: async () => {
      // Refetch after success or conflict. In particular, a 409 means the
      // server has newer state than the current screen.
      await queryClient.invalidateQueries({ queryKey: candidateKeys.all });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });
}
