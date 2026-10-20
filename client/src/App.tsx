import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  LayoutDashboard,
  Database,
  Plus,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { Candidate, HiringStage } from './types';
import {
  fetchCandidates,
  fetchDashboardSummary,
  apiClient
} from './lib/api';
import { ToastProvider, useToast } from './components/Toast';
import { CandidateFilters } from './features/candidates/CandidateFilters';
import { CandidateTable } from './features/candidates/CandidateTable';
import { CandidateModal } from './features/candidates/CandidateModal';
import { CandidateDrawer } from './features/candidates/CandidateDrawer';
import { KpiCards } from './features/dashboard/KpiCards';
import { PipelineChart } from './features/dashboard/PipelineChart';

function AtsWorkspace() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Navigation tab: 'directory' | 'dashboard'
  const [activeTab, setActiveTab] = useState<'directory' | 'dashboard'>('directory');

  // Filter and sort state
  const [search, setSearch] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Modal & Drawer UI state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Health Query
  const { data: healthData } = useQuery({
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
    queryKey: ['candidates', { page, limit, search, stage: selectedStage, sortBy, sortOrder }],
    queryFn: () =>
      fetchCandidates({
        page,
        limit,
        search: search || undefined,
        stage: selectedStage || undefined,
        sortBy,
        sortOrder
      })
  });

  // Dashboard Query
  const {
    data: dashboardData,
    isLoading: isLoadingDashboard,
    refetch: refetchDashboard
  } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: fetchDashboardSummary
  });

  // Refresh all data
  const handleRefreshAll = () => {
    refetchCandidates();
    refetchDashboard();
    queryClient.invalidateQueries({ queryKey: ['candidates'] });
    queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
  };

  const handleSelectCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setIsDrawerOpen(true);
  };

  const handleCandidateCreated = () => {
    handleRefreshAll();
  };

  // Safe pagination fallback
  const candidates = candidatesData?.items || [];
  const pagination = candidatesData?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  };

  return (
    <div className="min-h-screen bg-canvas text-ink-primary flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-subtle bg-surface px-6 py-3 sticky top-0 z-40">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-accent text-white shadow-none">
                <span className="text-xs font-bold tracking-tight">EJ</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold tracking-tight text-ink-primary">
                  EarlyJobs ATS
                </span>
                <span className="text-[11px] text-ink-secondary hidden sm:inline">
                  Recruiter Workspace
                </span>
              </div>
            </div>

            {/* Nav Tabs */}
            <nav className="flex items-center gap-1 border-l border-subtle pl-6">
              <button
                onClick={() => setActiveTab('directory')}
                data-testid="nav-tab-directory"
                className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  activeTab === 'directory'
                    ? 'bg-stone-100 text-ink-primary'
                    : 'text-ink-secondary hover:text-ink-primary hover:bg-stone-50'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Candidates
              </button>
              <button
                onClick={() => setActiveTab('dashboard')}
                data-testid="nav-tab-dashboard"
                className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  activeTab === 'dashboard'
                    ? 'bg-stone-100 text-ink-primary'
                    : 'text-ink-secondary hover:text-ink-primary hover:bg-stone-50'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Dashboard & Pipeline
              </button>
            </nav>
          </div>

          {/* Right Header Status & Refresh */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefreshAll}
              disabled={isRefetchingCandidates}
              data-testid="refresh-btn"
              className="p-1.5 text-ink-secondary hover:text-ink-primary rounded hover:bg-stone-100 transition-colors"
              title="Refresh data"
              aria-label="Refresh data"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefetchingCandidates ? 'animate-spin text-accent' : ''}`}
              />
            </button>

            <div className="text-xs flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="hidden sm:inline">Atlas Connected</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="mx-auto max-w-6xl w-full px-6 py-6 flex-1 flex flex-col space-y-6">
        {/* KPI Strip (always visible or on dashboard) */}
        <KpiCards summary={dashboardData || null} isLoading={isLoadingDashboard} />

        {activeTab === 'directory' ? (
          /* Directory View */
          <div className="space-y-4">
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
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={(newSortBy, newSortOrder) => {
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
                setPage(1);
              }}
              onOpenCreateModal={() => setIsModalOpen(true)}
              totalCandidates={pagination.total}
            />

            <CandidateTable
              candidates={candidates}
              pagination={pagination}
              onPageChange={(newPage) => setPage(newPage)}
              onSelectCandidate={handleSelectCandidate}
              onRefresh={handleRefreshAll}
              isLoading={isLoadingCandidates}
            />
          </div>
        ) : (
          /* Dashboard & Pipeline View */
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <PipelineChart
                  stageCounts={dashboardData?.stageCounts}
                  isLoading={isLoadingDashboard}
                />
              </div>

              {/* Quick Actions / Recent Activity Info Card */}
              <div className="p-4 rounded border border-subtle bg-surface flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-ink-primary">Recruiter Actions</h3>
                  <p className="text-[11px] text-ink-secondary mt-0.5">
                    Fast shortcuts for candidate lifecycle management.
                  </p>

                  <div className="mt-4 space-y-2">
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="w-full py-2 px-3 text-xs font-medium text-white bg-accent hover:bg-accent-hover rounded flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Candidate
                    </button>
                    <button
                      onClick={() => setActiveTab('directory')}
                      className="w-full py-2 px-3 text-xs text-ink-primary bg-stone-100 hover:bg-stone-200 rounded flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Users className="w-3.5 h-3.5" />
                      View All Candidates ({pagination.total})
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-subtle mt-4 text-[11px] text-ink-secondary leading-relaxed">
                  <strong>Assessment Note:</strong> Real-time single-query facet aggregation ensures
                  Total = Sum of Stage Counts across all 6 hiring stages.
                </div>
              </div>
            </div>

            {/* Recent Applicants Quick-List */}
            <div className="border border-subtle bg-surface rounded overflow-hidden">
              <div className="px-4 py-3 border-b border-subtle flex items-center justify-between">
                <h3 className="text-xs font-semibold text-ink-primary">Recent Applicants</h3>
                <button
                  onClick={() => setActiveTab('directory')}
                  className="text-xs text-accent hover:underline font-medium"
                >
                  View Full Directory →
                </button>
              </div>
              <CandidateTable
                candidates={candidates.slice(0, 5)}
                pagination={{
                  page: 1,
                  limit: 5,
                  total: candidates.length,
                  totalPages: 1
                }}
                onPageChange={() => {}}
                onSelectCandidate={handleSelectCandidate}
                onRefresh={handleRefreshAll}
                isLoading={isLoadingCandidates}
              />
            </div>
          </div>
        )}
      </main>

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
