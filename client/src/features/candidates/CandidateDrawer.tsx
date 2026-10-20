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
  Tag,
  Star,
  Check,
  ChevronRight,
  Send,
  MessageSquare,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { Candidate, HIRING_STAGES, HiringStage } from '../../types';
import { StageBadge } from '../../components/StageBadge';
import {
  updateCandidateStage,
  updateCandidate,
  addCandidateNote,
  deleteCandidate,
  getApiErrorMessage
} from '../../lib/api';
import { useToast } from '../../components/Toast';

interface CandidateDrawerProps {
  candidate: Candidate | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onCandidateUpdated?: (candidate: Candidate) => void;
}

const LINEAR_STAGES: HiringStage[] = [
  'Applied',
  'Screening',
  'Interview',
  'Offer',
  'Hired'
];

const STAGE_NEXT_MAP: Record<HiringStage, HiringStage | null> = {
  Applied: 'Screening',
  Screening: 'Interview',
  Interview: 'Offer',
  Offer: 'Hired',
  Hired: null,
  Rejected: null
};

const NOTE_CATEGORIES = [
  'General Note',
  'Phone Screen',
  'Technical Interview',
  'Culture Fit',
  'Offer Discussion',
  'Reference Check'
];

const COMMON_TAGS = [
  'Top Talent',
  'Referral',
  'Immediate Joiner',
  'High Priority',
  'Strong Communicator',
  'Ex-FAANG'
];

export const CandidateDrawer: React.FC<CandidateDrawerProps> = ({
  candidate: initialCandidate,
  isOpen,
  onClose,
  onRefresh,
  onCandidateUpdated
}) => {
  const { showToast } = useToast();
  const [candidate, setCandidate] = useState<Candidate | null>(initialCandidate);
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Note composer state
  const [noteCategory, setNoteCategory] = useState('General Note');
  const [noteText, setNoteText] = useState('');
  const [isPostingNote, setIsPostingNote] = useState(false);

  // Tag input state
  const [newTagInput, setNewTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

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

  const currentStageIndex = LINEAR_STAGES.indexOf(candidate.stage);
  const isRejected = candidate.stage === 'Rejected';
  const nextStage = STAGE_NEXT_MAP[candidate.stage];

  const handleStageChange = async (newStage: HiringStage) => {
    if (candidate.stage === newStage) return;

    try {
      setIsUpdatingStage(true);
      const updated = await updateCandidateStage(candidate._id, candidate.stage, newStage);
      setCandidate(updated);
      onCandidateUpdated?.(updated);
      showToast(`Moved ${candidate.name} to ${newStage}`, 'success');
      onRefresh();
    } catch (err: any) {
      if (err.response?.status === 409) {
        showToast('Candidate was updated elsewhere. Refreshed.', 'warning');
      } else {
        showToast(getApiErrorMessage(err), 'error');
      }
      onRefresh();
    } finally {
      setIsUpdatingStage(false);
    }
  };

  const handleRatingChange = async (newRating: number) => {
    try {
      setIsUpdatingProfile(true);
      const updated = await updateCandidate(candidate._id, { rating: newRating });
      setCandidate(updated);
      onCandidateUpdated?.(updated);
      showToast(`Updated rating for ${candidate.name} to ${newRating} stars`, 'success');
      onRefresh();
    } catch (err: any) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleAddTag = async (tagToAdd: string) => {
    const trimmed = tagToAdd.trim();
    if (!trimmed) return;
    const currentTags = candidate.tags || [];
    if (currentTags.includes(trimmed)) return;

    const updatedTags = [...currentTags, trimmed];
    try {
      setIsUpdatingProfile(true);
      const updated = await updateCandidate(candidate._id, { tags: updatedTags });
      setCandidate(updated);
      onCandidateUpdated?.(updated);
      setNewTagInput('');
      setIsAddingTag(false);
      showToast(`Tag added`, 'success');
      onRefresh();
    } catch (err: any) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const updatedTags = (candidate.tags || []).filter((t) => t !== tagToRemove);
    try {
      setIsUpdatingProfile(true);
      const updated = await updateCandidate(candidate._id, { tags: updatedTags });
      setCandidate(updated);
      onCandidateUpdated?.(updated);
      showToast(`Tag removed`, 'info');
      onRefresh();
    } catch (err: any) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePostNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    try {
      setIsPostingNote(true);
      const updated = await addCandidateNote(candidate._id, noteText.trim(), noteCategory);
      setCandidate(updated);
      onCandidateUpdated?.(updated);
      setNoteText('');
      showToast('Interview feedback logged to timeline', 'success');
      onRefresh();
    } catch (err: any) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setIsPostingNote(false);
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
        <div className="w-screen max-w-lg bg-surface border-l border-subtle shadow-xl flex flex-col">
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
            {/* Visual Stage Stepper Bar */}
            <div className="p-3.5 rounded border border-subtle bg-canvas space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink-primary text-xs uppercase tracking-wider text-ink-tertiary">
                  Hiring Pipeline Progression
                </span>
                <StageBadge stage={candidate.stage} />
              </div>

              {/* Stepper Chevrons */}
              {!isRejected ? (
                <div
                  data-testid="stage-stepper-bar"
                  className="grid grid-cols-5 gap-1 pt-1"
                >
                  {LINEAR_STAGES.map((stg, idx) => {
                    const isPassed = currentStageIndex > idx;
                    const isCurrent = currentStageIndex === idx;

                    return (
                      <button
                        key={stg}
                        onClick={() => handleStageChange(stg)}
                        disabled={isUpdatingStage}
                        data-testid={`stepper-step-${stg.toLowerCase()}`}
                        className={`py-1.5 px-1 rounded text-[11px] font-medium text-center flex items-center justify-center gap-1 transition-all border ${
                          isCurrent
                            ? 'bg-accent text-white border-accent shadow-xs'
                            : isPassed
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-surface text-ink-tertiary border-subtle hover:text-ink-primary hover:bg-stone-50'
                        }`}
                        title={`Move candidate to ${stg}`}
                      >
                        {isPassed && <Check className="w-3 h-3 text-emerald-600" />}
                        <span className="truncate">{stg}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span className="font-medium text-xs">Candidate is currently marked as Rejected</span>
                  </div>
                  <button
                    onClick={() => handleStageChange('Screening')}
                    disabled={isUpdatingStage}
                    className="px-2 py-1 text-[11px] font-medium bg-surface hover:bg-white text-ink-primary border border-subtle rounded flex items-center gap-1 shadow-xs transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reopen Candidate
                  </button>
                </div>
              )}

              {/* Quick 1-Click Action Buttons */}
              <div className="flex items-center gap-2 pt-1 border-t border-subtle">
                {nextStage && (
                  <button
                    onClick={() => handleStageChange(nextStage)}
                    disabled={isUpdatingStage}
                    data-testid="advance-stage-btn"
                    className="flex-1 py-1.5 px-3 text-xs font-medium text-white bg-accent hover:bg-accent-hover rounded flex items-center justify-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
                  >
                    <span>Advance to {nextStage}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {!isRejected && candidate.stage !== 'Hired' && (
                  <button
                    onClick={() => handleStageChange('Rejected')}
                    disabled={isUpdatingStage}
                    data-testid="reject-candidate-btn"
                    className="py-1.5 px-3 text-xs font-medium text-rose-700 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 rounded flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
                  >
                    Reject Candidate
                  </button>
                )}
              </div>
            </div>

            {/* Candidate Rating & Quick Tags */}
            <div className="p-3.5 rounded border border-subtle bg-surface space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink-primary text-xs uppercase tracking-wider text-ink-tertiary">
                  Candidate Rating
                </span>
                {/* 5-Star Rating Selector */}
                <div
                  data-testid="candidate-rating-stars"
                  className="flex items-center gap-1 text-amber-500 cursor-pointer"
                >
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      onClick={() => handleRatingChange(s)}
                      disabled={isUpdatingProfile}
                      aria-label={`Rate ${s} stars`}
                      className="p-0.5 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          s <= (candidate.rating || 0)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-stone-300 hover:text-amber-200'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-[11px] font-semibold text-ink-primary ml-1">
                    {candidate.rating ? `${candidate.rating}/5` : 'Unrated'}
                  </span>
                </div>
              </div>

              {/* Tags Section */}
              <div className="space-y-1.5 pt-2 border-t border-subtle">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-ink-secondary font-medium">Recruitment Tags</span>
                  {!isAddingTag && (
                    <button
                      onClick={() => setIsAddingTag(true)}
                      className="text-[11px] text-accent hover:underline font-medium"
                    >
                      + Add Tag
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {candidate.tags && candidate.tags.length > 0 ? (
                    candidate.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200 text-[11px]"
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-rose-600 transition-colors"
                          title={`Remove tag ${tag}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-ink-tertiary text-[11px]">No tags assigned</span>
                  )}
                </div>

                {isAddingTag && (
                  <div className="flex items-center gap-1.5 pt-1.5">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      placeholder="Tag (e.g. Referral, Top Talent)..."
                      className="flex-1 px-2 py-1 text-xs bg-canvas border border-subtle rounded text-ink-primary focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                    <button
                      onClick={() => handleAddTag(newTagInput)}
                      className="px-2.5 py-1 text-xs font-medium text-white bg-accent rounded"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingTag(false);
                        setNewTagInput('');
                      }}
                      className="px-2 py-1 text-xs text-ink-secondary hover:text-ink-primary"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Candidate Contact & Info */}
            <div className="space-y-3">
              <h3 className="font-semibold uppercase tracking-wider text-[11px] text-ink-tertiary">
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

            {/* Add Recruiter Note / Interview Feedback Composer */}
            <form
              onSubmit={handlePostNote}
              data-testid="add-note-form"
              className="p-3.5 rounded border border-subtle bg-surface space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <label className="font-semibold text-ink-primary text-xs uppercase tracking-wider text-ink-tertiary flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Add Interview Feedback / Note
                </label>
                <select
                  value={noteCategory}
                  onChange={(e) => setNoteCategory(e.target.value)}
                  className="px-2 py-0.5 text-[11px] bg-canvas border border-subtle rounded text-ink-primary focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  {NOTE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Log notes from screen, code review score, technical architecture observations..."
                rows={3}
                maxLength={2000}
                data-testid="note-input"
                className="w-full p-2.5 text-xs bg-canvas border border-subtle rounded text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:ring-1 focus:ring-accent leading-relaxed"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-ink-tertiary">
                  {noteText.length}/2000 characters
                </span>
                <button
                  type="submit"
                  disabled={isPostingNote || !noteText.trim()}
                  data-testid="post-note-btn"
                  className="px-3 py-1.5 text-xs font-medium text-white bg-accent hover:bg-accent-hover rounded flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
                >
                  <Send className="w-3 h-3" />
                  Post Feedback Note
                </button>
              </div>
            </form>

            {/* Stage History Timeline */}
            <div className="space-y-3 pt-2">
              <h3 className="font-semibold uppercase tracking-wider text-[11px] text-ink-tertiary flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Stage History & Recruiter Audit Trail
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
                          {item.from === item.to
                            ? 'Recruiter Feedback Log'
                            : item.from
                            ? `${item.from} → ${item.to}`
                            : `Initial: ${item.to}`}
                        </span>
                        <span className="text-[10px] text-ink-tertiary">
                          {formatTimestamp(item.changedAt)}
                        </span>
                      </div>
                      {item.notes && (
                        <p className="text-[11px] text-ink-secondary leading-relaxed whitespace-pre-wrap">
                          {item.notes}
                        </p>
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
