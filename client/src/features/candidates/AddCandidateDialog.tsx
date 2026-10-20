import { useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Loader2, X } from 'lucide-react';
import { ApiRequestError } from '../../lib/api';
import { useCreateCandidate } from './candidateHooks';
import { CandidateCreateInput } from './types';

const isHttpUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const candidateFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(100, 'Name must not exceed 100 characters.'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Enter a valid email address.'),
  phone: z.string().trim().max(20, 'Phone must not exceed 20 characters.'),
  position: z
    .string()
    .trim()
    .min(2, 'Position must be at least 2 characters.')
    .max(100, 'Position must not exceed 100 characters.'),
  experienceYears: z.preprocess(
    (value) =>
      value === '' || value === undefined || value === null
        ? undefined
        : Number(value),
    z
      .number({
        required_error: 'Years of experience is required.',
        invalid_type_error: 'Enter a valid number of years.'
      })
      .int('Experience must be a whole number.')
      .min(0, 'Experience cannot be negative.')
      .max(50, 'Experience cannot exceed 50 years.')
  ),
  skills: z
    .string()
    .trim()
    .max(620, 'Enter no more than 20 skills.')
    .refine(
      (value) => {
        const skills = value.split(',').map((item) => item.trim()).filter(Boolean);
        return skills.length <= 20 && skills.every((skill) => skill.length <= 30);
      },
      'Use up to 20 skills, each 30 characters or fewer.'
    ),
  resumeUrl: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || isHttpUrl(value),
      'Enter a valid HTTP or HTTPS resume link.'
    )
});

type FormInput = z.input<typeof candidateFormSchema>;
type FormValues = z.output<typeof candidateFormSchema>;

interface AddCandidateDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id + '-error'} className="mt-1.5 text-xs font-medium text-rose-700" role="alert">
      {message}
    </p>
  );
}

export default function AddCandidateDialog({
  open,
  onClose,
  onCreated
}: AddCandidateDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const [serverError, setServerError] = useState('');
  const createMutation = useCreateCandidate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(candidateFormSchema) as any,
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      position: '',
      experienceYears: '',
      skills: '',
      resumeUrl: ''
    }
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;

    openerRef.current = document.activeElement as HTMLElement | null;
    if (!dialog.open) dialog.showModal();

    return () => {
      if (dialog.open) dialog.close();
      openerRef.current?.focus();
    };
  }, [open]);

  const submit = async (values: FormValues) => {
    setServerError('');

    const input: CandidateCreateInput = {
      name: values.name,
      email: values.email,
      position: values.position,
      experienceYears: values.experienceYears,
      phone: values.phone.trim() || undefined,
      skills: values.skills
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean),
      resumeUrl: values.resumeUrl.trim() || undefined
    };

    try {
      await createMutation.mutateAsync(input);
      reset();
      onCreated();
      onClose();
    } catch (error) {
      if (error instanceof ApiRequestError && error.code === 'DUPLICATE_EMAIL') {
        setServerError('A candidate with this email address already exists.');
      } else if (error instanceof ApiRequestError && error.status === 409) {
        setServerError(error.message || 'This candidate conflicts with an existing record.');
      } else {
        setServerError(
          error instanceof Error
            ? error.message
            : 'Unable to save the candidate. Please try again.'
        );
      }
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="add-candidate-title"
      className="m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-lg border border-subtle bg-surface p-0 text-ink-primary shadow-2xl backdrop:bg-stone-950/30"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="flex items-start justify-between gap-4 border-b border-subtle px-5 py-4 sm:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">
            Candidate intake
          </p>
          <h2 id="add-candidate-title" className="mt-1 text-lg font-semibold">
            Add candidate
          </h2>
          <p className="mt-1 text-sm text-ink-secondary">
            Add a candidate to your hiring pipeline.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close add candidate dialog"
          className="rounded-md p-2 text-ink-secondary transition hover:bg-stone-100 hover:text-ink-primary"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <form className="space-y-5 px-5 py-5 sm:px-6" noValidate onSubmit={handleSubmit(submit)}>
        {serverError && (
          <div
            role="alert"
            aria-live="assertive"
            data-testid="candidate-server-error"
            className="flex items-start justify-between gap-3 rounded-md border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-800"
          >
            <span>{serverError}</span>
            <button
              type="button"
              onClick={() => setServerError('')}
              aria-label="Dismiss save error"
              className="shrink-0 rounded p-0.5 hover:bg-rose-100"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="candidate-name" className="mb-1.5 block text-sm font-medium">
              Full name <span className="text-rose-600" aria-hidden="true">*</span>
            </label>
            <input
              id="candidate-name"
              autoComplete="name"
              {...register('name')}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'candidate-name-error' : undefined}
              className="w-full rounded-md border border-subtle bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-ink-tertiary focus:border-accent focus:ring-2 focus:ring-accent/15"
              placeholder="e.g. Priya Sharma"
            />
            <FieldError id="candidate-name" message={errors.name?.message} />
          </div>

          <div>
            <label htmlFor="candidate-email" className="mb-1.5 block text-sm font-medium">
              Email address <span className="text-rose-600" aria-hidden="true">*</span>
            </label>
            <input
              id="candidate-email"
              type="email"
              autoComplete="email"
              {...register('email')}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'candidate-email-error' : undefined}
              className="w-full rounded-md border border-subtle bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-ink-tertiary focus:border-accent focus:ring-2 focus:ring-accent/15"
              placeholder="priya@example.com"
            />
            <FieldError id="candidate-email" message={errors.email?.message} />
          </div>

          <div>
            <label htmlFor="candidate-position" className="mb-1.5 block text-sm font-medium">
              Target position <span className="text-rose-600" aria-hidden="true">*</span>
            </label>
            <input
              id="candidate-position"
              {...register('position')}
              aria-invalid={Boolean(errors.position)}
              aria-describedby={errors.position ? 'candidate-position-error' : undefined}
              className="w-full rounded-md border border-subtle bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-ink-tertiary focus:border-accent focus:ring-2 focus:ring-accent/15"
              placeholder="e.g. Frontend Engineer"
            />
            <FieldError id="candidate-position" message={errors.position?.message} />
          </div>

          <div>
            <label htmlFor="candidate-experience" className="mb-1.5 block text-sm font-medium">
              Years of experience <span className="text-rose-600" aria-hidden="true">*</span>
            </label>
            <input
              id="candidate-experience"
              type="number"
              min="0"
              max="50"
              step="1"
              inputMode="numeric"
              {...register('experienceYears')}
              aria-invalid={Boolean(errors.experienceYears)}
              aria-describedby={errors.experienceYears ? 'candidate-experience-error' : undefined}
              className="w-full rounded-md border border-subtle bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-ink-tertiary focus:border-accent focus:ring-2 focus:ring-accent/15"
              placeholder="0"
            />
            <FieldError id="candidate-experience" message={errors.experienceYears?.message} />
          </div>

          <div>
            <label htmlFor="candidate-phone" className="mb-1.5 block text-sm font-medium">
              Phone number <span className="text-xs font-normal text-ink-secondary">(optional)</span>
            </label>
            <input
              id="candidate-phone"
              type="tel"
              autoComplete="tel"
              {...register('phone')}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? 'candidate-phone-error' : undefined}
              className="w-full rounded-md border border-subtle bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-ink-tertiary focus:border-accent focus:ring-2 focus:ring-accent/15"
              placeholder="+91 98765 43210"
            />
            <FieldError id="candidate-phone" message={errors.phone?.message} />
          </div>

          <div>
            <label htmlFor="candidate-resume" className="mb-1.5 block text-sm font-medium">
              Resume link <span className="text-xs font-normal text-ink-secondary">(optional)</span>
            </label>
            <input
              id="candidate-resume"
              type="url"
              {...register('resumeUrl')}
              aria-invalid={Boolean(errors.resumeUrl)}
              aria-describedby={errors.resumeUrl ? 'candidate-resume-error' : undefined}
              className="w-full rounded-md border border-subtle bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-ink-tertiary focus:border-accent focus:ring-2 focus:ring-accent/15"
              placeholder="https://example.com/resume.pdf"
            />
            <FieldError id="candidate-resume" message={errors.resumeUrl?.message} />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="candidate-skills" className="mb-1.5 block text-sm font-medium">
              Skills <span className="text-xs font-normal text-ink-secondary">(optional, comma-separated)</span>
            </label>
            <input
              id="candidate-skills"
              {...register('skills')}
              aria-invalid={Boolean(errors.skills)}
              aria-describedby={errors.skills ? 'candidate-skills-error' : 'candidate-skills-help'}
              className="w-full rounded-md border border-subtle bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-ink-tertiary focus:border-accent focus:ring-2 focus:ring-accent/15"
              placeholder="React, TypeScript, Node.js"
            />
            <p id="candidate-skills-help" className="mt-1.5 text-xs text-ink-secondary">
              Add up to 20 skills. Each skill can contain up to 30 characters.
            </p>
            <FieldError id="candidate-skills" message={errors.skills?.message} />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-subtle pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-subtle bg-white px-4 py-2.5 text-sm font-medium text-ink-primary transition hover:bg-stone-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || createMutation.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {(isSubmitting || createMutation.isPending) && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            Save candidate
          </button>
        </div>
      </form>
    </dialog>
  );
}
