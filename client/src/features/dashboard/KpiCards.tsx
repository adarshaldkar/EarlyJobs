import React from 'react';
import { Users, UserCheck, PhoneCall, Award } from 'lucide-react';
import { DashboardSummary } from '../../types';

interface KpiCardsProps {
  summary: DashboardSummary | null;
  isLoading: boolean;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ summary, isLoading }) => {
  const cards = [
    {
      title: 'Total Candidates',
      value: summary?.totalCandidates ?? summary?.total ?? 0,
      description: 'Total applicants registered in ATS',
      icon: Users,
      testId: 'kpi-total-candidates'
    },
    {
      title: 'Active Pipeline',
      value: summary?.activePipeline ?? 0,
      description: 'Candidates currently being evaluated',
      icon: UserCheck,
      testId: 'kpi-active-pipeline'
    },
    {
      title: 'In Interview',
      value: summary?.inInterview ?? summary?.interviewing ?? 0,
      description: 'Scheduled for interview stages',
      icon: PhoneCall,
      testId: 'kpi-in-interview'
    },
    {
      title: 'Hired',
      value: summary?.hired ?? 0,
      description: 'Accepted offers and successfully joined',
      icon: Award,
      testId: 'kpi-hired'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            data-testid={card.testId}
            className="p-4 rounded border border-subtle bg-surface shadow-none flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-ink-secondary mb-2">
              <span className="text-xs font-medium">{card.title}</span>
              <Icon className="h-4 w-4 text-ink-tertiary stroke-[1.5]" />
            </div>

            <div>
              <div className="text-2xl font-bold tracking-tight text-ink-primary tabular-nums">
                {isLoading ? (
                  <span className="inline-block w-8 h-6 bg-stone-100 animate-pulse rounded" />
                ) : (
                  card.value
                )}
              </div>
              <div className="mt-1 text-[11px] text-ink-secondary leading-tight truncate">
                {card.description}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
