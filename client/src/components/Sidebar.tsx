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
  Building2,
  X
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
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  onOpenAddCandidate,
  counts,
  onCloseMobile
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
      className="w-64 bg-[#0B1120] text-slate-300 flex flex-col shrink-0 select-none z-20 border-r border-slate-800/80 shadow-xl h-full"
      aria-label="Recruiter workspace navigation"
    >
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-slate-800/80 flex items-center justify-between bg-[#080D1A]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 via-teal-600 to-emerald-500 flex items-center justify-center text-white font-extrabold shadow-md shadow-teal-950/40">
            <span className="text-sm font-bold tracking-tight">EJ</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white">EarlyJobs</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/20">
                ATS v2
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Recruiter Command Center</p>
          </div>
        </div>

        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors lg:hidden cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Primary Action Button */}
      <div className="p-4">
        <button
          onClick={() => {
            onOpenAddCandidate();
            onCloseMobile?.();
          }}
          data-testid="sidebar-add-candidate-btn"
          className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 active:scale-[0.98] rounded-xl shadow-md shadow-teal-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Candidate</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Navigation Workspace
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectView(item.id);
                onCloseMobile?.();
              }}
              data-testid={`sidebar-nav-${item.id}`}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-800 text-white font-semibold border-l-2 border-teal-400 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border-l-2 border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-white'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${
                      isActive
                        ? 'bg-teal-500 text-white shadow-xs'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
                {item.badge && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {item.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Workspace Status Card */}
      <div className="p-3 mx-3 mb-3 bg-slate-800/40 border border-slate-700/50 rounded-xl space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            Workspace
          </span>
          <span className="font-semibold text-slate-200">EarlyJobs HQ</span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            ATS Engine
          </span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Connected
          </span>
        </div>
      </div>

      {/* Recruiter Profile Footer */}
      <div className="p-3.5 border-t border-slate-800/80 bg-[#080D1A] flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 text-white font-bold text-xs flex items-center justify-center shrink-0 border border-slate-600 shadow-xs">
            AA
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">Adarsh Aldkar</p>
            <p className="text-[10px] text-slate-400 truncate">Lead Talent Partner</p>
          </div>
        </div>
        <div
          className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-950 shadow-xs shadow-emerald-500/50"
          title="Active Recruiter Session"
        />
      </div>
    </aside>
  );
};
