import React, { useState, useEffect } from 'react';
import { Search, X, Plus, Filter } from 'lucide-react';
import { HIRING_STAGES, HiringStage } from '../../types';

interface CandidateFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  selectedStage: string;
  onStageChange: (stage: string) => void;
  onOpenCreateModal: () => void;
  totalCandidates: number;
}

export const CandidateFilters: React.FC<CandidateFiltersProps> = ({
  search,
  onSearchChange,
  selectedStage,
  onStageChange,
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

  const hasActiveFilters = Boolean(search || selectedStage);

  const handleReset = () => {
    setLocalSearch('');
    onSearchChange('');
    onStageChange('');
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-secondary">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search candidates by name, email, position..."
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

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              data-testid="reset-filters-btn"
              className="px-2.5 py-1.5 text-xs text-ink-secondary hover:text-ink-primary hover:bg-stone-100 rounded border border-subtle flex items-center gap-1.5 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Reset Filters
            </button>
          )}

          <button
            onClick={onOpenCreateModal}
            data-testid="add-candidate-btn"
            className="px-3 py-1.5 text-xs font-medium text-white bg-accent hover:bg-accent-hover rounded flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Candidate
          </button>
        </div>
      </div>

      {/* Stage Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-ink-tertiary flex items-center gap-1 pr-1 text-[11px] font-medium uppercase tracking-wider">
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
