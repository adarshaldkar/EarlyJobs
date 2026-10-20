import React, { useState } from 'react';
import {
  Star,
  ChevronRight,
  Clock,
  Briefcase,
  User,
  ArrowRight,
  XCircle,
  CheckCircle2
} from 'lucide-react';
import { Candidate, HIRING_STAGES, HiringStage } from '../../types';
import { StageBadge } from '../../components/StageBadge';

interface PipelineBoardProps {
  candidates: Candidate[];
  onSelectCandidate: (candidate: Candidate) => void;
  onStageChange: (candidate: Candidate, newStage: HiringStage) => Promise<void>;
  isLoading: boolean;
}

const STAGE_ORDER: HiringStage[] = [
  'Applied',
  'Screening',
  'Interview',
  'Offer',
  'Hired',
  'Rejected'
];

const STAGE_PROGRESSION: Record<HiringStage, HiringStage | null> = {
  Applied: 'Screening',
  Screening: 'Interview',
  Interview: 'Offer',
  Offer: 'Hired',
  Hired: null,
  Rejected: null
};

const STAGE_ACCENT_COLORS: Record<HiringStage, { border: string; dot: string; bg: string }> = {
  Applied: {
    border: 'border-blue-200',
    dot: 'bg-blue-500',
    bg: 'bg-blue-50/50'
  },
  Screening: {
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    bg: 'bg-amber-50/50'
  },
  Interview: {
    border: 'border-purple-200',
    dot: 'bg-purple-500',
    bg: 'bg-purple-50/50'
  },
  Offer: {
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    bg: 'bg-emerald-50/50'
  },
  Hired: {
    border: 'border-teal-200',
    dot: 'bg-teal-600',
    bg: 'bg-teal-50/50'
  },
  Rejected: {
    border: 'border-rose-200',
    dot: 'bg-rose-500',
    bg: 'bg-rose-50/50'
  }
};

export const PipelineBoard: React.FC<PipelineBoardProps> = ({
  candidates,
  onSelectCandidate,
  onStageChange,
  isLoading
}) => {
  const [advancingId, setAdvancingId] = useState<string | null>(null);

  // Group candidates by stage
  const groupedCandidates = STAGE_ORDER.reduce<Record<HiringStage, Candidate[]>>(
    (acc, stage) => {
      acc[stage] = candidates.filter((c) => c.stage === stage);
      return acc;
    },
    {
      Applied: [],
      Screening: [],
      Interview: [],
      Offer: [],
      Hired: [],
      Rejected: []
    }
  );

  const handleAdvance = async (e: React.MouseEvent, candidate: Candidate) => {
    e.stopPropagation();
    const nextStage = STAGE_PROGRESSION[candidate.stage];
    if (!nextStage) return;

    try {
      setAdvancingId(candidate._id);
      await onStageChange(candidate, nextStage);
    } finally {
      setAdvancingId(null);
    }
  };

  const handleReject = async (e: React.MouseEvent, candidate: Candidate) => {
    e.stopPropagation();
    if (candidate.stage === 'Rejected') return;

    try {
      setAdvancingId(candidate._id);
      await onStageChange(candidate, 'Rejected');
    } finally {
      setAdvancingId(null);
    }
  };

  const renderStars = (rating: number = 0) => {
    return (
      <div className="flex items-center gap-0.5 text-amber-500" title={`Rating: ${rating}/5`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3 h-3 ${
              star <= rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  if (isLoading && candidates.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 min-h-[500px]">
        {STAGE_ORDER.map((stage) => (
          <div
            key={stage}
            className="bg-surface/50 border border-subtle rounded p-3 space-y-3 animate-pulse"
          >
            <div className="h-5 bg-stone-200 rounded w-2/3" />
            <div className="h-28 bg-stone-100 rounded" />
            <div className="h-28 bg-stone-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      data-testid="pipeline-board"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 items-start overflow-x-auto pb-4"
    >
      {STAGE_ORDER.map((stage) => {
        const stageCandidates = groupedCandidates[stage];
        const colors = STAGE_ACCENT_COLORS[stage];

        return (
          <div
            key={stage}
            data-testid={`pipeline-column-${stage.toLowerCase()}`}
            className="flex flex-col bg-stone-50/80 border border-subtle rounded-lg min-w-[220px]"
          >
            {/* Column Header */}
            <div className={`p-2.5 border-b border-subtle flex items-center justify-between ${colors.bg}`}>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                <span className="text-xs font-semibold text-ink-primary tracking-tight">
                  {stage}
                </span>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-surface border border-subtle text-ink-secondary">
                {stageCandidates.length}
              </span>
            </div>

            {/* Candidates Card Stack */}
            <div className="p-2 space-y-2.5 min-h-[380px] max-h-[750px] overflow-y-auto">
              {stageCandidates.length === 0 ? (
                <div className="text-center py-8 text-[11px] text-ink-tertiary">
                  No candidates in {stage.toLowerCase()}
                </div>
              ) : (
                stageCandidates.map((candidate) => {
                  const nextStage = STAGE_PROGRESSION[candidate.stage];
                  const isCurrentAdvancing = advancingId === candidate._id;

                  return (
                    <div
                      key={candidate._id}
                      onClick={() => onSelectCandidate(candidate)}
                      data-testid={`candidate-card-${candidate._id}`}
                      className="group bg-surface border border-subtle hover:border-ink-secondary/50 rounded-md p-3 shadow-xs hover:shadow-sm cursor-pointer transition-all space-y-2.5 text-left"
                    >
                      {/* Name & Avatar Header */}
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-6 w-6 rounded bg-stone-100 border border-subtle text-ink-primary font-semibold text-[10px] flex items-center justify-center shrink-0">
                            {getInitials(candidate.name)}
                          </div>
                          <span className="text-xs font-semibold text-ink-primary truncate group-hover:text-accent transition-colors">
                            {candidate.name}
                          </span>
                        </div>
                        {renderStars(candidate.rating || 0)}
                      </div>

                      {/* Position & Experience */}
                      <div className="text-[11px] text-ink-secondary truncate">
                        <span className="font-medium text-ink-primary">{candidate.position}</span>
                        <span className="text-ink-tertiary"> • {candidate.experienceYears}y</span>
                      </div>

                      {/* Tags */}
                      {candidate.tags && candidate.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {candidate.tags.slice(0, 2).map((tag, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 text-[10px] font-medium border border-stone-200"
                            >
                              {tag}
                            </span>
                          ))}
                          {candidate.tags.length > 2 && (
                            <span className="text-[10px] text-ink-tertiary self-center">
                              +{candidate.tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Footer Actions */}
                      <div className="pt-1.5 border-t border-subtle flex items-center justify-between text-[11px]">
                        <span className="text-[10px] text-ink-tertiary">
                          {new Date(candidate.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {candidate.stage !== 'Rejected' && candidate.stage !== 'Hired' && (
                            <button
                              onClick={(e) => handleReject(e, candidate)}
                              disabled={isCurrentAdvancing}
                              title="Reject candidate"
                              className="text-stone-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {nextStage && (
                            <button
                              onClick={(e) => handleAdvance(e, candidate)}
                              disabled={isCurrentAdvancing}
                              className="px-2 py-0.5 text-[11px] font-medium text-accent hover:text-white hover:bg-accent border border-accent/30 rounded flex items-center gap-1 transition-colors disabled:opacity-50"
                            >
                              <span>{nextStage}</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}

                          {candidate.stage === 'Hired' && (
                            <span className="text-teal-700 flex items-center gap-0.5 text-[10px] font-medium">
                              <CheckCircle2 className="w-3 h-3" />
                              Hired
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
