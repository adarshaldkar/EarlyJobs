import React, { useState } from 'react';
import {
  MoreVertical,
  ExternalLink,
  Trash2,
  ChevronLeft,
  ChevronRight,
  User,
  Clock,
  Briefcase,
  Star
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
        className="text-center py-16 px-4 border border-dashed border-slate-200 bg-white rounded-2xl shadow-sm"
      >
        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center mx-auto text-slate-400">
          <User className="h-6 w-6 stroke-[1.5]" />
        </div>
        <h3 className="mt-3 text-sm font-bold text-slate-900">No candidates found</h3>
        <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
          No applicants match your current search or filter criteria. Try adjusting your query or clear filters.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-slate-200/80 bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs" data-testid="candidates-table">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/70 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
              <th scope="col" className="px-5 py-3.5">Candidate</th>
              <th scope="col" className="px-4 py-3.5">Position</th>
              <th scope="col" className="px-4 py-3.5 hidden md:table-cell">Experience</th>
              <th scope="col" className="px-4 py-3.5 hidden md:table-cell">Applied</th>
              <th scope="col" className="px-4 py-3.5">Stage</th>
              <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && candidates.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-xs text-slate-400">
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
                    className={`hover:bg-slate-50/80 transition-colors group ${
                      isRowUpdating || isRowDeleting ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    {/* Candidate Info */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-xs shadow-2xs shrink-0 tracking-tight">
                          {getInitials(candidate.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onSelectCandidate(candidate)}
                              data-testid={`candidate-name-link-${candidate._id}`}
                              className="font-medium font-semibold text-slate-900 hover:text-indigo-600 hover:underline text-left truncate block max-w-[200px] text-xs transition-colors cursor-pointer"
                            >
                              {candidate.name}
                            </button>
                            {Boolean(candidate.rating && candidate.rating > 0) && (
                              <div className="flex items-center text-amber-500" title={`Rating: ${candidate.rating}/5`}>
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={`w-2.5 h-2.5 ${
                                      s <= (candidate.rating || 0)
                                        ? 'fill-amber-400 text-amber-400'
                                        : 'text-slate-200'
                                    }`}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 truncate block max-w-[200px]">
                            {candidate.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Position & Tags */}
                    <td className="px-4 py-3.5 whitespace-nowrap font-normal">
                      <div className="text-slate-900 text-xs font-semibold">{candidate.position}</div>
                      {candidate.tags && candidate.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {candidate.tags.slice(0, 2).map((t, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200/60"
                            >
                              {t}
                            </span>
                          ))}
                          {candidate.tags.length > 2 && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              +{candidate.tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Experience */}
                    <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap tabular-nums hidden md:table-cell">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 text-[11px] font-semibold border border-slate-200/80">
                        {candidate.experienceYears} {candidate.experienceYears === 1 ? 'yr' : 'yrs'}
                      </span>
                    </td>

                    {/* Applied Date */}
                    <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap tabular-nums text-xs hidden md:table-cell">
                      {formatDate(candidate.createdAt)}
                    </td>

                    {/* Stage Selector */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <select
                          value={candidate.stage}
                          onChange={(e) => handleStageChange(candidate, e.target.value as HiringStage)}
                          disabled={isRowUpdating}
                          data-testid={`stage-select-${candidate._id}`}
                          aria-label={`Update stage for ${candidate.name}`}
                          className="px-2.5 py-1 text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer transition-colors"
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
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => onSelectCandidate(candidate)}
                          data-testid={`view-candidate-btn-${candidate._id}`}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="View Details"
                          aria-label={`View ${candidate.name} details`}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(candidate)}
                          data-testid={`delete-candidate-btn-${candidate._id}`}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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
      <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div className="tabular-nums">
          Showing{' '}
          <span className="font-bold text-slate-900">
            {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}
          </span>{' '}
          to{' '}
          <span className="font-bold text-slate-900">
            {Math.min(pagination.page * pagination.limit, pagination.total)}
          </span>{' '}
          of <span className="font-bold text-slate-900">{pagination.total}</span> candidates
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1 || isLoading}
            data-testid="pagination-prev-btn"
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 font-medium transition-all shadow-2xs cursor-pointer"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Previous
          </button>
          <span className="tabular-nums text-xs px-2 font-medium text-slate-600">
            Page <span className="font-bold text-slate-900">{pagination.page}</span> of <span className="font-bold text-slate-900">{Math.max(1, pagination.totalPages)}</span>
          </span>
          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages || isLoading}
            data-testid="pagination-next-btn"
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 font-medium transition-all shadow-2xs cursor-pointer"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
