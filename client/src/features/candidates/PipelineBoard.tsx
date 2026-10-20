import React, { useState } from 'react';
import {
  Star,
  ChevronRight,
  Clock,
  Briefcase,
  User,
  ArrowRight,
  XCircle,
  CheckCircle2,
  Sparkles,
  Layers
} from 'lucide-react';
import { Candidate, HIRING_STAGES, HiringStage } from '../../types';

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

const STAGE_METAS: Record<
  HiringStage,
  {
    headerBg: string;
    borderTop: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    dotColor: string;
  }
> = {
  Applied: {
    headerBg: 'bg-blue-50/60',
    borderTop: 'border-t-blue-500',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-800',
    badgeBorder: 'border-blue-200',
    dotColor: 'bg-blue-500'
  },
  Screening: {
    headerBg: 'bg-amber-50/60',
    borderTop: 'border-t-amber-500',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-200',
    dotColor: 'bg-amber-500'
  },
  Interview: {
    headerBg: 'bg-purple-50/60',
    borderTop: 'border-t-purple-500',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-800',
    badgeBorder: 'border-purple-200',
    dotColor: 'bg-purple-500'
  },
  Offer: {
    headerBg: 'bg-cyan-50/60',
    borderTop: 'border-t-cyan-500',
    badgeBg: 'bg-cyan-100',
    badgeText: 'text-cyan-800',
    badgeBorder: 'border-cyan-200',
    dotColor: 'bg-cyan-500'
  },
  Hired: {
    headerBg: 'bg-emerald-50/60',
    borderTop: 'border-t-emerald-500',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    badgeBorder: 'border-emerald-200',
    dotColor: 'bg-emerald-500'
  },
  Rejected: {
    headerBg: 'bg-rose-50/60',
    borderTop: 'border-t-rose-500',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-800',
    badgeBorder: 'border-rose-200',
    dotColor: 'bg-rose-500'
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
            className={`w-3.5 h-3.5 ${
              star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
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
      <div className="flex gap-4 overflow-x-auto pb-6">
        {STAGE_ORDER.map((stage) => (
          <div
            key={stage}
            className="w-[280px] sm:w-[310px] min-w-[280px] sm:min-w-[310px] shrink-0 bg-white border border-slate-200 rounded-2xl p-4 space-y-4 animate-pulse"
          >
            <div className="h-6 bg-slate-200 rounded-lg w-1/2" />
            <div className="h-32 bg-slate-100 rounded-xl" />
            <div className="h-32 bg-slate-100 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      data-testid="pipeline-board"
      className="flex gap-5 overflow-x-auto pb-8 pt-1 px-1 scroll-smooth items-start"
    >
      {STAGE_ORDER.map((stage) => {
        const stageCandidates = groupedCandidates[stage];
        const meta = STAGE_METAS[stage];

        return (
          <div
            key={stage}
            data-testid={`pipeline-column-${stage.toLowerCase()}`}
            className={`w-[280px] sm:w-[320px] min-w-[280px] sm:min-w-[320px] shrink-0 bg-slate-100/70 border border-slate-200/90 rounded-2xl flex flex-col shadow-xs transition-all border-t-4 ${meta.borderTop}`}
          >
            {/* Column Header */}
            <div
              className={`px-4 py-3 border-b border-slate-200/70 rounded-t-xl flex items-center justify-between ${meta.headerBg}`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`w-2.5 h-2.5 rounded-full ${meta.dotColor} ring-2 ring-white shadow-xs`} />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  {stage}
                </h3>
              </div>

              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full border shadow-2xs ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}
              >
                {stageCandidates.length}
              </span>
            </div>

            {/* Candidate Card Stack */}
            <div className="p-3 space-y-3 min-h-[420px] max-h-[780px] overflow-y-auto">
              {stageCandidates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 space-y-1">
                  <Layers className="w-8 h-8 text-slate-300 stroke-1 mb-1" />
                  <p className="text-xs font-medium">No candidates in {stage.toLowerCase()}</p>
                  <p className="text-[11px] text-slate-400">Advance candidates or intake new applicants</p>
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
                      className="group bg-white rounded-xl border border-slate-200/80 p-4 shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-200 cursor-pointer space-y-3 text-left"
                    >
                      {/* Name, Avatar, and Star Rating Header */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-600 to-emerald-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                            {getInitials(candidate.name)}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition-colors truncate">
                              {candidate.name}
                            </h4>
                            <p className="text-[11px] text-slate-500 font-medium truncate">
                              {candidate.position}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {renderStars(candidate.rating || 0)}
                        </div>
                      </div>

                      {/* Experience and Skills summary */}
                      <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                          {candidate.experienceYears}{' '}
                          {candidate.experienceYears === 1 ? 'yr exp' : 'yrs exp'}
                        </span>

                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {new Date(candidate.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>

                      {/* Recruitment Tag Badges */}
                      {candidate.tags && candidate.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {candidate.tags.slice(0, 2).map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/80"
                            >
                              {tag}
                            </span>
                          ))}
                          {candidate.tags.length > 2 && (
                            <span className="text-[10px] font-semibold text-slate-400 self-center">
                              +{candidate.tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Card Action Footer */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        {candidate.stage !== 'Rejected' && candidate.stage !== 'Hired' && (
                          <button
                            onClick={(e) => handleReject(e, candidate)}
                            disabled={isCurrentAdvancing}
                            title="Reject candidate"
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}

                        <div className="ml-auto flex items-center gap-2">
                          {nextStage && (
                            <button
                              onClick={(e) => handleAdvance(e, candidate)}
                              disabled={isCurrentAdvancing}
                              className="px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 active:scale-95 rounded-lg shadow-xs flex items-center gap-1 transition-all disabled:opacity-50"
                            >
                              <span>{nextStage}</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {candidate.stage === 'Hired' && (
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1 text-[11px] font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Hired
                            </span>
                          )}

                          {candidate.stage === 'Rejected' && (
                            <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-medium">
                              Archived
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
