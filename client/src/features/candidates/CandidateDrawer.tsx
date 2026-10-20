import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Phone,
  Briefcase,
  Clock,
  ExternalLink,
  Trash2,
  Calendar,
  FileText,
  Tag
} from 'lucide-react';
import { Candidate, HIRING_STAGES, HiringStage } from '../../types';
import { StageBadge } from '../../components/StageBadge';
import { updateCandidateStage, deleteCandidate, getApiErrorMessage } from '../../lib/api';
import { useToast } from '../../components/Toast';

interface CandidateDrawerProps {
  candidate: Candidate | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onCandidateUpdated?: (candidate: Candidate) => void;
}

export const CandidateDrawer: React.FC<CandidateDrawerProps> = ({
  candidate: initialCandidate,
  isOpen,
  onClose,
  onRefresh,
  onCandidateUpdated
}) => {
  const { showToast } = useToast();
  const [candidate, setCandidate] = useState<Candidate | null>(initialCandidate);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setCandidate(initialCandidate);
  }, [initialCandidate]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !candidate) return null;

  const handleStageChange = async (newStage: HiringStage) => {
    if (candidate.stage === newStage) return;

    try {
      setIsUpdating(true);
      const updated = await updateCandidateStage(candidate._id, candidate.stage, newStage);
      setCandidate(updated);
      onCandidateUpdated?.(updated);
      showToast(`Moved ${candidate.name} to ${newStage}`, 'success');
      onRefresh();
    } catch (err: any) {
      if (err.response?.status === 409) {
        showToast('Candidate was updated in another session. Refreshed.', 'warning');
      } else {
        showToast(getApiErrorMessage(err), 'error');
      }
      onRefresh();
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${candidate.name}?`)) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteCandidate(candidate._id);
      showToast(`${candidate.name} was removed.`, 'info');
      onClose();
      onRefresh();
    } catch (err: any) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-ink-primary/30 backdrop-blur-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-surface border-l border-subtle shadow-xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-subtle flex items-start justify-between bg-stone-50/50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-stone-200 text-ink-primary font-semibold flex items-center justify-center text-sm">
                {candidate.name
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </div>
              <div>
                <h2 id="drawer-title" className="text-sm font-semibold text-ink-primary">
                  {candidate.name}
                </h2>
                <p className="text-xs text-ink-secondary">{candidate.position}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              data-testid="close-drawer-btn"
              className="text-ink-tertiary hover:text-ink-primary p-1 rounded transition-colors"
              aria-label="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
            {/* Quick Stage Transition Selector */}
            <div className="p-3.5 rounded border border-subtle bg-canvas space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink-primary text-xs">Current Stage</span>
                <StageBadge stage={candidate.stage} />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <label className="text-ink-secondary text-[11px]">Move stage to:</label>
                <select
                  value={candidate.stage}
                  onChange={(e) => handleStageChange(e.target.value as HiringStage)}
                  disabled={isUpdating}
                  data-testid="drawer-stage-select"
                  className="flex-1 px-2 py-1 text-xs bg-surface border border-subtle rounded text-ink-primary font-medium focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  {HIRING_STAGES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Candidate Contact & Info */}
            <div className="space-y-3">
              <h3 className="font-semibold text-ink-primary uppercase tracking-wider text-[11px] text-ink-tertiary">
                Contact & Details
              </h3>
              <div className="space-y-2 text-ink-secondary">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-ink-tertiary" />
                  <a
                    href={`mailto:${candidate.email}`}
                    className="text-ink-primary hover:text-accent hover:underline"
                  >
                    {candidate.email}
                  </a>
                </div>
                {candidate.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-ink-tertiary" />
                    <span>{candidate.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-ink-tertiary" />
                  <span>
                    Experience: {candidate.experienceYears}{' '}
                    {candidate.experienceYears === 1 ? 'year' : 'years'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-ink-tertiary" />
                  <span>Applied on {formatTimestamp(candidate.createdAt)}</span>
                </div>
                {candidate.resumeUrl && (
                  <div className="flex items-center gap-2 pt-1">
                    <ExternalLink className="w-3.5 h-3.5 text-accent" />
                    <a
                      href={candidate.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline font-medium"
                    >
                      View External Resume
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Skills */}
            {candidate.skills && candidate.skills.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold uppercase tracking-wider text-[11px] text-ink-tertiary">
                  Tagged Skills
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200 text-[11px]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recruiter Notes */}
            {candidate.notes && (
              <div className="space-y-2">
                <h3 className="font-semibold uppercase tracking-wider text-[11px] text-ink-tertiary">
                  Recruiter Notes
                </h3>
                <div className="p-3 bg-canvas border border-subtle rounded text-ink-primary leading-relaxed whitespace-pre-wrap">
                  {candidate.notes}
                </div>
              </div>
            )}

            {/* Stage History Timeline */}
            <div className="space-y-3 pt-2">
              <h3 className="font-semibold uppercase tracking-wider text-[11px] text-ink-tertiary flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Stage History Audit Trail
              </h3>
              <div
                data-testid="stage-history-timeline"
                className="relative pl-4 space-y-4 before:absolute before:bottom-0 before:top-2 before:left-1.5 before:w-0.5 before:bg-subtle"
              >
                {candidate.stageHistory.map((item, index) => (
                  <div key={index} className="relative group">
                    <div className="absolute -left-[19px] top-1 h-2.5 w-2.5 rounded-full border-2 border-surface bg-accent" />
                    <div className="bg-surface border border-subtle rounded p-2.5 space-y-1">
                      <div className="flex items-center justify-between font-medium text-ink-primary">
                        <span>
                          {item.from ? `${item.from} → ${item.to}` : `Initial: ${item.to}`}
                        </span>
                        <span className="text-[10px] text-ink-tertiary">
                          {formatTimestamp(item.changedAt)}
                        </span>
                      </div>
                      {item.notes && (
                        <p className="text-[11px] text-ink-secondary italic">{item.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="p-4 border-t border-subtle bg-stone-50/50 flex items-center justify-between">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              data-testid="drawer-delete-candidate-btn"
              className="px-3 py-1.5 text-xs text-rose-700 hover:text-rose-800 hover:bg-rose-50 rounded border border-rose-200 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Candidate
            </button>

            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-ink-secondary hover:text-ink-primary bg-surface hover:bg-stone-100 rounded border border-subtle transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
