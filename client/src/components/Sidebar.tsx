import React from 'react';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Kanban,
  Calendar,
  Plus,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Building2
} from 'lucide-react';

export type NavView = 'overview' | 'jobs' | 'candidates' | 'pipeline' | 'interviews';

interface SidebarProps {
  activeView: NavView;
  onSelectView: (view: NavView) => void;
  onOpenAddCandidate: () => void;
  counts?: {
    totalCandidates?: number;
    openJobs?: number;
    upcomingInterviews?: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  onOpenAddCandidate,
  counts
}) => {
  const navItems: {
    id: NavView;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
    badge?: string;
  }[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard
    },
    {
      id: 'jobs',
      label: 'Jobs & Openings',
      icon: Briefcase,
      count: counts?.openJobs
    },
    {
      id: 'candidates',
      label: 'Candidates',
      icon: Users,
      count: counts?.totalCandidates
    },
    {
      id: 'pipeline',
      label: 'Hiring Pipeline',
      icon: Kanban,
      badge: 'Visual'
    },
    {
      id: 'interviews',
      label: 'Interviews',
      icon: Calendar,
      count: counts?.upcomingInterviews
    }
  ];

  return (
    <aside
      className="w-64 bg-surface border-r border-subtle flex flex-col shrink-0 select-none z-20"
      aria-label="Recruiter workspace navigation"
    >
      {/* Brand Header */}
      <div className="h-14 px-5 border-b border-subtle flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white shadow-xs">
            <span className="font-bold text-sm tracking-tight">EJ</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm tracking-tight text-ink-primary">EarlyJobs</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-stone-100 text-stone-600 border border-stone-200">
                Mini ATS
              </span>
            </div>
            <p className="text-[10px] text-ink-tertiary">Recruitment Workspace</p>
          </div>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="p-3">
        <button
          onClick={onOpenAddCandidate}
          data-testid="sidebar-add-candidate-btn"
          className="w-full py-2 px-3 text-xs font-semibold text-white bg-accent hover:bg-accent/90 active:bg-accent/95 rounded-md shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Candidate</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-tertiary">
          Recruitment Workspace
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              data-testid={`nav-${item.id}`}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-accent/10 text-accent font-semibold border border-accent/20'
                  : 'text-ink-secondary hover:text-ink-primary hover:bg-stone-100/70 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-accent' : 'text-ink-tertiary group-hover:text-ink-primary'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold tabular-nums ${
                      isActive
                        ? 'bg-accent text-white'
                        : 'bg-stone-100 text-ink-secondary border border-stone-200'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
                {item.badge && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-medium uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                    {item.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Workspace Quick Stats & Info */}
      <div className="p-3 mx-3 mb-3 bg-stone-50 border border-subtle rounded-md space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-ink-tertiary flex items-center gap-1">
            <Building2 className="w-3 h-3 text-ink-tertiary" />
            Workspace
          </span>
          <span className="font-semibold text-ink-primary">EarlyJobs HQ</span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-ink-tertiary flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            ATS Engine
          </span>
          <span className="text-emerald-700 font-medium">Online · Ready</span>
        </div>
      </div>

      {/* Recruiter Profile Footer */}
      <div className="p-3 border-t border-subtle bg-surface flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-stone-200 text-stone-700 font-semibold text-xs flex items-center justify-center shrink-0 border border-stone-300">
            AA
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-ink-primary truncate">Adarsh Aldkar</p>
            <p className="text-[10px] text-ink-tertiary truncate">Lead Talent Partner</p>
          </div>
        </div>
        <div className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100" title="Active Recruiter Session" />
      </div>
    </aside>
  );
};
