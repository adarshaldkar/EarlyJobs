import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import { HIRING_STAGES, HiringStage } from '../../types';
import { createCandidate, getApiErrorMessage } from '../../lib/api';
import { useToast } from '../../components/Toast';

// Form validation schema matching backend constraints
const createCandidateFormSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
  email: z.string().trim().email('Invalid email address format').toLowerCase(),
  phone: z.string().trim().optional(),
  position: z.string().trim().min(2, 'Position must be at least 2 characters').max(100, 'Position cannot exceed 100 characters'),
  experienceYears: z
    .number({ invalid_type_error: 'Experience must be a number' })
    .min(0, 'Experience cannot be negative')
    .max(50, 'Experience cannot exceed 50 years'),
  skills: z.string().optional(),
  resumeUrl: z
    .string()
    .trim()
    .optional()
    .refine((val) => {
      if (!val || val === '') return true;
      try {
        const parsed = new URL(val);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch {
        return false;
      }
    }, 'resumeUrl must be a valid http: or https: URL'),
  notes: z.string().trim().max(2000, 'Notes cannot exceed 2000 characters').optional(),
  rating: z.number().min(0).max(5).default(0),
  tags: z.string().optional(),
  stage: z.enum(HIRING_STAGES).default('Applied')
});

type FormData = z.infer<typeof createCandidateFormSchema>;

interface CandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CandidateModal: React.FC<CandidateModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { showToast } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(createCandidateFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      position: '',
      experienceYears: 0,
      skills: '',
      resumeUrl: '',
      notes: '',
      rating: 0,
      tags: '',
      stage: 'Applied'
    }
  });

  const handleClose = () => {
    setServerError(null);
    reset();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      setServerError(null);

      // Parse comma-separated skills
      const parsedSkills = data.skills
        ? data.skills
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      // Parse comma-separated tags
      const parsedTags = data.tags
        ? data.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

      await createCandidate({
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        position: data.position,
        experienceYears: Number(data.experienceYears),
        skills: parsedSkills,
        resumeUrl: data.resumeUrl || undefined,
        notes: data.notes || undefined,
        rating: Number(data.rating) || 0,
        tags: parsedTags,
        stage: data.stage as HiringStage
      });

      showToast(`Candidate ${data.name} added successfully.`, 'success');
      handleClose();
      onSuccess();
    } catch (err: any) {
      const msg = getApiErrorMessage(err);
      if (err.response?.status === 409 || msg.toLowerCase().includes('already exists')) {
        setError('email', { message: 'A candidate with this email address already exists' });
        setServerError('A candidate with this email address already exists');
      } else {
        setServerError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-primary/40 backdrop-blur-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="relative w-full max-w-lg bg-surface border border-subtle rounded shadow-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-subtle">
          <div>
            <h2 id="modal-title" className="text-sm font-semibold text-ink-primary">
              Add New Candidate
            </h2>
            <p className="text-xs text-ink-secondary mt-0.5">
              Enter applicant details to add them to the recruitment pipeline.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-ink-tertiary hover:text-ink-primary p-1 rounded transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto px-6 py-5 space-y-4">
          {serverError && (
            <div
              data-testid="modal-error-banner"
              className="flex items-start gap-2.5 p-3 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="sm:col-span-2">
              <label htmlFor="field-name" className="block text-xs font-medium text-ink-primary mb-1">
                Full Name <span className="text-rose-600">*</span>
              </label>
              <input
                id="field-name"
                type="text"
                {...register('name')}
                placeholder="e.g. Aarav Patel"
                data-testid="input-name"
                className="w-full px-3 py-2 text-xs bg-canvas border border-subtle rounded text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-rose-600" data-testid="error-name">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="field-email" className="block text-xs font-medium text-ink-primary mb-1">
                Email Address <span className="text-rose-600">*</span>
              </label>
              <input
                id="field-email"
                type="email"
                {...register('email')}
                placeholder="aarav.patel@example.com"
                data-testid="input-email"
                className="w-full px-3 py-2 text-xs bg-canvas border border-subtle rounded text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-rose-600" data-testid="error-email">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="field-phone" className="block text-xs font-medium text-ink-primary mb-1">Phone Number</label>
              <input
                id="field-phone"
                type="tel"
                {...register('phone')}
                placeholder="+91 98765 43210"
                data-testid="input-phone"
                className="w-full px-3 py-2 text-xs bg-canvas border border-subtle rounded text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
              />
              {errors.phone && <p className="mt-1 text-xs text-rose-600">{errors.phone.message}</p>}
            </div>

            {/* Position */}
            <div>
              <label htmlFor="field-position" className="block text-xs font-medium text-ink-primary mb-1">
                Target Position <span className="text-rose-600">*</span>
              </label>
              <input
                id="field-position"
                type="text"
                {...register('position')}
                placeholder="e.g. Frontend Engineer"
                data-testid="input-position"
                className="w-full px-3 py-2 text-xs bg-canvas border border-subtle rounded text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
              />
              {errors.position && (
                <p className="mt-1 text-xs text-rose-600" data-testid="error-position">
                  {errors.position.message}
                </p>
              )}
            </div>

            {/* Experience Years */}
            <div>
              <label htmlFor="field-experience" className="block text-xs font-medium text-ink-primary mb-1">
                Experience (Years) <span className="text-rose-600">*</span>
              </label>
              <input
                id="field-experience"
                type="number"
                step="1"
                min="0"
                max="50"
                {...register('experienceYears', { valueAsNumber: true })}
                data-testid="input-experience"
                className="w-full px-3 py-2 text-xs bg-canvas border border-subtle rounded text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
              />
              {errors.experienceYears && (
                <p className="mt-1 text-xs text-rose-600" data-testid="error-experience">
                  {errors.experienceYears.message}
                </p>
              )}
            </div>

            {/* Initial Stage */}
            <div>
              <label htmlFor="field-stage" className="block text-xs font-medium text-ink-primary mb-1">Initial Stage</label>
              <select
                id="field-stage"
                {...register('stage')}
                data-testid="select-initial-stage"
                className="w-full px-3 py-2 text-xs bg-canvas border border-subtle rounded text-ink-primary focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
              >
                {HIRING_STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </div>

            {/* Resume URL */}
            <div>
              <label htmlFor="field-resume-url" className="block text-xs font-medium text-ink-primary mb-1">Resume Link (URL)</label>
              <input
                id="field-resume-url"
                type="url"
                {...register('resumeUrl')}
                placeholder="https://drive.google.com/..."
                data-testid="input-resume-url"
                className="w-full px-3 py-2 text-xs bg-canvas border border-subtle rounded text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
              />
              {errors.resumeUrl && (
                <p className="mt-1 text-xs text-rose-600" data-testid="error-resume-url">
                  {errors.resumeUrl.message}
                </p>
              )}
            </div>

            {/* Rating */}
            <div>
              <label htmlFor="field-rating" className="block text-xs font-medium text-ink-primary mb-1">
                Candidate Rating (0–5 Stars)
              </label>
              <select
                id="field-rating"
                {...register('rating', { valueAsNumber: true })}
                data-testid="input-rating"
                className="w-full px-3 py-2 text-xs bg-canvas border border-subtle rounded text-ink-primary focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
              >
                <option value={0}>0 - Unrated</option>
                <option value={1}>1 - Below Expectations (★)</option>
                <option value={2}>2 - Developing (★★)</option>
                <option value={3}>3 - Solid Candidate (★★★)</option>
                <option value={4}>4 - Strong Hire (★★★★)</option>
                <option value={5}>5 - Exceptional / Top Talent (★★★★★)</option>
              </select>
            </div>

            {/* Quick Tags */}
            <div className="sm:col-span-2">
              <label htmlFor="field-tags" className="block text-xs font-medium text-ink-primary mb-1">
                Recruiter Tags (comma-separated, e.g. Referral, Top Talent, Immediate Joiner)
              </label>
              <input
                id="field-tags"
                type="text"
                {...register('tags')}
                placeholder="Top Talent, Referral, Immediate Joiner"
                data-testid="input-tags"
                className="w-full px-3 py-2 text-xs bg-canvas border border-subtle rounded text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
              />
            </div>

            {/* Skills */}
            <div className="sm:col-span-2">
              <label htmlFor="field-skills" className="block text-xs font-medium text-ink-primary mb-1">
                Skills (comma-separated)
              </label>
              <input
                id="field-skills"
                type="text"
                {...register('skills')}
                placeholder="React, TypeScript, Node.js, MongoDB"
                data-testid="input-skills"
                className="w-full px-3 py-2 text-xs bg-canvas border border-subtle rounded text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
              />
            </div>

            {/* Notes */}
            <div className="sm:col-span-2">
              <label htmlFor="field-notes" className="block text-xs font-medium text-ink-primary mb-1">Recruiter Notes</label>
              <textarea
                id="field-notes"
                rows={2}
                {...register('notes')}
                placeholder="Initial recruiter impressions, interview notes, etc."
                data-testid="input-notes"
                className="w-full px-3 py-2 text-xs bg-canvas border border-subtle rounded text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
              />
              {errors.notes && <p className="mt-1 text-xs text-rose-600">{errors.notes.message}</p>}
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-subtle">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-3 py-1.5 text-xs font-medium text-ink-secondary hover:text-ink-primary bg-stone-100 hover:bg-stone-200 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              data-testid="submit-candidate-btn"
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-accent hover:bg-accent-hover disabled:opacity-50 rounded flex items-center gap-1.5 shadow-sm transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Candidate'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
