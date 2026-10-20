import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Video,
  User,
  Plus,
  Star,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Search,
  Filter,
  Trash2,
  X,
  ChevronRight,
  Briefcase
} from 'lucide-react';
import { Interview, Candidate } from '../../types';
import {
  fetchInterviews,
  createInterview,
  updateInterview,
  deleteInterview,
  fetchCandidates,
  getApiErrorMessage
} from '../../lib/api';
import { useToast } from '../../components/Toast';

interface InterviewsViewProps {
  onOpenCandidate?: (candidate: Candidate) => void;
}

export const InterviewsView: React.FC<InterviewsViewProps> = ({ onOpenCandidate }) => {
  const { showToast } = useToast();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'Scheduled' | 'Completed'>('all');

  // Schedule Modal State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    candidateEmail: '',
    candidateName: '',
    position: 'Full Stack Engineer',
    round: 'Technical Architecture & System Design',
    interviewer: 'Sarah Jenkins (VP Engineering)',
    scheduledDate: '',
    scheduledTime: '14:00',
    durationMinutes: 45,
    meetingLink: 'https://meet.google.com/ej-interview-loop'
  });

  // Feedback Modal State
  const [selectedInterviewForFeedback, setSelectedInterviewForFeedback] = useState<Interview | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [intRes, candRes] = await Promise.all([
        fetchInterviews(),
        fetchCandidates({ limit: 100 })
      ]);
      setInterviews(intRes);
      setCandidates(candRes.items);
    } catch (err) {
      showToast({ type: 'error', message: getApiErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCandidateSelect = (email: string) => {
    const cand = candidates.find((c) => c.email === email);
    if (cand) {
      setScheduleForm((prev) => ({
        ...prev,
        candidateEmail: cand.email,
        candidateName: cand.name,
        position: cand.position
      }));
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleForm.candidateName.trim() || !scheduleForm.scheduledDate) {
      showToast({ type: 'error', message: 'Candidate name and scheduled date are required.' });
      return;
    }

    try {
      setIsSubmitting(true);
      const [year, month, day] = scheduleForm.scheduledDate.split('-').map(Number);
      const [hour, minute] = scheduleForm.scheduledTime.split(':').map(Number);
      const scheduledAt = new Date(year, month - 1, day, hour, minute);

      const cand = candidates.find((c) => c.email === scheduleForm.candidateEmail);

      await createInterview({
        candidateId: cand?._id,
        candidateName: scheduleForm.candidateName.trim(),
        candidateEmail: scheduleForm.candidateEmail.trim() || `${scheduleForm.candidateName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        position: scheduleForm.position.trim(),
        round: scheduleForm.round.trim(),
        interviewer: scheduleForm.interviewer.trim(),
        scheduledAt: scheduledAt.toISOString(),
        durationMinutes: Number(scheduleForm.durationMinutes),
        meetingLink: scheduleForm.meetingLink.trim() || undefined,
        status: 'Scheduled'
      });

      showToast({ type: 'success', message: 'Interview scheduled successfully' });
      setIsScheduleModalOpen(false);
      loadData();
    } catch (err) {
      showToast({ type: 'error', message: getApiErrorMessage(err) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInterviewForFeedback) return;

    try {
      setIsSubmitting(true);
      await updateInterview(selectedInterviewForFeedback._id, {
        status: 'Completed',
        feedback: feedbackText.trim(),
        rating: Number(feedbackRating)
      });

      showToast({ type: 'success', message: 'Interview feedback logged successfully' });
      setSelectedInterviewForFeedback(null);
      setFeedbackText('');
      loadData();
    } catch (err) {
      showToast({ type: 'error', message: getApiErrorMessage(err) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel and remove this interview?')) return;
    try {
      await deleteInterview(id);
      showToast({ type: 'success', message: 'Interview removed' });
      setInterviews((prev) => prev.filter((i) => i._id !== id));
    } catch (err) {
      showToast({ type: 'error', message: getApiErrorMessage(err) });
    }
  };

  const filteredInterviews = interviews.filter((item) => {
    const matchesSearch =
      item.candidateName.toLowerCase().includes(search.toLowerCase()) ||
      item.position.toLowerCase().includes(search.toLowerCase()) ||
      item.round.toLowerCase().includes(search.toLowerCase()) ||
      item.interviewer.toLowerCase().includes(search.toLowerCase());

    const matchesTab = activeTab === 'all' || item.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const scheduledCount = interviews.filter((i) => i.status === 'Scheduled').length;
  const completedCount = interviews.filter((i) => i.status === 'Completed').length;

  return (
    <div className="space-y-6 animate-in fade-in" data-testid="interviews-view">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-subtle">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink-primary flex items-center gap-2">
            <span>Interview Loops & Rounds</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200">
              {scheduledCount} Upcoming
            </span>
          </h1>
          <p className="text-xs text-ink-tertiary mt-1">
            Track scheduled interview loops, rounds, feedback scores, and recruiter evaluation notes.
          </p>
        </div>

        <button
          onClick={() => {
            // Set default date to tomorrow
            const tomorrow = new Date(Date.now() + 86400000);
            const dateStr = tomorrow.toISOString().split('T')[0];
            setScheduleForm((prev) => ({ ...prev, scheduledDate: dateStr }));
            setIsScheduleModalOpen(true);
          }}
          data-testid="schedule-interview-btn"
          className="px-3.5 py-2 text-xs font-semibold text-white bg-accent hover:bg-accent/90 active:bg-accent/95 rounded-md shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Interview</span>
        </button>
      </div>

      {/* Toolbar & Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidate, interviewer, or round..."
            data-testid="interviews-search-input"
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface border border-subtle rounded-md text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:ring-1 focus:ring-accent shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-1 bg-surface border border-subtle p-0.5 rounded-md self-start sm:self-auto overflow-x-auto no-scrollbar max-w-full">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 text-xs rounded transition-colors whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-accent text-white font-medium shadow-2xs'
                : 'text-ink-secondary hover:text-ink-primary'
            }`}
          >
            All ({interviews.length})
          </button>
          <button
            onClick={() => setActiveTab('Scheduled')}
            className={`px-3 py-1 text-xs rounded transition-colors whitespace-nowrap ${
              activeTab === 'Scheduled'
                ? 'bg-accent text-white font-medium shadow-2xs'
                : 'text-ink-secondary hover:text-ink-primary'
            }`}
          >
            Scheduled ({scheduledCount})
          </button>
          <button
            onClick={() => setActiveTab('Completed')}
            className={`px-3 py-1 text-xs rounded transition-colors whitespace-nowrap ${
              activeTab === 'Completed'
                ? 'bg-accent text-white font-medium shadow-2xs'
                : 'text-ink-secondary hover:text-ink-primary'
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>
      </div>

      {/* Interviews List Cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-lg bg-surface border border-subtle animate-pulse" />
          ))}
        </div>
      ) : filteredInterviews.length === 0 ? (
        <div className="p-12 text-center bg-surface border border-subtle rounded-lg space-y-3">
          <Calendar className="w-10 h-10 text-stone-300 mx-auto" />
          <h3 className="text-sm font-semibold text-ink-primary">No interviews found</h3>
          <p className="text-xs text-ink-tertiary max-w-md mx-auto">
            {search
              ? `No interview round matches "${search}".`
              : 'There are no interview loops currently scheduled in this view.'}
          </p>
          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="px-3 py-1.5 text-xs font-medium text-accent bg-accent/10 border border-accent/20 rounded hover:bg-accent/15 transition-colors"
          >
            + Schedule First Interview
          </button>
        </div>
      ) : (
        <div className="space-y-3" data-testid="interviews-list">
          {filteredInterviews.map((item) => {
            const isCompleted = item.status === 'Completed';
            const scheduledDate = new Date(item.scheduledAt);
            const dateStr = scheduledDate.toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            });
            const timeStr = scheduledDate.toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={item._id}
                data-testid={`interview-card-${item._id}`}
                className="bg-surface rounded-lg border border-subtle p-4 hover:border-stone-400/70 transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isCompleted
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-sky-50 text-sky-700 border border-sky-200'
                      }`}
                    >
                      {item.status}
                    </span>
                    <span className="text-xs font-bold text-ink-primary">{item.round}</span>
                    <span className="text-ink-tertiary text-xs">·</span>
                    <span className="text-xs text-ink-secondary">{item.position}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5 font-medium text-ink-primary">
                      <User className="w-3.5 h-3.5 text-accent" />
                      <span>{item.candidateName}</span>
                    </div>

                    <div className="flex items-center gap-1 text-ink-secondary">
                      <span className="text-ink-tertiary">Interviewer:</span>
                      <span className="font-medium text-ink-primary">{item.interviewer}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-ink-tertiary">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {dateStr} at {timeStr} ({item.durationMinutes}m)
                      </span>
                    </div>
                  </div>

                  {/* Feedback Snippet */}
                  {isCompleted && item.feedback && (
                    <div className="p-2.5 rounded bg-stone-50 border border-subtle text-xs text-ink-secondary flex items-start gap-2 mt-1">
                      <MessageSquare className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="font-semibold text-ink-primary text-[11px]">Evaluation Score:</span>
                          <div className="flex text-amber-400">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3 h-3 ${
                                  s <= (item.rating || 0) ? 'fill-amber-400' : 'text-stone-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="italic text-ink-secondary line-clamp-2">"{item.feedback}"</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 self-start md:self-center shrink-0">
                  {item.meetingLink && !isCompleted && (
                    <a
                      href={item.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-xs font-medium text-white bg-accent hover:bg-accent/90 rounded flex items-center gap-1.5 shadow-2xs transition-colors"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Join Meeting</span>
                    </a>
                  )}

                  {!isCompleted ? (
                    <button
                      onClick={() => {
                        setSelectedInterviewForFeedback(item);
                        setFeedbackRating(item.rating || 5);
                        setFeedbackText(item.feedback || '');
                      }}
                      data-testid={`log-feedback-btn-${item._id}`}
                      className="px-3 py-1.5 text-xs font-medium text-ink-primary bg-surface hover:bg-stone-100 border border-subtle rounded flex items-center gap-1.5 shadow-2xs transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Log Feedback</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedInterviewForFeedback(item);
                        setFeedbackRating(item.rating || 5);
                        setFeedbackText(item.feedback || '');
                      }}
                      className="px-2.5 py-1 text-xs text-ink-secondary hover:text-ink-primary bg-surface hover:bg-stone-100 border border-subtle rounded transition-colors"
                    >
                      Edit Feedback
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(item._id)}
                    className="p-1.5 text-ink-tertiary hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                    title="Remove Interview"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Interview Modal */}
      {isScheduleModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsScheduleModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-surface rounded-lg shadow-xl border border-subtle overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-subtle bg-canvas">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-accent" />
                <h2 className="text-sm font-bold text-ink-primary">Schedule Interview Loop</h2>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="p-1 text-ink-tertiary hover:text-ink-primary rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-ink-primary mb-1">
                  Select Existing Candidate
                </label>
                <select
                  value={scheduleForm.candidateEmail}
                  onChange={(e) => handleCandidateSelect(e.target.value)}
                  className="w-full px-3 py-2 bg-canvas border border-subtle rounded text-ink-primary focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="">-- Choose Candidate (or type below) --</option>
                  {candidates.map((c) => (
                    <option key={c._id} value={c.email}>
                      {c.name} — {c.position} ({c.stage})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-ink-primary mb-1">
                  Candidate Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={scheduleForm.candidateName}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, candidateName: e.target.value })}
                  placeholder="e.g. Aarav Patel"
                  data-testid="input-interview-candidate"
                  className="w-full px-3 py-2 bg-canvas border border-subtle rounded text-ink-primary focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-ink-primary mb-1">Position</label>
                  <input
                    type="text"
                    value={scheduleForm.position}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, position: e.target.value })}
                    className="w-full px-3 py-2 bg-canvas border border-subtle rounded text-ink-primary focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block font-medium text-ink-primary mb-1">Interview Round</label>
                  <select
                    value={scheduleForm.round}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, round: e.target.value })}
                    className="w-full px-3 py-2 bg-canvas border border-subtle rounded text-ink-primary focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="Initial Screen & Background">Initial Screen & Background</option>
                    <option value="Technical Architecture & System Design">Technical Architecture</option>
                    <option value="Live Coding Challenge & Deep Dive">Live Coding Challenge</option>
                    <option value="UI Component Architecture">UI Architecture</option>
                    <option value="Founders Leadership & Culture Fit">Founders Leadership</option>
                    <option value="Executive Offer Discussion">Offer Discussion</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-ink-primary mb-1">Interviewer</label>
                <input
                  type="text"
                  value={scheduleForm.interviewer}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, interviewer: e.target.value })}
                  placeholder="e.g. Sarah Jenkins (VP Engineering)"
                  className="w-full px-3 py-2 bg-canvas border border-subtle rounded text-ink-primary focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block font-medium text-ink-primary mb-1">
                    Date <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={scheduleForm.scheduledDate}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledDate: e.target.value })}
                    className="w-full px-3 py-2 bg-canvas border border-subtle rounded text-ink-primary focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block font-medium text-ink-primary mb-1">Time</label>
                  <input
                    type="time"
                    value={scheduleForm.scheduledTime}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledTime: e.target.value })}
                    className="w-full px-3 py-2 bg-canvas border border-subtle rounded text-ink-primary focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-ink-primary mb-1">Meeting Link (Video)</label>
                <input
                  type="url"
                  value={scheduleForm.meetingLink}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, meetingLink: e.target.value })}
                  placeholder="https://meet.google.com/..."
                  className="w-full px-3 py-2 bg-canvas border border-subtle rounded text-ink-primary focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="pt-3 border-t border-subtle flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-3 py-1.5 text-ink-secondary hover:text-ink-primary bg-surface hover:bg-stone-100 rounded border border-subtle transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  data-testid="submit-schedule-btn"
                  className="px-4 py-1.5 font-semibold text-white bg-accent hover:bg-accent/90 rounded shadow-xs transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Scheduling...' : 'Confirm Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Feedback Modal */}
      {selectedInterviewForFeedback && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setSelectedInterviewForFeedback(null)}
        >
          <div
            className="w-full max-w-md bg-surface rounded-lg shadow-xl border border-subtle overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-subtle bg-canvas">
              <div>
                <h2 className="text-sm font-bold text-ink-primary">Submit Interview Feedback</h2>
                <p className="text-[11px] text-ink-tertiary">
                  {selectedInterviewForFeedback.candidateName} · {selectedInterviewForFeedback.round}
                </p>
              </div>
              <button
                onClick={() => setSelectedInterviewForFeedback(null)}
                className="p-1 text-ink-tertiary hover:text-ink-primary rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFeedbackSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-ink-primary mb-1">
                  Overall Candidate Evaluation Score
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setFeedbackRating(s)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          s <= feedbackRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-stone-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="font-bold text-ink-primary ml-2">{feedbackRating} / 5 Stars</span>
                </div>
              </div>

              <div>
                <label className="block font-medium text-ink-primary mb-1">
                  Detailed Feedback & Recommendations <span className="text-rose-600">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Record strengths, technical architecture depth, communication, and hire recommendations..."
                  data-testid="input-feedback-text"
                  className="w-full px-3 py-2 bg-canvas border border-subtle rounded text-ink-primary focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="pt-3 border-t border-subtle flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedInterviewForFeedback(null)}
                  className="px-3 py-1.5 text-ink-secondary hover:text-ink-primary bg-surface hover:bg-stone-100 rounded border border-subtle transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  data-testid="submit-feedback-btn"
                  className="px-4 py-1.5 font-semibold text-white bg-accent hover:bg-accent/90 rounded shadow-xs transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Feedback & Complete Round'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
