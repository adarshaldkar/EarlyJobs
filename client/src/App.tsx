import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  LayoutDashboard,
  Briefcase,
  Kanban,
  Calendar,
  Database,
  Plus,
  RefreshCw,
  ExternalLink,
  Search,
  CheckCircle2,
  Clock,
  Video,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { Candidate, HiringStage } from './types';
import {
  fetchCandidates,
  fetchDashboardSummary,
  fetchJobs,
  fetchInterviews,
  updateCandidateStage,
  getApiErrorMessage,
  apiClient
} from './lib/api';
import { ToastProvider, useToast } from './components/Toast';
import { Sidebar, NavView } from './components/Sidebar';
import { CandidateFilters } from './features/candidates/CandidateFilters';
import { CandidateTable } from './features/candidates/CandidateTable';
import { PipelineBoard } from './features/candidates/PipelineBoard';
import { CandidateModal } from './features/candidates/CandidateModal';
import { CandidateDrawer } from './features/candidates/CandidateDrawer';
import { JobsView } from './features/jobs/JobsView';
import { InterviewsView } from './features/interviews/InterviewsView';
import { KpiCards } from './features/dashboard/KpiCards';
import { PipelineChart } from './features/dashboard/PipelineChart';

function AtsWorkspace() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Navigation state: 'overview' | 'jobs' | 'candidates' | 'pipeline' | 'interviews'
  const [activeView, setActiveView] = useState<NavView>('candidates');

  // Candidate directory view mode: 'board' | 'table'
  const [viewMode, setViewMode] = useState<'board' | 'table'>('table');

  // Filter and sort state
  const [search, setSearch] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const limit = viewMode === 'board' ? 50 : 10;

  // Modal & Drawer UI state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Health Query
  const {
    data: healthData,
    isLoading: isHealthLoading
  } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const res = await apiClient.get('/health');
      return res.data?.data;
    },
    refetchInterval: 30000
  });

  // Candidates Query
  const {
    data: candidatesData,
    isLoading: isLoadingCandidates,
    isRefetching: isRefetchingCandidates,
    refetch: refetchCandidates
  } = useQuery({
    queryKey: ['candidates', { page, limit, search, position: selectedPosition, stage: selectedStage, sortBy, sortOrder }],
    queryFn: () =>
      fetchCandidates({
        page,
        limit,
        search: search || undefined,
        position: selectedPosition || undefined,
        stage: selectedStage || undefined,
        sortBy,
        sortOrder
      })
  });

  // Dashboard Summary Query
  const {
    data: dashboardData,
    isLoading: isLoadingDashboard,
    refetch: refetchDashboard
  } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: fetchDashboardSummary
  });

  // Jobs Query
  const {
    data: jobsData = [],
    refetch: refetchJobs
  } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => fetchJobs()
  });

  // Interviews Query
  const {
    data: interviewsData = [],
    refetch: refetchInterviews
  } = useQuery({
    queryKey: ['interviews'],
    queryFn: () => fetchInterviews()
  });

  // Refresh all data across the entire ATS
  const handleRefreshAll = () => {
    refetchCandidates();
    refetchDashboard();
    refetchJobs();
    refetchInterviews();
    queryClient.invalidateQueries({ queryKey: ['candidates'] });
    queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    queryClient.invalidateQueries({ queryKey: ['jobs'] });
    queryClient.invalidateQueries({ queryKey: ['interviews'] });
  };

  const handleSelectCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setIsDrawerOpen(true);
  };

  const handleBoardStageChange = async (candidate: Candidate, newStage: HiringStage) => {
    try {
      await updateCandidateStage(candidate._id, candidate.stage, newStage);
      showToast(`Moved ${candidate.name} to ${newStage}`, 'success');
      handleRefreshAll();
    } catch (err: any) {
      if (err.response?.status === 409) {
        showToast('Candidate was updated elsewhere. Refreshed.', 'warning');
      } else {
        showToast(getApiErrorMessage(err), 'error');
      }
      handleRefreshAll();
    }
  };

  const handleCandidateCreated = () => {
    handleRefreshAll();
  };

  const handleViewApplicantsForJob = (jobTitle: string) => {
    setSelectedPosition(jobTitle);
    setSelectedStage('');
    setSearch('');
    setPage(1);
    setActiveView('candidates');
  };

  // Safe pagination fallback
  const candidates = candidatesData?.items || [];
  const pagination = candidatesData?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  };

  const upcomingInterviews = interviewsData.filter((i) => i.status === 'Scheduled');

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas text-ink-primary font-sans antialiased">
      {/* Persistent Left Sidebar Navigation (Desktop) */}
      <div className="hidden md:flex shrink-0">
        <Sidebar
          activeView={activeView}
          onSelectView={(v) => {
            setActiveView(v);
          }}
          onOpenAddCandidate={() => setIsModalOpen(true)}
          counts={{
            totalCandidates: pagination.total,
            openJobs: jobsData.filter((j) => j.status === 'Open').length,
            upcomingInterviews: upcomingInterviews.length
          }}
        />
      </div>

      {/* Main Recruiter Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-14 border-b border-subtle bg-surface px-4 sm:px-6 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3 sm:gap-6 min-w-0">
            {/* Mobile Brand Badge */}
            <div className="flex md:hidden items-center gap-2 shrink-0">
              <div className="w-7 h-7 rounded bg-accent flex items-center justify-center text-white text-xs font-bold">
                EJ
              </div>
            </div>

            {/* Top Navigation Tabs */}
            <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveView('candidates')}
                data-testid="nav-tab-directory"
                className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                  activeView === 'candidates'
                    ? 'bg-stone-100 text-ink-primary font-semibold'
                    : 'text-ink-secondary hover:text-ink-primary hover:bg-stone-50'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Candidates</span>
              </button>

              <button
                onClick={() => setActiveView('overview')}
                data-testid="nav-tab-dashboard"
                className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                  activeView === 'overview'
                    ? 'bg-stone-100 text-ink-primary font-semibold'
                    : 'text-ink-secondary hover:text-ink-primary hover:bg-stone-50'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Overview</span>
              </button>

              <button
                onClick={() => setActiveView('jobs')}
                data-testid="nav-jobs"
                className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                  activeView === 'jobs'
                    ? 'bg-stone-100 text-ink-primary font-semibold'
                    : 'text-ink-secondary hover:text-ink-primary hover:bg-stone-50'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Jobs ({jobsData.length})</span>
              </button>

              <button
                onClick={() => setActiveView('pipeline')}
                data-testid="nav-pipeline"
                className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                  activeView === 'pipeline'
                    ? 'bg-stone-100 text-ink-primary font-semibold'
                    : 'text-ink-secondary hover:text-ink-primary hover:bg-stone-50'
                }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                <span>Pipeline</span>
              </button>

              <button
                onClick={() => setActiveView('interviews')}
                data-testid="nav-interviews"
                className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                  activeView === 'interviews'
                    ? 'bg-stone-100 text-ink-primary font-semibold'
                    : 'text-ink-secondary hover:text-ink-primary hover:bg-stone-50'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Interviews ({upcomingInterviews.length})</span>
              </button>
            </nav>
          </div>

          {/* Right Header: System Health & Refresh */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefreshAll}
              disabled={isRefetchingCandidates}
              data-testid="refresh-btn"
              className="p-1.5 text-ink-secondary hover:text-ink-primary rounded hover:bg-stone-100 transition-colors cursor-pointer"
              title="Refresh workspace data"
              aria-label="Refresh workspace data"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefetchingCandidates ? 'animate-spin text-accent' : ''}`}
              />
            </button>

            <div
              className={`text-xs flex items-center gap-1.5 px-2.5 py-1 rounded border ${
                healthData?.status === 'healthy'
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : isHealthLoading
                  ? 'text-amber-700 bg-amber-50 border-amber-200'
                  : 'text-rose-700 bg-rose-50 border-rose-200'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  healthData?.status === 'healthy'
                    ? 'bg-emerald-500'
                    : isHealthLoading
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-rose-500'
                }`}
              />
              <span className="hidden sm:inline font-medium">
                {healthData?.status === 'healthy'
                  ? 'System Healthy'
                  : isHealthLoading
                  ? 'Connecting...'
                  : 'Offline'}
              </span>
            </div>
          </div>
        </header>

        {/* Workspace Scrollable Body */}
        <main className="flex-1 overflow-y-auto p-6 bg-canvas">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* View 1: Overview */}
            {activeView === 'overview' && (
              <div className="space-y-6 animate-in fade-in">
                {/* Recruitment KPIs Strip */}
                <KpiCards summary={dashboardData || null} isLoading={isLoadingDashboard} />

                {/* Pipeline Distribution Chart & Fast Recruiter Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <PipelineChart
                      stageCounts={dashboardData?.stageCounts}
                      isLoading={isLoadingDashboard}
                    />
                  </div>

                  {/* Recruiter Action Center */}
                  <div className="p-4 rounded-lg border border-subtle bg-surface flex flex-col justify-between shadow-xs">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-ink-primary uppercase tracking-wider">
                          Recruitment Action Center
                        </h3>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                          Live Pipeline
                        </span>
                      </div>
                      <p className="text-[11px] text-ink-secondary mt-1">
                        Accelerate hiring loops and candidate triage.
                      </p>

                      <div className="mt-4 space-y-2">
                        <button
                          onClick={() => setIsModalOpen(true)}
                          className="w-full py-2 px-3 text-xs font-medium text-white bg-accent hover:bg-accent/90 rounded-md shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Candidate</span>
                        </button>

                        <button
                          onClick={() => setActiveView('pipeline')}
                          className="w-full py-2 px-3 text-xs font-medium text-ink-primary bg-stone-100 hover:bg-stone-200/80 rounded-md border border-stone-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Kanban className="w-3.5 h-3.5 text-accent" />
                          <span>Open Visual Kanban Board</span>
                        </button>

                        <button
                          onClick={() => setActiveView('jobs')}
                          className="w-full py-2 px-3 text-xs font-medium text-ink-secondary hover:text-ink-primary bg-surface hover:bg-stone-100 rounded-md border border-subtle flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Briefcase className="w-3.5 h-3.5" />
                          <span>Manage Job Openings ({jobsData.length})</span>
                        </button>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-subtle mt-4 text-[11px] text-ink-tertiary leading-relaxed">
                      <strong>Audit Consistency:</strong> Real-time single-query facet aggregation ensures
                      Total = Sum of Stage Counts across all 6 hiring stages.
                    </div>
                  </div>
                </div>

                {/* Upcoming Interviews Quick Widget */}
                <div className="bg-surface rounded-lg border border-subtle overflow-hidden shadow-xs">
                  <div className="px-5 py-3.5 border-b border-subtle flex items-center justify-between bg-canvas">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-accent" />
                      <h3 className="text-xs font-bold text-ink-primary uppercase tracking-wider">
                        Upcoming Interview Schedule
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-semibold">
                        {upcomingInterviews.length} Scheduled
                      </span>
                    </div>

                    <button
                      onClick={() => setActiveView('interviews')}
                      className="text-xs font-medium text-accent hover:underline flex items-center gap-1"
                    >
                      <span>View All Interview Loops</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="divide-y divide-subtle">
                    {upcomingInterviews.length === 0 ? (
                      <div className="p-6 text-center text-xs text-ink-tertiary">
                        No interview loops currently scheduled for today.
                      </div>
                    ) : (
                      upcomingInterviews.slice(0, 3).map((item) => (
                        <div
                          key={item._id}
                          className="px-5 py-3 flex items-center justify-between hover:bg-stone-50/70 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 text-accent font-semibold text-xs flex items-center justify-center">
                              {item.candidateName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-ink-primary">
                                {item.candidateName}{' '}
                                <span className="font-normal text-ink-tertiary">
                                  — {item.position}
                                </span>
                              </p>
                              <p className="text-[11px] text-ink-secondary">
                                {item.round} · with{' '}
                                <span className="font-medium text-ink-primary">{item.interviewer}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-xs text-ink-tertiary flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {new Date(item.scheduledAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>

                            {item.meetingLink && (
                              <a
                                href={item.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 text-xs font-medium text-white bg-accent hover:bg-accent/90 rounded flex items-center gap-1 shadow-2xs transition-colors"
                              >
                                <Video className="w-3 h-3" />
                                <span>Join</span>
                              </a>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Recent Applicants Table */}
                <div className="bg-surface rounded-lg border border-subtle overflow-hidden shadow-xs">
                  <div className="px-5 py-3.5 border-b border-subtle flex items-center justify-between bg-canvas">
                    <h3 className="text-xs font-bold text-ink-primary uppercase tracking-wider">
                      Recent Candidate Applications
                    </h3>
                    <button
                      onClick={() => {
                        setSelectedPosition('');
                        setSelectedStage('');
                        setActiveView('candidates');
                      }}
                      className="text-xs font-medium text-accent hover:underline flex items-center gap-1"
                    >
                      <span>Explore Candidate Directory</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <CandidateTable
                    candidates={
                      dashboardData?.recentCandidates && dashboardData.recentCandidates.length > 0
                        ? dashboardData.recentCandidates
                        : candidates.slice(0, 5)
                    }
                    pagination={{
                      page: 1,
                      limit: 5,
                      total: dashboardData?.recentCandidates?.length || candidates.length,
                      totalPages: 1
                    }}
                    onPageChange={() => {}}
                    onSelectCandidate={handleSelectCandidate}
                    onRefresh={handleRefreshAll}
                    isLoading={isLoadingDashboard || isLoadingCandidates}
                  />
                </div>
              </div>
            )}

            {/* View 2: Jobs & Openings */}
            {activeView === 'jobs' && (
              <JobsView onViewApplicants={handleViewApplicantsForJob} />
            )}

            {/* View 3: Candidate Directory */}
            {activeView === 'candidates' && (
              <div className="space-y-4 animate-in fade-in">
                {/* Recruitment KPIs Strip */}
                <KpiCards summary={dashboardData || null} isLoading={isLoadingDashboard} />

                <CandidateFilters
                  search={search}
                  onSearchChange={(val) => {
                    setSearch(val);
                    setPage(1);
                  }}
                  selectedStage={selectedStage}
                  onStageChange={(stg) => {
                    setSelectedStage(stg);
                    setPage(1);
                  }}
                  selectedPosition={selectedPosition}
                  onPositionChange={(pos) => {
                    setSelectedPosition(pos);
                    setPage(1);
                  }}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSortChange={(newSortBy, newSortOrder) => {
                    setSortBy(newSortBy);
                    setSortOrder(newSortOrder);
                    setPage(1);
                  }}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  onOpenCreateModal={() => setIsModalOpen(true)}
                  totalCandidates={pagination.total}
                />

                {viewMode === 'table' ? (
                  <CandidateTable
                    candidates={candidates}
                    pagination={pagination}
                    onPageChange={(newPage) => setPage(newPage)}
                    onSelectCandidate={handleSelectCandidate}
                    onRefresh={handleRefreshAll}
                    isLoading={isLoadingCandidates}
                  />
                ) : (
                  <PipelineBoard
                    candidates={candidates}
                    onSelectCandidate={handleSelectCandidate}
                    onStageChange={handleBoardStageChange}
                    isLoading={isLoadingCandidates}
                  />
                )}
              </div>
            )}

            {/* View 4: Hiring Pipeline (Visual Kanban Board) */}
            {activeView === 'pipeline' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-subtle">
                  <div>
                    <h1 className="text-xl font-bold tracking-tight text-ink-primary flex items-center gap-2">
                      <span>Visual Hiring Pipeline</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-accent/10 text-accent border border-accent/20">
                        Kanban Board
                      </span>
                    </h1>
                    <p className="text-xs text-ink-tertiary mt-0.5">
                      Drag or move applicants across 6 recruitment stages. Click any candidate card to open their dossier.
                    </p>
                  </div>

                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-accent hover:bg-accent/90 rounded-md shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Candidate</span>
                  </button>
                </div>

                <PipelineBoard
                  candidates={candidates}
                  onSelectCandidate={handleSelectCandidate}
                  onStageChange={handleBoardStageChange}
                  isLoading={isLoadingCandidates}
                />
              </div>
            )}

            {/* View 5: Interviews */}
            {activeView === 'interviews' && (
              <InterviewsView onOpenCandidate={handleSelectCandidate} />
            )}
          </div>
        </main>
      </div>

      {/* Add Candidate Modal */}
      <CandidateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCandidateCreated}
      />

      {/* Candidate Detail Drawer */}
      <CandidateDrawer
        candidate={selectedCandidate}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedCandidate(null);
        }}
        onRefresh={handleRefreshAll}
        onCandidateUpdated={(updated) => setSelectedCandidate(updated)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AtsWorkspace />
    </ToastProvider>
  );
}
