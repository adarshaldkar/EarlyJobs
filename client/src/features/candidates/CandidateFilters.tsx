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
    <div className="space-y-3.5">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Left: Search Bar & Role Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 max-w-xl">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search by name, email, skills..."
              data-testid="search-input"
              className="w-full pl-10 pr-9 py-2 text-xs bg-white border border-slate-200/90 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
            />
            {localSearch && (
              <button
                onClick={() => {
                  setLocalSearch('');
                  onSearchChange('');
                }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Role / Requisition Selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 min-w-[180px]">
            <Briefcase className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedPosition}
              onChange={(e) => onPositionChange(e.target.value)}
              data-testid="role-filter-select"
              aria-label="Filter by job role"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200/90 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs cursor-pointer"
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
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
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
              className="px-3 py-2 text-xs bg-white border border-slate-200/90 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs cursor-pointer"
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
            className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 shadow-2xs"
            role="group"
            aria-label="View toggle"
          >
            <button
              onClick={() => onViewModeChange('table')}
              data-testid="view-toggle-table"
              title="Table view"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span className="text-[11px] hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => onViewModeChange('board')}
              data-testid="view-toggle-board"
              title="Pipeline Kanban view"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'board'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
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
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200/90 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              Reset
            </button>
          )}

          <button
            onClick={onOpenCreateModal}
            data-testid="add-candidate-btn"
            className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 rounded-xl flex items-center gap-1.5 shadow-sm shadow-indigo-500/20 transition-all cursor-pointer whitespace-nowrap active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Add Candidate
          </button>
        </div>
      </div>

      {/* Stage Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="text-slate-400 flex items-center gap-1 pr-1 text-[11px] font-bold uppercase tracking-wider shrink-0">
          <Filter className="h-3 w-3" />
          Stage:
        </span>
        <button
          onClick={() => onStageChange('')}
          data-testid="stage-filter-all"
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
            selectedStage === ''
              ? 'bg-slate-900 text-white font-semibold shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200/80 shadow-2xs'
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
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200/80 shadow-2xs'
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
