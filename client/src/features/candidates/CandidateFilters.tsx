import React, { useState, useEffect } from 'react';
import {
  Search,
  X,
  Plus,
  Filter,
  SlidersHorizontal,
  Briefcase,
  LayoutGrid,
  List
} from 'lucide-react';
import { HIRING_STAGES, HiringStage } from '../../types';

export const REQUISITION_ROLES = [
  'All Roles',
  'Full Stack Engineer',
  'Frontend Developer',
  'Backend Developer',
  'DevOps Engineer',
  'Mobile Developer',
  'UI/UX Designer & Frontend',
  'QA Automation Engineer',
  'Data Engineer',
  'Engineering Manager',
  'Product Manager'
] as const;

interface CandidateFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  selectedStage: string;
  onStageChange: (stage: string) => void;
  selectedPosition?: string;
  onPositionChange: (pos: string) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  viewMode: 'table' | 'board';
  onViewModeChange: (mode: 'table' | 'board') => void;
  onOpenCreateModal: () => void;
  totalCandidates: number;
}

export const CandidateFilters: React.FC<CandidateFiltersProps> = ({
  search,
  onSearchChange,
  selectedStage,
  onStageChange,
  selectedPosition = '',
  onPositionChange,
  sortBy,
  sortOrder,
  onSortChange,
  viewMode,
  onViewModeChange,
  onOpenCreateModal,
  totalCandidates
}) => {
  const [localSearch, setLocalSearch] = useState(search);

  // Sync internal state with external search prop
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  // 300ms debounce for search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== search) {
        onSearchChange(localSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, search, onSearchChange]);

  const hasActiveFilters = Boolean(
    search ||
      selectedStage ||
      selectedPosition ||
      sortBy !== 'createdAt' ||
      sortOrder !== 'desc'
  );

  const handleReset = () => {
    setLocalSearch('');
    onSearchChange('');
    onStageChange('');
    onPositionChange('');
    onSortChange('createdAt', 'desc');
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Left: Search Bar & Role Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 max-w-xl">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-secondary">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search by name, email, skills..."
              data-testid="search-input"
              className="w-full pl-9 pr-8 py-2 text-xs bg-surface border border-subtle rounded text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
            />
            {localSearch && (
              <button
                onClick={() => {
                  setLocalSearch('');
                  onSearchChange('');
                }}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-ink-tertiary hover:text-ink-primary"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Role / Requisition Selector */}
          <div className="flex items-center gap-1.5 text-xs text-ink-secondary min-w-[180px]">
            <Briefcase className="h-3.5 w-3.5 text-ink-tertiary shrink-0" />
            <select
              value={selectedPosition}
              onChange={(e) => onPositionChange(e.target.value)}
              data-testid="role-filter-select"
              aria-label="Filter by job role"
              className="w-full px-2.5 py-2 text-xs bg-surface border border-subtle rounded text-ink-primary focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">All Roles</option>
              {REQUISITION_ROLES.filter((r) => r !== 'All Roles').map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Controls: Sort, View Toggle, Reset, Add */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
          {/* Server-Side Sort Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-ink-secondary">
            <SlidersHorizontal className="h-3.5 w-3.5 text-ink-tertiary" />
            <select
              value={`${sortBy}:${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split(':') as [
                  string,
                  'asc' | 'desc'
                ];
                onSortChange(newSortBy, newSortOrder);
              }}
              data-testid="sort-select"
              aria-label="Sort candidates by"
              className="px-2.5 py-1.5 text-xs bg-surface border border-subtle rounded text-ink-primary focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="createdAt:desc">Recently Added</option>
              <option value="createdAt:asc">Oldest Added</option>
              <option value="rating:desc">Highest Rated (★ 5-1)</option>
              <option value="name:asc">Name (A–Z)</option>
              <option value="name:desc">Name (Z–A)</option>
              <option value="experienceYears:desc">Most Experience</option>
              <option value="experienceYears:asc">Least Experience</option>
            </select>
          </div>

          {/* View Toggle: List vs Board */}
          <div
            className="flex items-center bg-stone-100 p-0.5 rounded border border-subtle"
            role="group"
            aria-label="View toggle"
          >
            <button
              onClick={() => onViewModeChange('table')}
              data-testid="view-toggle-table"
              title="Table view"
              className={`p-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
                viewMode === 'table'
                  ? 'bg-surface text-ink-primary shadow-xs'
                  : 'text-ink-secondary hover:text-ink-primary'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span className="text-[11px] hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => onViewModeChange('board')}
              data-testid="view-toggle-board"
              title="Pipeline Kanban view"
              className={`p-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
                viewMode === 'board'
                  ? 'bg-surface text-ink-primary shadow-xs'
                  : 'text-ink-secondary hover:text-ink-primary'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="text-[11px] hidden sm:inline">Pipeline</span>
            </button>
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleReset}
              data-testid="reset-filters-btn"
              className="px-2.5 py-1.5 text-xs text-ink-secondary hover:text-ink-primary hover:bg-stone-100 rounded border border-subtle flex items-center gap-1.5 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Reset
            </button>
          )}

          <button
            onClick={onOpenCreateModal}
            data-testid="add-candidate-btn"
            className="px-3 py-1.5 text-xs font-medium text-white bg-accent hover:bg-accent-hover rounded flex items-center gap-1.5 shadow-sm transition-colors whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            Add Candidate
          </button>
        </div>
      </div>

      {/* Stage Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-ink-tertiary flex items-center gap-1 pr-1 text-[11px] font-medium uppercase tracking-wider shrink-0">
          <Filter className="h-3 w-3" />
          Stage:
        </span>
        <button
          onClick={() => onStageChange('')}
          data-testid="stage-filter-all"
          className={`px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap ${
            selectedStage === ''
              ? 'bg-ink-primary text-white font-medium'
              : 'bg-surface text-ink-secondary hover:text-ink-primary border border-subtle'
          }`}
        >
          All Stages ({totalCandidates})
        </button>
        {HIRING_STAGES.map((stage) => {
          const isSelected = selectedStage === stage;
          return (
            <button
              key={stage}
              onClick={() => onStageChange(isSelected ? '' : stage)}
              data-testid={`stage-filter-${stage.toLowerCase()}`}
              className={`px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap ${
                isSelected
                  ? 'bg-accent text-white font-medium'
                  : 'bg-surface text-ink-secondary hover:text-ink-primary border border-subtle'
              }`}
            >
              {stage}
            </button>
          );
        })}
      </div>
    </div>
  );
};
