import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  MapPin,
  Clock,
  Users,
  Search,
  Filter,
  CheckCircle2,
  Trash2,
  ExternalLink,
  ChevronRight,
  Layers,
  Sparkles,
  X,
  AlertCircle
} from 'lucide-react';
import { Job } from '../../types';
import { fetchJobs, createJob, deleteJob, getApiErrorMessage } from '../../lib/api';
import { useToast } from '../../components/Toast';

interface JobsViewProps {
  onViewApplicants: (jobTitle: string) => void;
}

export const JobsView: React.FC<JobsViewProps> = ({ onViewApplicants }) => {
  const { showToast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Job Form State
  const [formData, setFormData] = useState({
    title: '',
    department: 'Engineering',
    location: 'Bengaluru (Hybrid)',
    type: 'Full-time',
    status: 'Open' as 'Open' | 'Draft' | 'Closed',
    experienceMin: 2,
    experienceMax: 5,
    openingsCount: 1,
    description: '',
    requirements: ''
  });
  const [formError, setFormError] = useState<string | null>(null);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const res = await fetchJobs();
      setJobs(res);
    } catch (err) {
      showToast({ type: 'error', message: getApiErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFormError('Job title is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      const reqList = formData.requirements
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean);

      await createJob({
        title: formData.title.trim(),
        department: formData.department,
        location: formData.location.trim(),
        type: formData.type,
        status: formData.status,
        experienceMin: Number(formData.experienceMin),
        experienceMax: Number(formData.experienceMax),
        openingsCount: Number(formData.openingsCount),
        description: formData.description.trim() || undefined,
        requirements: reqList
      });

      showToast({ type: 'success', message: `Job opening "${formData.title}" created successfully` });
      setIsCreateModalOpen(false);
      setFormData({
        title: '',
        department: 'Engineering',
        location: 'Bengaluru (Hybrid)',
        type: 'Full-time',
        status: 'Open',
        experienceMin: 2,
        experienceMax: 5,
        openingsCount: 1,
        description: '',
        requirements: ''
      });
      loadJobs();
    } catch (err) {
      setFormError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteJob = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete the job opening "${title}"?`)) return;
    try {
      await deleteJob(id);
      showToast({ type: 'success', message: `Job "${title}" deleted` });
      setJobs((prev) => prev.filter((j) => j._id !== id));
    } catch (err) {
      showToast({ type: 'error', message: getApiErrorMessage(err) });
    }
  };

  const departments = ['All', ...Array.from(new Set(jobs.map((j) => j.department)))];

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.location.toLowerCase().includes(search.toLowerCase());
    const matchesDept = selectedDept === 'All' || job.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Header & Requisition KPI Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-subtle">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink-primary flex items-center gap-2">
            <span>Job Openings & Requisitions</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200">
              {jobs.length} Active Roles
            </span>
          </h1>
          <p className="text-xs text-ink-tertiary mt-1">
            Manage open requisitions, hiring criteria, and view candidate pipeline progression per role.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          data-testid="create-job-btn"
          className="px-3.5 py-2 text-xs font-semibold text-white bg-accent hover:bg-accent/90 active:bg-accent/95 rounded-md shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Job Opening</span>
        </button>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search job titles or locations..."
            data-testid="jobs-search-input"
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface border border-subtle rounded-md text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:ring-1 focus:ring-accent shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-tertiary flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Dept:
          </span>
          <div className="flex items-center gap-1 bg-surface border border-subtle p-0.5 rounded-md overflow-x-auto no-scrollbar">
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`px-2.5 py-1 text-xs rounded transition-colors whitespace-nowrap ${
                  selectedDept === dept
                    ? 'bg-accent text-white font-medium shadow-2xs'
                    : 'text-ink-secondary hover:text-ink-primary'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Jobs Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 rounded-lg bg-surface border border-subtle animate-pulse" />
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="p-12 text-center bg-surface border border-subtle rounded-lg space-y-3">
          <Briefcase className="w-10 h-10 text-stone-300 mx-auto" />
          <h3 className="text-sm font-semibold text-ink-primary">No job openings found</h3>
          <p className="text-xs text-ink-tertiary max-w-md mx-auto">
            {search
              ? `No job matching "${search}". Clear the search or create a new job opening.`
              : 'There are no job openings registered in this department.'}
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3 py-1.5 text-xs font-medium text-accent bg-accent/10 border border-accent/20 rounded hover:bg-accent/15 transition-colors"
          >
            + Create First Job Opening
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4" data-testid="jobs-grid">
          {filteredJobs.map((job) => (
            <div
              key={job._id}
              data-testid={`job-card-${job._id}`}
              className="bg-surface rounded-lg border border-subtle p-4 flex flex-col justify-between hover:border-stone-400/70 transition-all shadow-xs group"
            >
              <div>
                {/* Header Badge & Status */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200">
                    {job.department}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        job.status === 'Open'
                          ? 'bg-emerald-500'
                          : job.status === 'Draft'
                          ? 'bg-amber-500'
                          : 'bg-stone-400'
                      }`}
                    />
                    <span className="text-[11px] font-medium text-ink-secondary">{job.status}</span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-sm font-bold text-ink-primary group-hover:text-accent transition-colors">
                  {job.title}
                </h3>

                {/* Location & Meta */}
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-ink-tertiary">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {job.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {job.type}
                  </span>
                  {job.experienceMin !== undefined && (
                    <span>
                      {job.experienceMin}–{job.experienceMax || '+'} yrs exp
                    </span>
                  )}
                </div>

                {/* Description snippet */}
                {job.description && (
                  <p className="text-xs text-ink-secondary mt-2.5 line-clamp-2 leading-relaxed">
                    {job.description}
                  </p>
                )}

                {/* Requirements tags */}
                {job.requirements && job.requirements.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {job.requirements.slice(0, 4).map((req) => (
                      <span
                        key={req}
                        className="px-1.5 py-0.5 text-[10px] rounded bg-stone-50 text-stone-600 border border-stone-200"
                      >
                        {req}
                      </span>
                    ))}
                    {job.requirements.length > 4 && (
                      <span className="px-1.5 py-0.5 text-[10px] rounded bg-stone-50 text-ink-tertiary border border-stone-200">
                        +{job.requirements.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Card Footer */}
              <div className="mt-4 pt-3 border-t border-subtle flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-xs font-semibold text-ink-primary bg-stone-100 px-2.5 py-1 rounded border border-stone-200">
                    <Users className="w-3.5 h-3.5 text-accent" />
                    <span>{job.applicantCount || 0} Applicants</span>
                  </div>
                  <span className="text-[11px] text-ink-tertiary">
                    {job.openingsCount} {job.openingsCount === 1 ? 'opening' : 'openings'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleDeleteJob(job._id, job.title)}
                    className="p-1.5 text-ink-tertiary hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                    title="Delete Job Opening"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onViewApplicants(job.title)}
                    data-testid={`view-applicants-${job._id}`}
                    className="px-2.5 py-1 text-xs font-medium text-accent bg-accent/10 hover:bg-accent/20 rounded border border-accent/20 flex items-center gap-1 transition-colors"
                  >
                    <span>View Applicants</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Job Opening Modal */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-surface rounded-lg shadow-xl border border-subtle overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-subtle bg-canvas">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-accent" />
                <h2 className="text-sm font-bold text-ink-primary">Create New Job Opening</h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-ink-tertiary hover:text-ink-primary rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block font-medium text-ink-primary mb-1">
                  Job Title <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Senior Full Stack Engineer"
                  data-testid="input-job-title"
                  className="w-full px-3 py-2 bg-canvas border border-subtle rounded text-ink-primary focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-ink-primary mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 bg-canvas border border-subtle rounded text-ink-primary focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Design">Design</option>
                    <option value="Product">Product</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Talent & People">Talent & People</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-ink-primary mb-1">Employment Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 bg-canvas border border-subtle rounded text-ink-primary focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-ink-primary mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Bengaluru (Hybrid) or Remote"
                    className="w-full px-3 py-2 bg-canvas border border-subtle rounded text-ink-primary focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block font-medium text-ink-primary mb-1">Target Openings</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.openingsCount}
                    onChange={(e) => setFormData({ ...formData, openingsCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-canvas border border-subtle rounded text-ink-primary focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-ink-primary mb-1">Min Experience (Years)</label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={formData.experienceMin}
                    onChange={(e) => setFormData({ ...formData, experienceMin: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-canvas border border-subtle rounded text-ink-primary focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block font-medium text-ink-primary mb-1">Max Experience (Years)</label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={formData.experienceMax}
                    onChange={(e) => setFormData({ ...formData, experienceMax: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-canvas border border-subtle rounded text-ink-primary focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-ink-primary mb-1">
                  Required Skills / Stack (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  placeholder="e.g. React, TypeScript, Node.js, MongoDB"
                  className="w-full px-3 py-2 bg-canvas border border-subtle rounded text-ink-primary focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block font-medium text-ink-primary mb-1">Role Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the mission, key responsibilities, and team context..."
                  className="w-full px-3 py-2 bg-canvas border border-subtle rounded text-ink-primary focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="pt-3 border-t border-subtle flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 text-ink-secondary hover:text-ink-primary bg-surface hover:bg-stone-100 rounded border border-subtle transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  data-testid="submit-create-job-btn"
                  className="px-4 py-1.5 font-semibold text-white bg-accent hover:bg-accent/90 rounded shadow-xs transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Job Opening'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
