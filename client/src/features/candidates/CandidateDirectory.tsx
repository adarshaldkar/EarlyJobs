import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Users,
  X
} from 'lucide-react';
import { ApiRequestError } from '../../lib/api';
import { useCandidates, useUpdateCandidateStage } from './candidateHooks';
import AddCandidateDialog from './AddCandidateDialog';
import { Candidate, CandidateStageFilter, HIRING_STAGES, HiringStage } from './types';

type Toast = { type: 'success' | 'error'; message: string };

const stageStyles: Record<HiringStage, string> = {
  Applied: 'border-stone-200 bg-stone-100 text-stone-700',
  Screening: 'border-sky-200 bg-sky-50 text-sky-800',
  Interview: 'border-amber-200 bg-amber-50 text-amber-800',
  Offer: 'border-violet-200 bg-violet-50 text-violet-800',
  Hired: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  Rejected: 'border-rose-200 bg-rose-50 text-rose-800'
};

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

function StageBadge({ stage }: { stage: HiringStage }) {
  return (
    <span className={'inline-flex whitespace-nowrap rounded border px-2 py-1 text-xs font-medium ' + stageStyles[stage]}>
      {stage}
    </span>
  );
}

export default function CandidateDirectory() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<CandidateStageFilter>('All');
  const [sortBy, setSortBy] = useState<'createdAt' | 'name' | 'experienceYears'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim().slice(0, 100)), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, stageFilter, sortBy, sortOrder]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const query = useMemo(
    () => ({
      page,
      limit: 10,
      ...(search ? { search } : {}),
      ...(stageFilter !== 'All' ? { stage: stageFilter as HiringStage } : {}),
      sortBy,
      sortOrder
    }),
    [page, search, stageFilter, sortBy, sortOrder]
  );

  const candidatesQuery = useCandidates(query);
  const stageMutation = useUpdateCandidateStage();
  const candidates = candidatesQuery.data?.items ?? [];
  const pagination = candidatesQuery.data?.pagination;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);

  const resetFilters = () => {
    setSearchInput('');
    setSearch('');
    setStageFilter('All');
    setSortBy('createdAt');
    setSortOrder('desc');
    setPage(1);
  };

  const handleStageChange = async (candidate: Candidate, nextStage: HiringStage) => {
    if (candidate.stage === nextStage) return;

    try {
      await stageMutation.mutateAsync({
        id: candidate._id,
        currentStage: candidate.stage,
        newStage: nextStage
      });
      setToast({
        type: 'success',
        message: candidate.name + ' moved to ' + nextStage + '.'
      });
    } catch (error) {
      if (error instanceof ApiRequestError && error.code === 'STALE_STATE') {
        setToast({
          type: 'error',
          message: 'Candidate was updated by another session. Refreshed.'
        });
      } else {
        setToast({
          type: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Unable to update the hiring stage. Please try again.'
        });
      }
    }
  };

  const handleCandidateCreated = () => {
    setSearchInput('');
    setSearch('');
    setStageFilter('All');
    setPage(1);
    setToast({ type: 'success', message: 'Candidate added to the hiring pipeline.' });
  };

  return (
    <section aria-labelledby="candidate-directory-title" className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-ink-secondary">
            <span>Recruiting</span>
            <span aria-hidden="true">/</span>
            <span className="text-ink-primary">Candidates</span>
          </div>
          <h1 id="candidate-directory-title" className="mt-2 text-2xl font-semibold tracking-tight text-ink-primary">
            Candidates
          </h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Review applicants, search the pipeline, and keep hiring stages up to date.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          data-testid="add-candidate-button"
          className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 sm:self-auto"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add candidate
        </button>
      </div>

      <div className="rounded-lg border border-subtle bg-surface shadow-sm">
        <div className="space-y-4 border-b border-subtle p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-tertiary" aria-hidden="true" />
              <label htmlFor="candidate-search" className="sr-only">
                Search candidates
              </label>
              <input
                id="candidate-search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value.slice(0, 100))}
                maxLength={100}
                placeholder="Search name, email, or position"
                className="h-10 w-full rounded-md border border-subtle bg-white pl-9 pr-9 text-sm outline-none transition placeholder:text-ink-tertiary focus:border-accent focus:ring-2 focus:ring-accent/15"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    setSearch('');
                  }}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink-secondary hover:bg-stone-100"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm">
              <SlidersHorizontal className="h-4 w-4 text-ink-secondary" aria-hidden="true" />
              <label htmlFor="candidate-sort" className="whitespace-nowrap text-xs font-medium text-ink-secondary">
                Sort by
              </label>
              <select
                id="candidate-sort"
                value={sortBy + ':' + sortOrder}
                onChange={(event) => {
                  const [nextSortBy, nextSortOrder] = event.target.value.split(':');
                  setSortBy(nextSortBy as typeof sortBy);
                  setSortOrder(nextSortOrder as typeof sortOrder);
                }}
                className="h-10 min-w-40 rounded-md border border-subtle bg-white px-3 text-sm text-ink-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
              >
                <option value="createdAt:desc">Most recently added</option>
                <option value="createdAt:asc">Oldest added</option>
                <option value="name:asc">Name A–Z</option>
                <option value="experienceYears:desc">Most experience</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2" aria-label="Filter candidates by stage">
            {(['All', ...HIRING_STAGES] as CandidateStageFilter[]).map((stage) => {
              const active = stageFilter === stage;
              return (
                <button
                  key={stage}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setStageFilter(stage)}
                  className={
                    'rounded-md border px-3 py-1.5 text-xs font-medium transition ' +
                    (active
                      ? 'border-accent bg-accent-light text-accent'
                      : 'border-subtle bg-white text-ink-secondary hover:bg-stone-50 hover:text-ink-primary')
                  }
                >
                  {stage}
                </button>
              );
            })}
            {(searchInput || stageFilter !== 'All') && (
              <button
                type="button"
                onClick={resetFilters}
                className="ml-auto rounded-md px-2 py-1.5 text-xs font-medium text-ink-secondary underline-offset-2 hover:text-ink-primary hover:underline"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] border-collapse text-left">
            <caption className="sr-only">Candidate directory with contact details, experience and hiring stage</caption>
            <thead className="bg-stone-50/80">
              <tr className="border-b border-subtle text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-secondary">
                <th scope="col" className="px-5 py-3">Candidate</th>
                <th scope="col" className="px-4 py-3">Position</th>
                <th scope="col" className="px-4 py-3">Experience</th>
                <th scope="col" className="px-4 py-3">Date applied</th>
                <th scope="col" className="px-4 py-3">Stage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {candidates.map((candidate) => (
                <tr key={candidate._id} data-testid="candidate-row" className="transition hover:bg-stone-50/70">
                  <td className="px-5 py-3.5">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-accent/10 bg-accent-light text-xs font-semibold text-accent">
                        {initials(candidate.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="max-w-[220px] truncate text-sm font-semibold text-ink-primary" title={candidate.name}>
                          {candidate.name}
                        </p>
                        <p className="mt-0.5 max-w-[240px] truncate text-xs text-ink-secondary" title={candidate.email}>
                          {candidate.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="block max-w-[200px] truncate text-sm text-ink-primary" title={candidate.position}>
                      {candidate.position}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex rounded-md border border-subtle bg-stone-50 px-2 py-1 text-xs font-medium tabular-nums text-ink-primary">
                      {candidate.experienceYears} {candidate.experienceYears === 1 ? 'yr' : 'yrs'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-sm text-ink-secondary">
                    {formatDate(candidate.createdAt)}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <StageBadge stage={candidate.stage} />
                      <label className="sr-only" htmlFor={'stage-' + candidate._id}>
                        Stage for {candidate.name}
                      </label>
                      <select
                        id={'stage-' + candidate._id}
                        aria-label={'Stage for ' + candidate.name}
                        value={candidate.stage}
                        disabled={stageMutation.isPending}
                        onChange={(event) => handleStageChange(candidate, event.target.value as HiringStage)}
                        className="max-w-[130px] rounded-md border border-subtle bg-white px-2 py-1.5 text-xs text-ink-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:cursor-wait disabled:opacity-60"
                      >
                        {HIRING_STAGES.map((stage) => (
                          <option key={stage} value={stage}>{stage}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {candidatesQuery.isPending && (
          <div role="status" aria-live="polite" className="flex items-center justify-center gap-2 border-t border-subtle px-5 py-12 text-sm text-ink-secondary">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Loading candidates…
          </div>
        )}

        {candidatesQuery.isError && (
          <div role="alert" className="flex flex-col items-center gap-3 border-t border-subtle px-5 py-10 text-center">
            <AlertCircle className="h-5 w-5 text-rose-600" aria-hidden="true" />
            <p className="text-sm font-medium text-ink-primary">We couldn’t load the candidate list.</p>
            <p className="max-w-md text-xs text-ink-secondary">
              {candidatesQuery.error instanceof Error
                ? candidatesQuery.error.message
                : 'Check your connection and try again.'}
            </p>
            <button
              type="button"
              onClick={() => candidatesQuery.refetch()}
              className="inline-flex items-center gap-2 rounded-md border border-subtle bg-white px-3 py-2 text-sm font-medium hover:bg-stone-50"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Try again
            </button>
          </div>
        )}

        {!candidatesQuery.isPending && !candidatesQuery.isError && candidates.length === 0 && (
          <div className="flex flex-col items-center px-5 py-14 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-subtle bg-stone-50 text-ink-secondary">
              <Users className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-sm font-semibold text-ink-primary">
              {search || stageFilter !== 'All'
                ? 'No candidates match your filters'
                : 'Your candidate pipeline is empty'}
            </h2>
            <p className="mt-1 max-w-sm text-sm text-ink-secondary">
              {search || stageFilter !== 'All'
                ? 'Try another search or reset the filters to see all candidates.'
                : 'Add your first candidate to start tracking the hiring process.'}
            </p>
            {search || stageFilter !== 'All' ? (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 rounded-md border border-subtle bg-white px-3 py-2 text-sm font-medium hover:bg-stone-50"
              >
                Reset filters
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setDialogOpen(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-accent px-3 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add candidate
              </button>
            )}
          </div>
        )}

        {!candidatesQuery.isPending && !candidatesQuery.isError && candidates.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-subtle px-4 py-3.5 text-xs text-ink-secondary sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p>
              Showing <span className="font-semibold text-ink-primary">{(pagination?.page ? (pagination.page - 1) * (pagination.limit || 10) : 0) + 1}</span>
              {'–'}
              <span className="font-semibold text-ink-primary">
                {Math.min((pagination?.page ?? 1) * (pagination?.limit ?? 10), pagination?.total ?? candidates.length)}
              </span>
              {' '}of <span className="font-semibold text-ink-primary">{pagination?.total ?? candidates.length}</span> candidates
              {candidatesQuery.isFetching && <span className="ml-2">· Updating…</span>}
            </p>
            <div className="flex items-center justify-between gap-2 sm:justify-end">
              <span className="mr-1">Page {page} of {totalPages}</span>
              <button
                type="button"
                aria-label="Previous page"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="rounded-md border border-subtle bg-white p-1.5 text-ink-primary transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Next page"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                className="rounded-md border border-subtle bg-white p-1.5 text-ink-primary transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div
          role={toast.type === 'error' ? 'alert' : 'status'}
          aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
          className={
            'fixed bottom-4 right-4 z-50 flex max-w-[calc(100%-2rem)] items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg sm:max-w-md ' +
            (toast.type === 'error'
              ? 'border-rose-200 bg-white text-rose-800'
              : 'border-emerald-200 bg-white text-emerald-800')
          }
        >
          <span className="flex-1">{toast.message}</span>
          <button type="button" onClick={() => setToast(null)} aria-label="Dismiss notification" className="rounded p-0.5 hover:bg-stone-100">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {dialogOpen && (
        <AddCandidateDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onCreated={handleCandidateCreated}
        />
      )}
    </section>
  );
}
