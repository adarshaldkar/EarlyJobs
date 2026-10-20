import React, { useState } from 'react';
import {
  MoreVertical,
  ExternalLink,
  Trash2,
  ChevronLeft,
  ChevronRight,
  User,
  Clock,
  Briefcase
} from 'lucide-react';
import { Candidate, HIRING_STAGES, HiringStage, CandidatePagination } from '../../types';
import { updateCandidateStage, deleteCandidate, getApiErrorMessage } from '../../lib/api';
import { StageBadge } from '../../components/StageBadge';
import { useToast } from '../../components/Toast';

interface CandidateTableProps {
  candidates: Candidate[];
  pagination: CandidatePagination;
  onPageChange: (newPage: number) => void;
  onSelectCandidate: (candidate: Candidate) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const CandidateTable: React.FC<CandidateTableProps> = ({
  candidates,
  pagination,
  onPageChange,
  onSelectCandidate,
  onRefresh,
  isLoading
}) => {
  const { showToast } = useToast();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleStageChange = async (candidate: Candidate, newStage: HiringStage) => {
    if (candidate.stage === newStage) return;

    try {
      setUpdatingId(candidate._id);
      await updateCandidateStage(candidate._id, candidate.stage, newStage);
      showToast(`${candidate.name} moved to ${newStage}`, 'success');
      onRefresh();
    } catch (err: any) {
      if (err.response?.status === 409) {
        showToast('Candidate was updated in another session. Refreshed.', 'warning');
      } else {
        showToast(getApiErrorMessage(err), 'error');
      }
      onRefresh();
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (candidate: Candidate) => {
    if (!window.confirm(`Are you sure you want to delete ${candidate.name}?`)) {
      return;
    }

    try {
      setDeletingId(candidate._id);
      await deleteCandidate(candidate._id);
      showToast(`${candidate.name} was removed.`, 'info');
      onRefresh();
    } catch (err: any) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  if (!isLoading && candidates.length === 0) {
    return (
      <div
        data-testid="empty-candidates-state"
        className="text-center py-12 px-4 border border-subtle bg-surface rounded"
      >
        <User className="mx-auto h-8 w-8 text-ink-tertiary stroke-[1.5]" />
        <h3 className="mt-2 text-xs font-semibold text-ink-primary">No candidates found</h3>
        <p className="mt-1 text-xs text-ink-secondary">
          No applicants match your current search or filter criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-subtle bg-surface rounded overflow-hidden shadow-none">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs" data-testid="candidates-table">
          <thead>
            <tr className="border-b border-subtle bg-stone-50/70 text-ink-secondary font-medium">
              <th scope="col" className="px-4 py-3 font-semibold">Candidate</th>
              <th scope="col" className="px-4 py-3 font-semibold">Position</th>
              <th scope="col" className="px-4 py-3 font-semibold">Experience</th>
              <th scope="col" className="px-4 py-3 font-semibold">Applied</th>
              <th scope="col" className="px-4 py-3 font-semibold">Stage</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle">
            {isLoading && candidates.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-xs text-ink-secondary">
                  Loading candidates...
                </td>
              </tr>
            ) : (
              candidates.map((candidate) => {
                const isRowUpdating = updatingId === candidate._id;
                const isRowDeleting = deletingId === candidate._id;

                return (
                  <tr
                    key={candidate._id}
                    data-testid={`candidate-row-${candidate._id}`}
                    className={`hover:bg-stone-50/80 transition-colors ${
                      isRowUpdating || isRowDeleting ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    {/* Candidate Info */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-stone-200 text-ink-primary font-semibold flex items-center justify-center text-[11px] flex-shrink-0">
                          {getInitials(candidate.name)}
                        </div>
                        <div className="min-w-0">
                          <button
                            onClick={() => onSelectCandidate(candidate)}
                            data-testid={`candidate-name-link-${candidate._id}`}
                            className="font-medium text-ink-primary hover:text-accent hover:underline text-left truncate block max-w-[200px]"
                          >
                            {candidate.name}
                          </button>
                          <span className="text-[11px] text-ink-secondary truncate block max-w-[200px]">
                            {candidate.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Position */}
                    <td className="px-4 py-3 text-ink-primary whitespace-nowrap font-normal">
                      {candidate.position}
                    </td>

                    {/* Experience */}
                    <td className="px-4 py-3 text-ink-secondary whitespace-nowrap tabular-nums">
                      <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 text-[11px] font-medium border border-stone-200">
                        {candidate.experienceYears} {candidate.experienceYears === 1 ? 'yr' : 'yrs'}
                      </span>
                    </td>

                    {/* Applied Date */}
                    <td className="px-4 py-3 text-ink-secondary whitespace-nowrap tabular-nums">
                      {formatDate(candidate.createdAt)}
                    </td>

                    {/* Stage Selector */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <select
                          value={candidate.stage}
                          onChange={(e) => handleStageChange(candidate, e.target.value as HiringStage)}
                          disabled={isRowUpdating}
                          data-testid={`stage-select-${candidate._id}`}
                          aria-label={`Update stage for ${candidate.name}`}
                          className="px-2 py-1 text-xs bg-canvas border border-subtle rounded text-ink-primary font-medium focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent cursor-pointer"
                        >
                          {HIRING_STAGES.map((stg) => (
                            <option key={stg} value={stg}>
                              {stg}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => onSelectCandidate(candidate)}
                          data-testid={`view-candidate-btn-${candidate._id}`}
                          className="p-1.5 text-ink-secondary hover:text-accent hover:bg-stone-100 rounded transition-colors"
                          title="View Details"
                          aria-label={`View ${candidate.name} details`}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(candidate)}
                          data-testid={`delete-candidate-btn-${candidate._id}`}
                          className="p-1.5 text-ink-secondary hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Delete Candidate"
                          aria-label={`Delete ${candidate.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-4 py-3 border-t border-subtle bg-surface flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-secondary">
        <div className="tabular-nums">
          Showing{' '}
          <span className="font-medium text-ink-primary">
            {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}
          </span>{' '}
          to{' '}
          <span className="font-medium text-ink-primary">
            {Math.min(pagination.page * pagination.limit, pagination.total)}
          </span>{' '}
          of <span className="font-medium text-ink-primary">{pagination.total}</span> candidates
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1 || isLoading}
            data-testid="pagination-prev-btn"
            className="px-2.5 py-1 rounded border border-subtle text-ink-secondary hover:text-ink-primary hover:bg-stone-100 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Previous
          </button>
          <span className="tabular-nums text-xs px-1">
            Page {pagination.page} of {Math.max(1, pagination.totalPages)}
          </span>
          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages || isLoading}
            data-testid="pagination-next-btn"
            className="px-2.5 py-1 rounded border border-subtle text-ink-secondary hover:text-ink-primary hover:bg-stone-100 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 transition-colors"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
