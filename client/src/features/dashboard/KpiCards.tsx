import React from 'react';
import { Users, UserCheck, PhoneCall, Award, TrendingUp, Sparkles } from 'lucide-react';
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
      description: 'Active database talent pool',
      icon: Users,
      testId: 'kpi-total-candidates',
      trend: '+12% this month',
      gradient: 'from-white via-white to-slate-50',
      borderColor: 'border-slate-200/90',
      iconBg: 'bg-slate-100 text-slate-800',
      accentGlow: 'group-hover:border-slate-400/60'
    },
    {
      title: 'Active Pipeline',
      value: summary?.activePipeline ?? 0,
      description: 'Currently advancing in stages',
      icon: UserCheck,
      testId: 'kpi-active-pipeline',
      trend: 'Active triage',
      gradient: 'from-white via-white to-teal-50/50',
      borderColor: 'border-teal-200/70',
      iconBg: 'bg-teal-100/80 text-teal-700',
      accentGlow: 'group-hover:border-teal-400/80'
    },
    {
      title: 'In Interview',
      value: summary?.inInterview ?? summary?.interviewing ?? 0,
      description: 'Scheduled in active loops',
      icon: PhoneCall,
      testId: 'kpi-in-interview',
      trend: 'Rounds ongoing',
      gradient: 'from-white via-white to-purple-50/50',
      borderColor: 'border-purple-200/70',
      iconBg: 'bg-purple-100/80 text-purple-700',
      accentGlow: 'group-hover:border-purple-400/80'
    },
    {
      title: 'Hired',
      value: summary?.hired ?? 0,
      description: 'Offer accepted & onboarded',
      icon: Award,
      testId: 'kpi-hired',
      trend: 'Target met',
      gradient: 'from-white via-white to-emerald-50/50',
      borderColor: 'border-emerald-200/70',
      iconBg: 'bg-emerald-100/80 text-emerald-700',
      accentGlow: 'group-hover:border-emerald-400/80'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            data-testid={card.testId}
            className={`p-5 rounded-2xl border ${card.borderColor} bg-gradient-to-br ${card.gradient} shadow-[0_2px_6px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group ${card.accentGlow}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {card.title}
              </span>
              <div
                className={`w-9 h-9 rounded-xl ${card.iconBg} flex items-center justify-center shadow-2xs transition-transform group-hover:scale-105`}
              >
                <Icon className="h-4.5 w-4.5 stroke-[2]" />
              </div>
            </div>

            <div>
              <div className="text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums">
                {isLoading ? (
                  <span className="inline-block w-12 h-8 bg-slate-200 animate-pulse rounded-lg" />
                ) : (
                  card.value
                )}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                <span className="text-slate-500 text-[11px] font-medium truncate">
                  {card.description}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/80 border border-slate-200/60 text-slate-700 shrink-0">
                  {card.trend}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
